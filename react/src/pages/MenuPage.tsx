import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getApiUrl } from "../components/UseWebsocket"
import { paths } from "../routes/Routes"


function MenuPage() {
    const [gameIds, setGameIds] = useState<string[]>([])

    useEffect(() => {
        fetch(getApiUrl("/games"))
            .then(response => response.json())
            .then(data => setGameIds(data.game_ids))
    }, [])

	const createGame = () => {
		fetch(getApiUrl("/games"), { method: "POST" })
			.then(response => response.json())
			.then(data => setGameIds(currentIds => [...currentIds, data.game_id]))
	}

	    return (
	        <main className="page menu-page">
	            <button onClick={createGame}>Create game</button>
	            <ul>
                {gameIds.map(gameId => (
                    <div>
                        <li key={gameId}>{gameId}</li>
                        <Link to={paths.game(gameId)} >Enter</Link>
                    </div>
                ))}
            </ul>
        </main>
    )
}

export default MenuPage
