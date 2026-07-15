import { useParams } from "react-router-dom"
import GameCanvas from "../components/GameCanvas"
import useWebSocket from "../components/UseWebsocket"

function GamePage() {
    const { id } = useParams<{ id: string }>()

    useWebSocket(id ? `/games/${encodeURIComponent(id)}/ws` : null)

    if (!id) {
        return <main className="page">Missing game ID.</main>
    }

    return (
        <main className="game-page">
            <GameCanvas />
        </main>
    )
}

export default GamePage
