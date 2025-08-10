import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userInput, context, reportData } = await request.json();

    const systemPrompt = `You are an experienced IELTS writing professor providing personalized guidance to a student about their essay analysis report. 

You should:
- Be encouraging and supportive while being honest about areas for improvement
- Provide specific, actionable advice based on the student's scores and analysis
- Explain IELTS scoring criteria in simple terms
- Give concrete examples when possible
- Keep responses conversational but professional
- Limit responses to 2-3 sentences for voice delivery

Current student context:
${context}

Student's specific question: "${userInput}"

Respond as if you're speaking directly to the student in a helpful, professorial tone.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userInput
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 
      "I'm sorry, I didn't quite understand that. Could you please rephrase your question about your essay analysis?";

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Voice Professor API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
