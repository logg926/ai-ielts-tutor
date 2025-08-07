import { NextRequest, NextResponse } from 'next/server'
import { OPENAI_API_KEY } from '@/lib/envSetup'
import { systemPrompt, tools } from '@/app/systemPrompt'


export async function POST(request: NextRequest) {
  try {
    console.log('=== SESSION API ROUTE START ===')
    console.log('Request received at:', new Date().toISOString())
    
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { agentConfig } = body
    console.log('Agent config:', JSON.stringify(agentConfig, null, 2))
    
    console.log('API Key exists:', !!OPENAI_API_KEY)
    console.log('API Key length:', OPENAI_API_KEY?.length || 0)
    console.log('API Key prefix:', OPENAI_API_KEY?.substring(0, 10) + '...' || 'N/A')

    const requestBody = {
      model: 'gpt-4o-realtime-preview',
      voice: 'alloy',
      modalities: ['audio', 'text'],
      instructions: systemPrompt,
      input_audio_transcription: {
        model: 'whisper-1'
      },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 200
      },
      tools: tools,
    }
    
    console.log('OpenAI request body:', JSON.stringify(requestBody, null, 2))
    console.log('Making request to OpenAI Realtime API...')

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('OpenAI response status:', response.status)
    console.log('OpenAI response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI error response:', errorText)
      console.log('=== SESSION API ROUTE ERROR ===')
      return NextResponse.json(
        { error: 'Failed to create session', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('OpenAI success response:', JSON.stringify(data, null, 2))
    console.log('Session ID:', data.id)
    console.log('Client secret exists:', !!data.client_secret)
    console.log('Client secret length:', data.client_secret?.length || 0)
    console.log('=== SESSION API ROUTE SUCCESS ===')
    
    return NextResponse.json({
      sessionId: data.id,
      clientSecret: data.client_secret
    })
  } catch (error) {
    console.error('Session creation error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.log('=== SESSION API ROUTE EXCEPTION ===')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 