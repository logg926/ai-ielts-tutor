'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react'
import PDFViewer, { PDFViewerRef } from '@/components/PDFViewer'

export default function App() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [transcripts, setTranscripts] = useState<Array<{id: string, role: 'user' | 'assistant', text: string, timestamp: Date}>>([])
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const pdfViewerRef = useRef<PDFViewerRef | null>(null)

  // Create audio element programmatically like the SDK does
  const audioElement = React.useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('audio');
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }, []);

  // Attach audio element once it exists
  useEffect(() => {
    if (audioElement && !audioElementRef.current) {
      audioElementRef.current = audioElement;
    }
  }, [audioElement]);

  const getEphemeralKey = async (): Promise<string> => {
    console.log('=== GETTING EPHEMERAL KEY ===')
    console.log('Making request to /api/session...')
    
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentConfig: {
          name: 'SimpleVoiceChat',
          instructions: 'You are a helpful and friendly AI assistant. You can engage in natural conversations, answer questions, and help with various tasks.',
          model: 'gpt-4o-realtime-preview'
        }
      }),
    })

    console.log('Session API response status:', response.status)
    console.log('Session API response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Session API error response:', errorText)
      throw new Error(`Failed to get ephemeral key: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Session API success response:', JSON.stringify(data, null, 2))
    console.log('Client secret exists:', !!data.clientSecret)
    console.log('Client secret length:', data.clientSecret?.value?.length || 0)
    console.log('Client secret prefix:', data.clientSecret?.value?.substring(0, 10) + '...' || 'N/A')
    console.log('=== EPHEMERAL KEY OBTAINED ===')
    
    return data.clientSecret.value
  }

  const connect = async () => {
    try {
      console.log('=== CONNECTING TO REALTIME API ===')
      setStatus('connecting')
      setError(null)

      // Get ephemeral key
      console.log('Step 1: Getting ephemeral key...')
      const clientSecret = await getEphemeralKey()
      console.log('Ephemeral key obtained successfully')

      // Create peer connection
      console.log('Step 2: Creating RTCPeerConnection...')
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })
      peerConnectionRef.current = pc
      console.log('RTCPeerConnection created')

      // Get user media
      console.log('Step 3: Getting user media...')
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
      console.log('User media obtained:', stream.getTracks().length, 'tracks')

      // Add audio track to peer connection
      console.log('Step 4: Adding audio tracks to peer connection...')
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })
      console.log('Audio tracks added to peer connection')

      // Handle incoming audio tracks
      pc.ontrack = (event) => {
        console.log('Incoming track received:', event.track.kind)
        console.log('Audio element ref exists:', !!audioElementRef.current)
        console.log('Audio element ready state:', audioElementRef.current?.readyState)
        
        if (event.track.kind === 'audio') {
          console.log('Setting up audio playback for incoming audio track')
          console.log('Stream tracks:', event.streams[0]?.getTracks().length || 0)
          
          if (audioElementRef.current) {
            audioElementRef.current.srcObject = event.streams[0]
            console.log('Audio srcObject set, attempting to play...')
            audioElementRef.current.play().catch(err => {
              console.error('Error playing audio:', err)
            })
          } else {
            console.error('Audio element ref is null!')
          }
        }
      }

      // Create data channel
      console.log('Step 5: Creating data channel...')
      const dc = pc.createDataChannel('oai-events', { ordered: true })
      dataChannelRef.current = dc
      console.log('Data channel created')

      dc.onopen = () => {
        console.log('Data channel opened')
      }

      dc.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('Data channel message received:', data)
          
          if (data.type === 'input_audio_buffer.speech_started') {
            setIsRecording(true)
          } else if (data.type === 'input_audio_buffer.speech_stopped') {
            setIsRecording(false)
          } else if (data.type === 'conversation.item.input_audio_transcription.completed') {
            // User's speech transcribed
            const userText = data.transcript
            const transcriptId = `user_${Date.now()}`
            setTranscripts(prev => [...prev, {
              id: transcriptId,
              role: 'user',
              text: userText,
              timestamp: new Date()
            }])
          } else if (data.type === 'response.audio_transcript.done') {
            // AI's response transcribed
            const aiText = data.transcript
            const transcriptId = `assistant_${Date.now()}`
            setTranscripts(prev => [...prev, {
              id: transcriptId,
              role: 'assistant', 
              text: aiText,
              timestamp: new Date()
            }])
          } else if (data.type === 'response.function_call_arguments.done') {
            // Handle function calls from the AI
            console.log('Function call received:', data)
            if (data.name === 'go_to_page' && data.arguments) {
              try {
                const args = JSON.parse(data.arguments)
                const pageNumber = args.page_number
                if (pageNumber && pdfViewerRef.current) {
                  console.log(`AI requested to go to page ${pageNumber}`)
                  pdfViewerRef.current.goToPage(pageNumber)
                }
              } catch (err) {
                console.error('Error parsing function call arguments:', err)
              }
            }
          }
        } catch (err) {
          console.error('Error parsing data channel message:', err)
        }
      }

      dc.onerror = (error) => {
        console.error('Data channel error:', error)
      }

      dc.onclose = () => {
        console.log('Data channel closed')
      }

      // Create offer
      console.log('Step 6: Creating offer...')
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      })
      await pc.setLocalDescription(offer)
      console.log('Offer created and set as local description')
      console.log('Offer SDP length:', offer.sdp?.length || 0)

      // Send offer to OpenAI
      console.log('Step 7: Sending offer to OpenAI Realtime API...')
      console.log('Using client secret prefix:', clientSecret.substring(0, 10) + '...')
      
      const sdpResponse = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview', {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${clientSecret}`,
          'Content-Type': 'application/sdp',
          'OpenAI-Beta': 'realtime=v1'
        },
      })

      console.log('SDP response status:', sdpResponse.status)
      console.log('SDP response headers:', Object.fromEntries(sdpResponse.headers.entries()))

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text()
        console.error('SDP exchange error response:', errorText)
        throw new Error(`SDP exchange failed: ${sdpResponse.status} - ${errorText}`)
      }

      const answerSdp = await sdpResponse.text()
      console.log('SDP answer received, length:', answerSdp.length)
      
      const answer = {
        type: 'answer' as const,
        sdp: answerSdp,
      }

      console.log('Step 8: Setting remote description...')
      await pc.setRemoteDescription(answer)
      console.log('Remote description set successfully')
      
      setStatus('connected')
      setSessionId('connected')
      console.log('=== CONNECTION SUCCESSFUL ===')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('=== CONNECTION FAILED ===')
      console.error('Error details:', err)
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace')
      setError(errorMessage)
      setStatus('error')
    }
  }

  const disconnect = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
    }
    setStatus('idle')
    setSessionId(null)
    setError(null)
    setIsRecording(false)
    setTranscripts([]) // Clear transcripts on disconnect
  }

  const startListening = () => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      setError('Data channel not ready')
      return
    }

    const event = {
      type: 'input_audio_buffer.append',
      audio: ''
    }
    dataChannelRef.current.send(JSON.stringify(event))
    console.log('Started listening')
  }

  const stopListening = () => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      return
    }

    const event = {
      type: 'input_audio_buffer.commit'
    }
    dataChannelRef.current.send(JSON.stringify(event))
    console.log('Stopped listening')
  }

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-500'
      case 'connecting':
        return 'text-yellow-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'error':
        return 'Error'
      default:
        return 'Disconnected'
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-2rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-gray-800">
                AI Voice Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Display */}
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  status === 'connected' ? 'bg-green-100 text-green-800' :
                  status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                  status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {status === 'connecting' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {status === 'connected' && '🟢'}
                  {status === 'error' && '🔴'}
                  {status === 'idle' && '⚪'}
                  {status === 'connected' ? 'Connected' :
                   status === 'connecting' ? 'Connecting...' :
                   status === 'error' ? 'Error' : 'Disconnected'}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3"
                >
                  <p className="text-red-700 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Controls */}
              <div className="flex flex-wrap gap-3 justify-center">
                {status === 'idle' && (
                  <Button
                    onClick={connect}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                )}

                {status === 'connected' && (
                  <>
                    <Button
                      onClick={disconnect}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <PhoneOff className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                    
                    <Button
                      onClick={startListening}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={isRecording}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Start Listening
                    </Button>
                    
                    <Button
                      onClick={stopListening}
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      disabled={!isRecording}
                    >
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Listening
                    </Button>
                  </>
                )}

                {status === 'error' && (
                  <Button
                    onClick={connect}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Retry Connection
                  </Button>
                )}
              </div>

              {/* Recording Status */}
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center px-3 py-2 bg-red-100 text-red-800 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                    Recording...
                  </div>
                </motion.div>
              )}

              {/* Transcript Display */}
              {transcripts.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Conversation</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {transcripts.map((transcript) => (
                      <motion.div
                        key={transcript.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-lg ${
                          transcript.role === 'user' 
                            ? 'bg-blue-50 border border-blue-200 ml-8' 
                            : 'bg-gray-50 border border-gray-200 mr-8'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            transcript.role === 'user' ? 'bg-blue-500' : 'bg-gray-500'
                          }`} />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-600 mb-1">
                              {transcript.role === 'user' ? 'You' : 'AI Assistant'}
                            </div>
                            <div className="text-gray-800">{transcript.text}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {transcript.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              
            </CardContent>
          </Card>
        </motion.div>
        
        {/* PDF Viewer Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-full"
        >
          <PDFViewer 
            ref={pdfViewerRef}
            className="h-full"
          />
        </motion.div>
        
        </div>
      </div>
    </div>
  )
} 