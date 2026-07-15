import { useEffect, useRef } from "react"

function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const resizeCanvas = () => {
            const width = window.innerWidth
            const height = window.innerHeight
            const pixelRatio = window.devicePixelRatio || 1

            canvas.width = Math.round(width * pixelRatio)
            canvas.height = Math.round(height * pixelRatio)

            // Keep drawing coordinates in CSS pixels while rendering sharply on
            // high-density displays.
            ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
            ctx.clearRect(0, 0, width, height)
        }

        resizeCanvas()
        window.addEventListener("resize", resizeCanvas)

        

        return () => window.removeEventListener("resize", resizeCanvas)
    }, [])

    return <canvas ref={canvasRef} className="game-canvas" />
}

export default GameCanvas
