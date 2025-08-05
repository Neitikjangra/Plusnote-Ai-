import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Fetch last 7 health logs
    const { data: logs, error: logsError } = await supabaseClient
      .from('health_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(7);

    if (logsError) {
      throw new Error(`Database error: ${logsError.message}`);
    }

    if (!logs || logs.length < 7) {
      return new Response(
        JSON.stringify({ error: 'Not enough entries for analysis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Reverse to get chronological order (oldest first)
    const chronologicalLogs = logs.reverse();

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Prepare data for AI analysis
    const logsForAnalysis = chronologicalLogs.map(log => ({
      date: log.log_date,
      text: log.entry_text,
      mood_rating: log.mood_rating,
      sleep_rating: log.sleep_rating,
      tags: log.tags
    }));

    const prompt = `
Analyze these 7 daily health journal entries and provide:

1. MOOD_TIMELINE: For each day, identify the dominant mood expressed. Use exactly one of these labels: Happy, Calm, Neutral, Anxious, Angry, Low, Sick, Excited

2. HEALTH_SCORE: Based on the overall tone, symptoms, sleep quality, and wellbeing indicators, rate the person's overall health from 0-100

3. SUMMARY: A brief, encouraging 1-sentence summary of their week

Journal entries:
${logsForAnalysis.map((log, i) => `Day ${i + 1} (${log.date}): "${log.text}" (Mood: ${log.mood_rating}/10, Sleep: ${log.sleep_rating}/10, Tags: ${log.tags?.join(', ') || 'none'})`).join('\n')}

Respond ONLY with valid JSON in this exact format:
{
  "mood_timeline": [
    {"date": "2024-01-01", "mood": "Calm", "mood_emoji": "😌"},
    {"date": "2024-01-02", "mood": "Happy", "mood_emoji": "😊"},
    ...continue for all 7 days
  ],
  "health_score": 75,
  "summary": "You've been managing stress well and maintaining good sleep habits this week!"
}

Use these exact mood-to-emoji mappings:
Happy: 😊, Calm: 😌, Neutral: 😐, Anxious: 😰, Angry: 😡, Low: 😔, Sick: 🤒, Excited: 🤩
`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiApiKey,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 1,
            topP: 1,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const geminiData = await response.json();
    const aiResponse = geminiData.candidates[0].content.parts[0].text;

    // Parse AI response
    let analysisResult;
    try {
      // Clean the response - remove any markdown formatting
      const cleanResponse = aiResponse.replace(/```json\n?|```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Failed to parse AI analysis');
    }

    console.log('Health pattern analysis completed for user:', userId);

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-health-patterns function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});