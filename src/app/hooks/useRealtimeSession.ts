'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { SessionStatus, TranscriptItem, LoggedEvent } from '../types'
import { useTranscript } from '../contexts/TranscriptContext'
import { useEvents } from '../contexts/EventContext'
import { createAudioBlob, downloadAudio } from '../lib/audioUtils'

interface UseRealtimeSessionProps {
  agentConfig?: {
    name: string
    instructions: string
    model?: string
  }
}

export const useRealtimeSession = ({ agentConfig }: UseRealtimeSessionProps = {}) => {
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  const { addItem, updateItem } = useTranscript()
  const { addEvent } = useEvents()
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const currentTranscriptIdRef = useRef<string | null>(null)

  const logEvent = useCallback((type: string, data: any) => {
    addEvent({ type, data })
    console.log(`[${type}]`, data)
  }, [addEvent])

  const createSession = useCallback(async () => {
    try {
      setStatus('connecting')
      setError(null)
      logEvent('session.creating', { agentConfig })

      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentConfig }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create session')
      }

      const { sessionId: newSessionId, clientSecret } = await response.json()
      setSessionId(newSessionId)
      logEvent('session.created', { sessionId: newSessionId })

      // Initialize WebRTC connection
      await initializeWebRTC(clientSecret)
      
      setStatus('connected')
      logEvent('session.connected', { sessionId: newSessionId })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setStatus('error')
      logEvent('session.error', { error: errorMessage })
    }
  }, [agentConfig, logEvent])

  const initializeWebRTC = useCallback(async (clientSecret: string) => {
    try {
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })
      peerConnectionRef.current = pc

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1
        }
      })
      audioStreamRef.current = stream

      // Add audio track to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Create data channel
      const dc = pc.createDataChannel('oai-events', { ordered: true })
      dataChannelRef.current = dc

      dc.onopen = () => {
        logEvent('datachannel.opened', {})
      }

      dc.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleRealtimeEvent(data)
        } catch (err) {
          console.error('Error parsing data channel message:', err)
        }
      }

      dc.onerror = (error) => {
        logEvent('datachannel.error', { error })
      }

      dc.onclose = () => {
        logEvent('datachannel.closed', {})
      }

      // Create offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      })
      await pc.setLocalDescription(offer)

      // Send offer to OpenAI
      const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=${agentConfig?.model || 'gpt-4o-realtime-preview'}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${clientSecret}`,
          'Content-Type': 'application/sdp',
          'OpenAI-Beta': 'realtime=v1'
        },
      })

      if (!sdpResponse.ok) {
        throw new Error(`SDP exchange failed: ${sdpResponse.status}`)
      }

      const answerSdp = await sdpResponse.text()
      const answer = {
        type: 'answer' as const,
        sdp: answerSdp,
      }

      await pc.setRemoteDescription(answer)
      logEvent('webrtc.connected', {})

    } catch (err) {
      throw new Error(`WebRTC initialization failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [agentConfig?.model, logEvent])

  const handleRealtimeEvent = useCallback((event: any) => {
    logEvent('realtime.event', event)

    switch (event.type) {
      case 'session.created':
        logEvent('session.created', event.data)
        break

      case 'conversation.created':
        logEvent('conversation.created', event.data)
        break

      case 'input_audio_buffer.speech_started':
        setIsRecording(true)
        logEvent('speech.started', event.data)
        break

      case 'input_audio_buffer.speech_stopped':
        setIsRecording(false)
        logEvent('speech.stopped', event.data)
        break

      case 'conversation.item.input_audio_transcription.completed':
        const transcriptItem: TranscriptItem = {
          id: crypto.randomUUID(),
          role: 'user',
          content: event.data.transcript,
          timestamp: new Date(),
          type: 'text'
        }
        addItem(transcriptItem)
        currentTranscriptIdRef.current = transcriptItem.id
        logEvent('transcription.completed', event.data)
        break

      case 'response.text.delta':
        if (currentTranscriptIdRef.current) {
          // Update existing assistant message
          updateItem(currentTranscriptIdRef.current, event.data.delta)
        } else {
          // Create new assistant message
          const assistantItem: TranscriptItem = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: event.data.delta,
            timestamp: new Date(),
            type: 'text'
          }
          addItem(assistantItem)
          currentTranscriptIdRef.current = assistantItem.id
        }
        logEvent('response.delta', event.data)
        break

      case 'response.text.done':
        currentTranscriptIdRef.current = null
        logEvent('response.done', event.data)
        break

      case 'error':
        setError(event.data.message || 'Unknown error')
        logEvent('realtime.error', event.data)
        break

      default:
        logEvent('unknown.event', event)
    }
  }, [addItem, updateItem, logEvent])

  const startListening = useCallback(() => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      setError('Data channel not ready')
      return
    }

    const event = {
      type: 'input_audio_buffer.append',
      audio: ''
    }
    dataChannelRef.current.send(JSON.stringify(event))
    logEvent('listening.started', {})
  }, [logEvent])

  const stopListening = useCallback(() => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      return
    }

    const event = {
      type: 'input_audio_buffer.commit'
    }
    dataChannelRef.current.send(JSON.stringify(event))
    logEvent('listening.stopped', {})
  }, [logEvent])

  const disconnect = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    setStatus('idle')
    setError(null)
    setIsRecording(false)
    setSessionId(null)
    currentTranscriptIdRef.current = null
    logEvent('session.disconnected', {})
  }, [logEvent])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    status,
    error,
    isRecording,
    sessionId,
    createSession,
    startListening,
    stopListening,
    disconnect
  }
} 