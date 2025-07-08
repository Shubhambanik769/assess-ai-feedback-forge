import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileUrl, fileType } = await req.json()

    if (!fileUrl) {
      throw new Error('File URL is required')
    }

    console.log('Extracting text from:', fileType, fileUrl)

    let extractedText = ''

    if (fileType?.includes('image') || fileUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      // Extract text from image using OpenAI Vision API
      const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Please extract all text content from this image. This appears to be a student assignment. Return only the text content, maintaining the original structure and formatting as much as possible.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: fileUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 2000,
        }),
      })

      if (!visionResponse.ok) {
        throw new Error(`OpenAI Vision API error: ${await visionResponse.text()}`)
      }

      const visionResult = await visionResponse.json()
      extractedText = visionResult.choices[0].message.content
      
    } else if (fileType?.includes('pdf') || fileUrl.includes('.pdf')) {
      // For PDF files, we would need a PDF parsing library
      // For now, return a placeholder that indicates PDF processing needed
      extractedText = "PDF file detected. Please implement PDF text extraction using a PDF parsing library like pdf-parse or similar."
      
    } else if (fileType?.includes('word') || fileUrl.match(/\.(doc|docx)$/i)) {
      // For Word files, we would need a Word document parsing library
      extractedText = "Word document detected. Please implement Word document text extraction using a library like mammoth or similar."
      
    } else {
      // Try to fetch as plain text
      try {
        const textResponse = await fetch(fileUrl)
        extractedText = await textResponse.text()
      } catch (fetchError) {
        throw new Error(`Unable to extract text from file type: ${fileType}`)
      }
    }

    console.log('Text extraction completed, length:', extractedText.length)

    return new Response(
      JSON.stringify({ 
        success: true, 
        extractedText: extractedText,
        fileType: fileType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in extract-text function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})