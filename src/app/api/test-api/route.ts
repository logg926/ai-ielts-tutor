import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    // Test with regular chat completions API
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello, this is a test.' }],
      max_tokens: 10,
    })

    return NextResponse.json({ 
      success: true, 
      message: 'API key is working with regular OpenAI API',
      response: response.choices[0].message.content 
    })
  } catch (error) {
    console.error('API test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'API key test failed'
      },
      { status: 500 }
    )
  }
} 