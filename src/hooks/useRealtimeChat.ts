'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Message } from '@/types/chat'

interface RealtimeEvent {
  type: string
  data?: any
  transcript?: string
  delta?: string
  text?: string
}

export function useRealtimeChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

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

      console.log('Creating WebRTC connection with ephemeral key:', ephemeralKey.substring(0, 10) + '...')

      // Create peer connection with proper configuration
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })
      peerConnectionRef.current = pc

      // Set up audio element for remote audio
      const audioEl = document.createElement('audio')
      audioEl.autoplay = true
      audioEl.controls = false
      audioElementRef.current = audioEl
      
      pc.ontrack = (event) => {
        console.log('Received remote audio track')
        audioEl.srcObject = event.streams[0]
      }

      // Get user media for microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1
        }
      })
      mediaStreamRef.current = stream
      
      // Add audio track to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Create data channel for events
      const dc = pc.createDataChannel('oai-events', {
        ordered: true
      })
      dataChannelRef.current = dc
      
      dc.onopen = () => {
        console.log('Data channel opened successfully')
      }
      
      dc.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data)
          console.log('Realtime event received:', realtimeEvent)
          handleRealtimeEvent(realtimeEvent)
        } catch (e) {
          console.error('Error parsing realtime event:', e)
        }
      }

      dc.onerror = (error) => {
        console.error('Data channel error:', error)
      }

      // Create offer and connect
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      })
      await pc.setLocalDescription(offer)

      console.log('Sending SDP offer to OpenAI...')
      
      const baseUrl = 'https://api.openai.com/v1/realtime'
      const model = 'gpt-4o-realtime-preview'
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
          'OpenAI-Beta': 'realtime=v1'
        },
      })

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text()
        console.error('SDP response error:', sdpResponse.status, errorText)
        throw new Error(`Failed to establish WebRTC connection: ${sdpResponse.status} - ${errorText}`)
      }

      const answerSdp = await sdpResponse.text()
      console.log('Received SDP answer from OpenAI')

      const answer = {
        type: 'answer' as const,
        sdp: answerSdp,
      }
      
      await pc.setRemoteDescription(answer)
      console.log('WebRTC connection established successfully')
      setIsConnected(true)
      
    } catch (err) {
      console.error('Connection error:', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
      disconnect()
    } finally {
      setIsConnecting(false)
    }
  }, [isConnecting, isConnected])

  const disconnect = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null
      audioElementRef.current = null
    }
    
    dataChannelRef.current = null
    setIsConnected(false)
    setIsListening(false)
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
      case 'input_audio_buffer.speech_started':
        console.log('Speech started detected')
        setIsListening(true)
        break
      case 'input_audio_buffer.speech_stopped':
        console.log('Speech stopped detected')
        setIsListening(false)
        break
      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: event.transcript,
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, userMessage])
        }
        break
      case 'response.text.delta':
        // Handle streaming text response
        console.log('Text delta received:', event.delta)
        break
      case 'response.text.done':
        if (event.text) {
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: event.text,
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, assistantMessage])
        }
        break
      case 'error':
        console.error('Realtime API error:', event)
        setError(event.data?.message || 'An error occurred')
        break
      default:
        console.log('Unhandled event type:', event.type, event)
    }
  }, [])

  const startListening = useCallback(() => {
    if (!isConnected || !dataChannelRef.current) {
      console.error('Cannot start listening: not connected')
      return
    }
    
    console.log('Starting listening...')
    
    // Send start listening event
    const event = {
      type: 'input_audio_buffer.append',
      audio: '' // This will be filled with actual audio data
    }
    dataChannelRef.current.send(JSON.stringify(event))
  }, [isConnected])

  const stopListening = useCallback(() => {
    if (!isConnected || !dataChannelRef.current) {
      console.error('Cannot stop listening: not connected')
      return
    }
    
    console.log('Stopping listening...')
    
    // Send stop listening event
    const event = {
      type: 'input_audio_buffer.commit'
    }
    dataChannelRef.current.send(JSON.stringify(event))
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
    isListening,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
    clearMessages,
  }
} 