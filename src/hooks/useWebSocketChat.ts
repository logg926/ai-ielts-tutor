'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Message } from '@/types/chat'

interface RealtimeEvent {
  type: string
  data?: any
  item?: any
  delta?: string
  text?: string
  transcript?: string
}

export function useWebSocketChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return

    setIsConnecting(true)
    setError(null)

    try {
      // Get ephemeral token from server
      const tokenResponse = await fetch('/api/realtime-session', {
        method: 'POST',
      })
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json()
        throw new Error(`Failed to get session token: ${errorData.error || tokenResponse.statusText}`)
      }
      
      const tokenData = await tokenResponse.json()
      const ephemeralKey = tokenData.client_secret.value

      console.log('Creating WebSocket connection...')
      console.log('Ephemeral key:', ephemeralKey.substring(0, 10) + '...')
      
      // Try different WebSocket connection methods
      let ws: WebSocket
      
      try {
        // Method 1: Direct connection with token in URL
        const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview&authorization=Bearer%20${encodeURIComponent(ephemeralKey)}`
        console.log('Attempting WebSocket connection to:', wsUrl)
        ws = new WebSocket(wsUrl)
      } catch (wsError) {
        console.error('WebSocket creation failed:', wsError)
        throw new Error('Failed to create WebSocket connection')
      }
      
      wsRef.current = ws
      
      ws.onopen = () => {
        console.log('WebSocket connected successfully!')
        setIsConnected(true)
      }
      
      ws.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data)
          console.log('WebSocket event received:', realtimeEvent)
          handleRealtimeEvent(realtimeEvent)
        } catch (e) {
          console.error('Error parsing WebSocket event:', e)
          console.log('Raw event data:', event.data)
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        console.error('WebSocket readyState:', ws.readyState)
        setError('WebSocket connection error - check console for details')
        setIsConnected(false)
      }
      
      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
      }
      
    } catch (err) {
      console.error('Connection setup error:', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setIsConnecting(false)
    }
  }, [isConnecting, isConnected])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    console.log('Processing realtime event:', event)
    
    switch (event.type) {
      case 'session.created':
        console.log('Session created successfully')
        break
      case 'conversation.created':
        console.log('Conversation created')
        break
      case 'conversation.item.created':
        if (event.item?.role === 'user' && event.item?.content?.[0]?.type === 'input_audio') {
          const userMessage: Message = {
            id: event.item.id,
            role: 'user',
            content: event.item.content[0].transcript || 'Voice message',
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, userMessage])
        }
        break
      case 'response.text.delta':
        // Handle streaming text response
        console.log('Text delta received:', event)
        break
      case 'error':
        console.error('Realtime API error:', event)
        setError(event.data?.message || 'An error occurred')
        break
      default:
        console.log('Unhandled event type:', event.type, event)
    }
  }, [])

  const sendMessage = useCallback((text: string) => {
    if (!isConnected || !wsRef.current) {
      console.error('Cannot send message: not connected')
      return
    }
    
    console.log('Sending message:', text)
    
    // Send text message via WebSocket
    const message = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    }
    
    console.log('Sending WebSocket message:', message)
    wsRef.current.send(JSON.stringify(message))
  }, [isConnected])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    messages,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
  }
} 