import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Testing Realtime API session creation...')
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY)
    
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice: 'alloy',
        modalities: ['audio', 'text'],
        instructions: 'You are a friendly assistant.',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200
        }
      }),
    })

    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return NextResponse.json(
        { 
          success: false, 
          status: response.status,
          error: errorText 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Session created successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Realtime API session created successfully',
      sessionId: data.id,
      hasClientSecret: !!data.client_secret
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 