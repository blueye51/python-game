from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class UserCreate(BaseModel):
    name: str

@app.get("/")
def hello():
    return {"message": "Hello, World!"}

@app.post("/users", status_code=201)
def create_user(user: UserCreate):
    new_id = max(users.keys()) + 1

    new_user = {
        "id": new_id,
        "name": user.name
    }

    users[new_id] = new_user
    return new_user