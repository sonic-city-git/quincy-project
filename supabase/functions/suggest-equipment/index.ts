import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { equipment } = await req.json();
    console.log('Requesting suggestions for equipment:', equipment);

    if (!equipment || !equipment.name) {
      throw new Error('Invalid equipment data: missing required name property');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert in professional audio and video equipment. 
            Provide detailed alternative suggestions for equipment based on the given item.
            Focus on technical specifications, price comparisons, and use cases.
            Format the response in a clear, concise way with bullet points.`
          },
          {
            role: 'user',
            content: `Suggest 3 alternative equipment options for: ${equipment.name}
            Consider these aspects:
            - Similar price range (around ${equipment.rental_price || 'unknown'} per day)
            - Similar technical specifications
            - Common use cases
            - Advantages and disadvantages compared to the original
            Please format each suggestion with: Name, Price Range, Key Features, and Why Consider This`
          }
        ],
      }),
    });

    const data = await response.json();
    console.log('OpenAI response received:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }

    return new Response(JSON.stringify({ suggestions: data.choices[0].message.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in suggest-equipment function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});