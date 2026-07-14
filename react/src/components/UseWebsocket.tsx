import { useCallback, useEffect, useRef, useState } from 'react'

export type WebSocketStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

export const BASE_URL = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export function getApiUrl(endpoint: string) {
	const normalizedBaseUrl = `${BASE_URL.replace(/\/+$/, '')}/`
	return new URL(endpoint.replace(/^\/+/, ''), normalizedBaseUrl).toString()
}

function getWebSocketUrl(endpoint: string) {
	const url = new URL(getApiUrl(endpoint))
	url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
	return url.toString()
}

function useWebSocket(endpoint: string | null) {
	const url = endpoint ? getWebSocketUrl(endpoint) : null
	const socket = useRef<WebSocket | null>(null)
	const [connectionState, setConnectionState] = useState<{
		url: string
		status: Exclude<WebSocketStatus, 'idle' | 'connecting'>
	} | null>(null)
	const [messageState, setMessageState] = useState<{
		url: string
		value: unknown
	} | null>(null)

	useEffect(() => {
		if (!url) {
			return
		}

		const connection = new WebSocket(url)
		socket.current = connection

		connection.onopen = () => setConnectionState({ url, status: 'open' })
		connection.onmessage = event => setMessageState({ url, value: event.data })
		connection.onclose = () => setConnectionState({ url, status: 'closed' })
		connection.onerror = () => setConnectionState({ url, status: 'error' })

		return () => {
			connection.onopen = null
			connection.onmessage = null
			connection.onclose = null
			connection.onerror = null
			connection.close()

			if (socket.current === connection) {
				socket.current = null
			}
		}
	}, [url])

	const send = useCallback((data: string | Blob | ArrayBuffer | ArrayBufferView<ArrayBuffer>) => {
		if (socket.current?.readyState !== WebSocket.OPEN) {
			return false
		}

		socket.current.send(data)
		return true
	}, [])

	const close = useCallback((code?: number, reason?: string) => {
		socket.current?.close(code, reason)
	}, [])

	const status: WebSocketStatus = !url
		? 'idle'
		: connectionState?.url === url
			? connectionState.status
			: 'connecting'
	const lastMessage = messageState?.url === url ? messageState.value : null

	return { socket, status, lastMessage, send, close }
}

export default useWebSocket
