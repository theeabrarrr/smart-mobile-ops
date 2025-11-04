import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify premium subscription
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Unable to verify subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile || profile.subscription_tier !== 'premium') {
      console.log('Access denied: User does not have premium subscription');
      return new Response(
        JSON.stringify({ error: 'Premium subscription required to access AI Assistant' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { prompt, businessData, subscriptionTier, supportRomanUrdu } = body;
    
    // Validate and sanitize input
    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid prompt provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Limit prompt length to prevent abuse
    if (prompt.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Prompt is too long. Maximum 5000 characters allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Sanitize prompt - remove potential injection attempts
    const sanitizedPrompt = prompt.trim();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build business context with validation (safe defaults)
    let context = '';
    if (businessData && typeof businessData === 'object') {
      // Validate numeric fields
      const validateNumber = (val: any) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0 && num < Number.MAX_SAFE_INTEGER ? num : 0;
      };
      
      context = `Business Context
- Total Sales: PKR ${validateNumber(businessData.totalSales)}
- Total Purchases: PKR ${validateNumber(businessData.totalPurchases)}
- Profit: PKR ${validateNumber(businessData.profit)}
- Available Inventory: ${validateNumber(businessData.availableInventory)} units
- Total Customers: ${validateNumber(businessData.totalCustomers)}
`;
    }

    // Friendly, bilingual assistant system prompt with auto language detection
    // Note: We still support Roman Urdu nicely; premium gating remains handled on the client.
    const systemPrompt = `
You are a friendly AI business assistant for a mobile phone shop. Be concise, helpful and proactive.
Language behavior:
- Always reply in the same language as the user's last message.
- If the user writes in English, answer in English.
- If the user writes in Urdu or Roman Urdu, answer in that style (keep Roman Urdu simple and clear).

Guidelines:
- Use the provided business context for insights. If information is missing, say so and suggest practical next steps.
- Keep tone warm and respectful, and greet back if the user says hello.
- Do not invent numbers; clearly state when data is unavailable.
`;

    // Compose messages for the Lovable AI Gateway (OpenAI-compatible schema)
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${context}\nUser Question: ${sanitizedPrompt}` },
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Default fast + free (until Oct 13, 2025)
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('AI gateway error:', response.status, detail);

      // Surface rate limit and payment messages clearly to the client
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required for AI usage. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI gateway request failed', status: response.status, detail }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || 'No response generated';

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