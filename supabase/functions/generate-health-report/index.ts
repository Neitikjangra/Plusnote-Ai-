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
    const { userId, format: outputFormat = 'text', patientName = 'Patient' } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's health logs from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: healthLogs, error: logsError } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('log_date', { ascending: true });

    if (logsError) {
      console.error('Error fetching logs:', logsError);
      throw new Error('Failed to fetch health logs');
    }

    if (!healthLogs || healthLogs.length === 0) {
      throw new Error('No health logs found for the last 30 days');
    }

    // Prepare health data for analysis
    const healthData = healthLogs.map(log => ({
      date: log.log_date,
      entry: log.entry_text,
      mood: log.mood_rating,
      sleep: log.sleep_rating,
      symptoms: log.symptoms,
      tags: log.tags || []
    }));

    // Call Gemini API for report generation
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const systemPrompt = `You are a health data analyst creating a medical-style summary report for a patient to share with their doctor. Analyze the provided health journal entries and create a comprehensive, professional report.

PATIENT: ${patientName}
REPORTING PERIOD: Last 30 Days

REPORT STRUCTURE:
1. **Executive Summary** - Brief overview of the reporting period and key findings
2. **Symptom Analysis** - Most frequent symptoms, patterns, and timing  
3. **Lifestyle Factors** - Sleep patterns, mood trends, diet observations
4. **Potential Correlations** - Any patterns between lifestyle factors and symptoms
5. **Recommendations for Healthcare Provider** - Key discussion points for medical consultation

GUIDELINES:
- Address the report for "${patientName}"
- Use professional, medical-style language
- Focus on objective observations, not diagnoses
- Highlight patterns and frequencies
- Note any concerning trends
- Include specific dates and data points
- Format for easy physician review
- Keep medical disclaimer

Health Journal Data for ${patientName} (Last 30 Days):
${JSON.stringify(healthData, null, 2)}

Generate a comprehensive health report that ${patientName} can confidently share with their healthcare provider.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: systemPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
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

    const reportContent = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      'Unable to generate report at this time.';

    // Add medical disclaimer
    const finalReport = `# Health Report for ${patientName}

${reportContent}

---

**MEDICAL DISCLAIMER:**
This report is generated from self-reported health journal entries and is not a medical diagnosis. It is intended to facilitate discussion with healthcare providers. Please consult with qualified medical professionals for any health concerns or before making changes to treatment plans.

*Report generated by Plusnote AI Health Journal on ${new Date().toLocaleDateString()}*`;

    // If PDF format is requested, generate PDF
    if (outputFormat === 'pdf') {
      const pdfBuffer = await generatePDF(finalReport);
      
      return new Response(pdfBuffer, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="health-report-${new Date().toISOString().split('T')[0]}.pdf"`
        },
      });
    }

    return new Response(JSON.stringify({ 
      report: finalReport,
      dataPoints: healthLogs.length,
      dateRange: {
        start: healthLogs[0]?.log_date,
        end: healthLogs[healthLogs.length - 1]?.log_date
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-health-report function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate health report',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Function to generate PDF from markdown content
async function generatePDF(content: string): Promise<Uint8Array> {
  // Convert basic markdown to HTML
  const htmlContent = convertMarkdownToHTML(content);
  
  // Create a complete HTML document with styling
  const fullHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Health Report</title>
        <style>
          body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
          }
          h1, h2, h3 { 
            color: #2563eb; 
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
          }
          h1 { font-size: 28px; margin-bottom: 30px; }
          h2 { font-size: 22px; margin-top: 30px; margin-bottom: 15px; }
          h3 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
          p { margin-bottom: 12px; }
          strong { color: #1f2937; }
          ul, ol { margin-bottom: 16px; }
          li { margin-bottom: 6px; }
          .disclaimer {
            background: #f3f4f6;
            border-left: 4px solid #fbbf24;
            padding: 16px;
            margin-top: 30px;
            border-radius: 0 8px 8px 0;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          .logo { color: #2563eb; font-weight: bold; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Plusnote - AI Health Journal</div>
        </div>
        ${htmlContent}
      </body>
    </html>
  `;

  // Use Puppeteer to generate PDF
  try {
    const puppeteerResponse = await fetch('https://api.htmlcsstoimage.com/v1/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('placeholder:placeholder') // This would need a real API key
      },
      body: JSON.stringify({
        html: fullHTML,
        format: 'pdf',
        width: 800,
        height: 1100
      })
    });

    if (!puppeteerResponse.ok) {
      throw new Error('PDF generation service unavailable');
    }

    return new Uint8Array(await puppeteerResponse.arrayBuffer());
  } catch (error) {
    console.error('PDF generation failed, using alternative method:', error);
    
    // Fallback: create a simple text-based PDF using minimal PDF structure
    const simplePdfContent = createSimplePDF(content);
    return new TextEncoder().encode(simplePdfContent);
  }
}

function createSimplePDF(content: string): string {
  // This creates a very basic PDF structure
  // In production, you'd want to use a proper PDF library
  const pdfHeader = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length ${content.length + 100}
>>
stream
BT
/F1 12 Tf
50 750 Td
`;

  const pdfFooter = `
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
%%EOF`;

  // Clean the content for PDF
  const cleanContent = content
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-ASCII characters
    .split('\n')
    .map(line => `(${line.substring(0, 80)}) Tj 0 -15 Td`)
    .join('\n');

  return pdfHeader + cleanContent + pdfFooter;
}

// Simple markdown to HTML converter
function convertMarkdownToHTML(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.*)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, '$1')
    .replace(/---/g, '<hr>');
}