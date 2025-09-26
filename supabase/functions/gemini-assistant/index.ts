import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { prompt, businessData, subscriptionTier, supportRomanUrdu } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    // Prepare context with business data and subscription features
    let context = businessData ? `
    Business Context:
    - Total Sales: PKR ${businessData.totalSales || 0}
    - Total Purchases: PKR ${businessData.totalPurchases || 0}
    - Profit: PKR ${businessData.profit || 0}
    - Available Inventory: ${businessData.availableInventory || 0} units
    - Total Customers: ${businessData.totalCustomers || 0}
    
    Based on this mobile phone business data, please provide insights and recommendations.
    ` : '';

    // Add Roman Urdu support for Premium users
    if (subscriptionTier === 'premium' && supportRomanUrdu) {
      context += `
      
      IMPORTANT: You can understand and respond in Roman Urdu (Urdu written in English alphabet). 
      If the user asks in Roman Urdu, respond in Roman Urdu. If they ask in English, respond in English.
      
      Examples:
      - "Mera business kaisa chal raha hai?" → Respond about business performance in Roman Urdu
      - "Sales kaise badhain?" → Give sales tips in Roman Urdu
      `;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${context}\n\nUser Question: ${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return new Response(JSON.stringify({ response: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in gemini-assistant function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});