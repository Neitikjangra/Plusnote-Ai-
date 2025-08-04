import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

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
    const { message, userId, conversationHistory } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's recent health logs for context
    const { data: recentLogs, error: logsError } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('Error fetching logs:', logsError);
    }

    // Prepare context from health logs
    const healthContext = recentLogs?.map(log => 
      `${log.log_date}: ${log.entry_text} (Mood: ${log.mood_rating}/10, Sleep: ${log.sleep_rating}/10, Tags: ${log.tags?.join(', ') || 'None'})`
    ).join('\n') || 'No health logs available yet.';

    // Prepare conversation context
    const conversationContext = conversationHistory?.map((msg: any) => 
      `${msg.role}: ${msg.content}`
    ).join('\n') || '';

    // Call Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const systemPrompt = `You are a warm, empathetic AI health journal companion named "Health Assistant". Your role is to:

1. Help users reflect on their daily health experiences
2. Ask thoughtful follow-up questions about their wellbeing
3. Identify potential patterns between symptoms, food, sleep, and mood
4. Provide gentle guidance (NOT medical advice)
5. Encourage consistent journaling habits

IMPORTANT GUIDELINES:
- Always be warm, supportive, and non-judgmental
- Never provide medical advice or diagnose conditions
- Encourage users to consult healthcare professionals for medical concerns
- Focus on patterns and correlations, not causation
- Ask open-ended questions to encourage reflection
- Keep responses conversational and under 150 words

User's Recent Health Context:
${healthContext}

Recent Conversation:
${conversationContext}

Remember: You're a journaling companion, not a doctor. Focus on emotional support and pattern recognition.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `User message: ${message}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 300,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', data);
      throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
    }

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "I'm here to listen and support you. Can you tell me more about how you're feeling today?";

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-ai function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat request',
      response: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});