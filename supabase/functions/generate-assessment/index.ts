import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { topic, difficultyLevel, totalQuestions, title, description } = await req.json()

    if (!topic || !totalQuestions) {
      throw new Error('Topic and total questions are required')
    }

    console.log('Generating assessment for topic:', topic)

    // Generate assessment questions using OpenAI
    const assessmentPrompt = `
Create a comprehensive academic assessment on the topic: "${topic}"

Requirements:
- Difficulty Level: ${difficultyLevel || 'medium'}
- Number of Questions: ${totalQuestions}
- Assessment Title: ${title || `Assessment on ${topic}`}
- Description: ${description || `Comprehensive assessment covering ${topic}`}

Please provide a well-structured assessment in the following JSON format:
{
  "title": "<assessment title>",
  "description": "<assessment description>",
  "questions": [
    {
      "question_text": "<question text>",
      "question_type": "essay|multiple_choice|short_answer",
      "marks": <marks for this question>,
      "order_index": <question number starting from 1>,
      "sample_answer": "<brief sample answer or key points>",
      "difficulty": "easy|medium|hard"
    }
  ],
  "total_marks": <sum of all question marks>,
  "estimated_duration": "<estimated time to complete>",
  "learning_objectives": [
    "<objective 1>",
    "<objective 2>"
  ]
}

Guidelines:
1. Distribute marks appropriately across questions (typically 5-20 marks per question)
2. Include a mix of question types if appropriate
3. Ensure questions test different cognitive levels (knowledge, understanding, application, analysis)
4. Make questions clear and specific
5. For ${difficultyLevel} difficulty, adjust complexity accordingly
6. Ensure total marks add up correctly
`

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert academic assessment creator. Always respond with valid JSON format that matches the specified structure exactly.'
          },
          {
            role: 'user',
            content: assessmentPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    })

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${await openAIResponse.text()}`)
    }

    const openAIResult = await openAIResponse.json()
    console.log('OpenAI response received')

    // Parse the AI response
    let assessmentData
    try {
      assessmentData = JSON.parse(openAIResult.choices[0].message.content)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Fallback assessment structure
      assessmentData = {
        title: title || `Assessment on ${topic}`,
        description: description || `Comprehensive assessment covering ${topic}`,
        questions: Array.from({ length: totalQuestions }, (_, i) => ({
          question_text: `Question ${i + 1}: Write a comprehensive answer about ${topic}.`,
          question_type: 'essay',
          marks: 10,
          order_index: i + 1,
          sample_answer: `Students should demonstrate understanding of key concepts in ${topic}`,
          difficulty: difficultyLevel || 'medium'
        })),
        total_marks: totalQuestions * 10,
        estimated_duration: `${Math.max(30, totalQuestions * 15)} minutes`,
        learning_objectives: [
          `Understand key concepts in ${topic}`,
          `Apply knowledge of ${topic} to practical scenarios`
        ]
      }
    }

    console.log('Assessment generation completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        assessment: assessmentData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-assessment function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})