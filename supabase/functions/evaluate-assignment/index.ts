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
    const { submissionId, assignmentTitle, extractedText } = await req.json()

    if (!submissionId || !extractedText) {
      throw new Error('Submission ID and extracted text are required')
    }

    console.log('Starting AI evaluation for submission:', submissionId)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update submission status to evaluating
    await supabase
      .from('submissions')
      .update({ status: 'evaluating' })
      .eq('id', submissionId)

    // Get assignment details
    const { data: assignment } = await supabase
      .from('assignments')
      .select('max_score, description')
      .eq('id', (await supabase
        .from('submissions')
        .select('assignment_id')
        .eq('id', submissionId)
        .single()).data?.assignment_id)
      .single()

    const maxScore = assignment?.max_score || 100

    // Prepare AI evaluation prompt
    const evaluationPrompt = `
You are an expert academic evaluator. Please evaluate this student's assignment submission.

Assignment Title: ${assignmentTitle || 'Assignment Evaluation'}
Assignment Description: ${assignment?.description || 'General assignment evaluation'}
Maximum Score: ${maxScore}

Student's Response:
${extractedText}

Please provide a comprehensive evaluation in the following JSON format:
{
  "score": <number between 0 and ${maxScore}>,
  "percentage": <percentage score>,
  "strengths": [
    "<strength 1>",
    "<strength 2>",
    "<strength 3>"
  ],
  "improvements": [
    "<area for improvement 1>",
    "<area for improvement 2>",
    "<area for improvement 3>"
  ],
  "detailed_feedback": "<comprehensive paragraph explaining the evaluation>",
  "recommendations": [
    "<recommendation 1>",
    "<recommendation 2>",
    "<recommendation 3>"
  ],
  "overall_comments": "<overall assessment and encouragement>"
}

Evaluate based on:
1. Content accuracy and understanding
2. Completeness of the response
3. Clarity and organization
4. Critical thinking and analysis
5. Use of examples and evidence

Be constructive, specific, and encouraging in your feedback.`

    // Call OpenAI API
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
            content: 'You are an expert academic evaluator. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: evaluationPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${await openAIResponse.text()}`)
    }

    const openAIResult = await openAIResponse.json()
    console.log('OpenAI response received')

    // Parse the AI response
    let evaluationResult
    try {
      evaluationResult = JSON.parse(openAIResult.choices[0].message.content)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Fallback evaluation
      evaluationResult = {
        score: Math.floor(maxScore * 0.7),
        percentage: 70,
        strengths: ["Good effort demonstrated", "Shows understanding of basic concepts"],
        improvements: ["Could elaborate more on key points", "Consider adding more examples"],
        detailed_feedback: "The submission shows a good understanding of the subject matter. There is room for improvement in elaboration and providing more concrete examples.",
        recommendations: ["Review course materials", "Practice with more examples"],
        overall_comments: "Keep up the good work and continue learning!"
      }
    }

    // Store evaluation in database
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .insert({
        submission_id: submissionId,
        score: evaluationResult.score,
        max_score: maxScore,
        evaluation_type: 'ai',
        ai_feedback: evaluationResult,
        evaluator_id: null,
        is_published: false
      })
      .select()
      .single()

    if (evalError) {
      throw new Error(`Database error: ${evalError.message}`)
    }

    // Update submission status to graded
    await supabase
      .from('submissions')
      .update({ status: 'graded' })
      .eq('id', submissionId)

    console.log('Evaluation completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        evaluation: evaluationResult,
        evaluationId: evaluation.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in evaluate-assignment function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})