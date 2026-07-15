import asyncio
import math
from uuid import uuid4

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, WebSocketException, status
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


TICK_RATE = 10
TICK_SECONDS = 1 / TICK_RATE

class Player:
    DEFAULT_MAX_SPEED = 2
    DEFAULT_ACCELERATION_TIME = 0.5
    def __init__(self, x, y, max_speed=DEFAULT_MAX_SPEED, acceleration_time=DEFAULT_ACCELERATION_TIME):
        self.x = x
        self.y = y

        self.max_speed = max_speed
        self.acceleration_time = acceleration_time

        self.velocity_x = 0
        self.velocity_y = 0

        self.direction_x = 0
        self.direction_y = 0

    def set_move_direction(self, direction_x, direction_y):
        self.direction_x, self.direction_y = self.normalize_direction(direction_x, direction_y)

    def update(self):
        desired_velocity_x = self.direction_x * self.max_speed
        desired_velocity_y = self.direction_y * self.max_speed

        acceleration_rate = self.max_speed / self.acceleration_time
        max_velocity_step = acceleration_rate * TICK_SECONDS

        velocity_delta_x = desired_velocity_x - self.velocity_x
        velocity_delta_y = desired_velocity_y - self.velocity_y
        velocity_delta_length = math.sqrt(velocity_delta_x**2 + velocity_delta_y**2)

        if velocity_delta_length <= max_velocity_step:
            self.velocity_x = desired_velocity_x
            self.velocity_y = desired_velocity_y
        elif velocity_delta_length > 0:
            step_scale = max_velocity_step / velocity_delta_length
            self.velocity_x += velocity_delta_x * step_scale
            self.velocity_y += velocity_delta_y * step_scale

        self.x += self.velocity_x * TICK_SECONDS
        self.y += self.velocity_y * TICK_SECONDS

    def normalize_direction(self, x, y):
        length = math.sqrt(x * x + y * y)

        if length == 0:
            return 0, 0

        return x / length, y / length


class Map:
    DEFAULT_WIDTH = 32
    DEFAULT_HEIGHT = 32
    DEFAULT_TILE_SIZE = 32
    def __init__(self, width=DEFAULT_WIDTH, height=DEFAULT_HEIGHT, tile_size=DEFAULT_TILE_SIZE):
        self.width = width
        self.height = height
        self.tile_size = tile_size

class Game:
    def __init__(self, game_id, map):
        self.id = game_id
        self.running = True
        self.map = map
        self.tick_count = 0
        self.players = []
        self.connections: set[WebSocket] = set()
        self.task: asyncio.Task | None = None

    async def run(self):
        try:
            while self.running:
                self.update()
                await self.broadcast()
                await asyncio.sleep(TICK_SECONDS)
        except asyncio.CancelledError:
            pass

    def update(self):
        self.tick_count += 1
        print(f"Tick: {self.tick_count}")

    async def broadcast(self):
        disconnected = []

        for websocket in self.connections.copy():
            try:
                await websocket.send_json({"id": self.id})
            except (RuntimeError, WebSocketDisconnect):
                disconnected.append(websocket)

        for websocket in disconnected:
            self.connections.discard(websocket)

    async def stop(self):
        self.running = False

        if self.task is not None:
            self.task.cancel()
            await self.task

        for websocket in self.connections.copy():
            await websocket.close()

        self.connections.clear()

class GameManager:
    def __init__(self):
        self.games = {}

    def create_game(self):
        game_id = str(uuid4())
        game = Game(game_id, Map())
        self.games[game_id] = game
        game.task = asyncio.create_task(game.run())
        return game_id

    async def delete_game(self, game_id):
        game = self.games.pop(game_id, None)

        if game is not None:
            await game.stop()

        return game

    def get_game(self, game_id):
        return self.games.get(game_id)

    def get_game_ids(self):
        return list(self.games.keys())

game_manager = GameManager()

@app.post("/games")
async def start_game():
    game_id = game_manager.create_game()
    return {"game_id": game_id}

@app.delete("/games/{game_id}")
async def delete_game(game_id: str):
    deleted_game = await game_manager.delete_game(game_id)

    if deleted_game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    return {"game_id": game_id}

@app.get("/games")
def get_games():
    return {"game_ids": game_manager.get_game_ids()}

@app.get("/")
def hello():
    return {"message": "HI"}

@app.websocket("/games/{game_id}/ws")
async def websocket(websocket: WebSocket, game_id: str):
    game = game_manager.get_game(game_id)

    if game is None:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION
        )

    await websocket.accept()
    game.connections.add(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        game.connections.discard(websocket)
