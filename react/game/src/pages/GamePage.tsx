import { useParams } from "react-router-dom"
import useWebSocket from "../components/UseWebsocket"

function GamePage() {
    const { id } = useParams<{ id: string }>()

    const websocketEndpoint = id
        ? `/games/${encodeURIComponent(id)}/ws`
        : null

    useWebSocket(websocketEndpoint)

    if (!id) {
        return <main className="page">Missing game ID.</main>
    }

    return (
        <main className="page" />
    )
}

export default GamePage
