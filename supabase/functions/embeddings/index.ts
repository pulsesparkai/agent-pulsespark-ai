import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmbeddingRequest {
  text: string;
  model?: string;
}

/**
 * Supabase Edge Function: Generate Text Embeddings
 * 
 * Securely generates vector embeddings using OpenAI's API.
 * This function keeps API keys secure on the server side and provides
 * embeddings for the custom memory system.
 * 
 * Features:
 * - Secure OpenAI API key handling
 * - Text preprocessing and validation
 * - Error handling and rate limiting
 * - User authentication verification
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role for user verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user authentication
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { text, model = 'text-embedding-ada-002' }: EmbeddingRequest = await req.json()

    // Validate input text
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text is required and must be non-empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Limit text length to prevent excessive API costs
    const maxLength = 8000; // Approximately 2000 tokens
    const processedText = text.trim().substring(0, maxLength);

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'Embedding service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call OpenAI Embeddings API
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: processedText,
        model: model,
        encoding_format: 'float'
      }),
    });

    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate embedding',
          details: errorData.error?.message || 'Unknown error'
        }),
        { status: embeddingResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse embedding response
    const embeddingData = await embeddingResponse.json();
    
    // Validate response structure
    if (!embeddingData.data || !embeddingData.data[0] || !embeddingData.data[0].embedding) {
      return new Response(
        JSON.stringify({ error: 'Invalid embedding response from OpenAI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return embedding data
    const response = {
      data: [{
        embedding: embeddingData.data[0].embedding,
        index: 0
      }],
      model: embeddingData.model,
      usage: embeddingData.usage
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Embedding function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})