import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ANALYSIS_PROMPT = `You are an expert IELTS Writing Task 2 examiner. Analyze the provided essay according to IELTS criteria.

Instructions:
1. Provide scores between 1.0-9.0 for each criterion
2. Create 4-8 comparison examples showing key improvements
3. The rewritten text should be significantly improved while maintaining the original argument structure
4. Focus on common IELTS issues: grammar errors, vocabulary choice, sentence structure, coherence
5. Provide practical, actionable feedback in the examiner_tip`;

const ESSAY_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    student_text: {
      type: "string",
      description: "The original essay text provided by the student"
    },
    rewritten_text: {
      type: "string",
      description: "An improved version of the essay maintaining the original argument structure"
    },
    comparison_data: {
      type: "array",
      description: "Array of specific improvements made to the essay",
      items: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "Unique identifier for this comparison"
          },
          original: {
            type: "string",
            description: "Original sentence or phrase from student essay"
          },
          rewritten: {
            type: "string",
            description: "Improved version of the sentence or phrase"
          },
          reason: {
            type: "string",
            description: "Explanation of why this improvement was made"
          },
          pillars: {
            type: "array",
            description: "Relevant IELTS criteria affected by this improvement",
            items: {
              type: "string",
              enum: ["GRA", "LR", "CC", "TR"]
            }
          }
        },
        required: ["id", "original", "rewritten", "reason", "pillars"],
        additionalProperties: false
      },
      minItems: 4,
      maxItems: 8
    },
    overall_score: {
      type: "number",
      description: "Overall IELTS band score",
      minimum: 1.0,
      maximum: 9.0
    },
    task_response: {
      type: "number",
      description: "Task Response score",
      minimum: 1.0,
      maximum: 9.0
    },
    coherence_cohesion: {
      type: "number",
      description: "Coherence and Cohesion score",
      minimum: 1.0,
      maximum: 9.0
    },
    lexical_resource: {
      type: "number",
      description: "Lexical Resource score",
      minimum: 1.0,
      maximum: 9.0
    },
    grammar_accuracy: {
      type: "number",
      description: "Grammatical Range and Accuracy score",
      minimum: 1.0,
      maximum: 9.0
    },
    examiner_tip: {
      type: "string",
      description: "Specific, actionable advice for improvement"
    }
  },
  required: [
    "student_text",
    "rewritten_text",
    "comparison_data",
    "overall_score",
    "task_response",
    "coherence_cohesion",
    "lexical_resource",
    "grammar_accuracy",
    "examiner_tip"
  ],
  additionalProperties: false
};

export async function POST(req: NextRequest) {
  try {
    const { essay, studentName, className } = await req.json();

    if (!essay || essay.trim().length === 0) {
      return NextResponse.json(
        { error: 'Essay text is required' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: ANALYSIS_PROMPT
        },
        {
          role: 'user',
          content: `Essay to analyze: ${essay}`
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "essay_analysis",
          strict: true,
          schema: ESSAY_ANALYSIS_SCHEMA
        }
      }
    });

    const analysisText = response.choices[0]?.message?.content;
    
    if (!analysisText) {
      throw new Error('No response from OpenAI');
    }

    // Check for refusal
    if (response.choices[0]?.message?.refusal) {
      throw new Error(`Analysis refused: ${response.choices[0].message.refusal}`);
    }

    // Parse the structured JSON response
    let analysisData;
    try {
      analysisData = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', analysisText);
      throw new Error('Invalid JSON response from analysis');
    }

    // Ensure student_text is set to the original essay
    analysisData.student_text = essay;

    // Create the complete report data structure
    const reportData = {
      output_json: analysisData,
      readily_submission: {
        submission_json: {
          student_name: studentName || "Anonymous Student",
          class_name: className || "IELTS Writing Class"
        }
      },
      created_at: new Date().toISOString()
    };

    return NextResponse.json(reportData);

  } catch (error) {
    console.error('Error analyzing essay:', error);
    return NextResponse.json(
      { error: 'Failed to analyze essay. Please try again.' },
      { status: 500 }
    );
  }
}
