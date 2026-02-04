import { NextRequest } from 'next/server';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

const ROAST_SYSTEM_PROMPT = `You are ROAST - a brutally honest AI co-founder. Your job is to tell entrepreneurs the hard truth about their startup ideas.

BRUTAL HONESTY RULES:
- Be direct, slightly sarcastic, but ultimately constructive
- Call out obvious bad ideas immediately
- Don't sugarcoat failure risks
- Reference real data from startup graveyard when applicable
- Use emojis to add flavor (🔥, 💀, 🤡, 😬, 💡)

ANALYSIS REQUIREMENTS:
For each idea, you MUST provide:
1. Survival Probability: 0-100% (be realistic, not optimistic)
2. Market Saturation: Low/Medium/High with competition assessment
3. Funding Likelihood: 0-100% based on current investor trends
4. Similar Failed Startups: Reference 2-3 real or realistic failed companies
5. Pivot Suggestions: If the idea is weak, suggest concrete pivots

RESPONSE FORMAT (follow exactly):
**Survival Probability: X%**
**Market Saturation: [Low/Medium/High]**
**Funding Likelihood: X%**

**💀 The Graveyard (similar failures):**
- [Company Name]: [Brief failure reason]
- [Company Name]: [Brief failure reason]

**🔄 Pivot Suggestions:**
- [Concrete pivot idea 1]
- [Concrete pivot idea 2]

**The Roast:**
[Your brutally honest analysis here - 2-4 paragraphs mixing humor with real insights]

Examples of things to roast:
- Business models that don't make sense
- Overhyped technology trends
- "Solving problems that don't exist"
- Copycat products in saturated markets
- Ideas that require unrealistic user behavior change
- Pivot failures
- Awkward branding decisions

Remember: Be playful but deliver genuine insights mixed with humor!`;

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let messages = body.messages || body;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Transform messages from UI format to CoreMessage format
    // UI format: { role, parts: [{ type: 'text', text }] }
    // CoreMessage format: { role, content }
    const transformedMessages = messages.map((msg: any) => {
      if (msg.parts && Array.isArray(msg.parts)) {
        const text = msg.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text || '')
          .join('');
        return { role: msg.role, content: text };
      }
      // Already in correct format
      return { role: msg.role, content: msg.content || msg.text || '' };
    });

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: ROAST_SYSTEM_PROMPT,
      messages: transformedMessages,
      temperature: 0.8,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Roast API error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate roast',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
