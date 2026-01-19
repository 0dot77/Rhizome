import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { PERSONAS, PersonaType } from '@/lib/personas';

interface PersonaRequest {
  prompt: string;
  apiKey: string;
  persona: PersonaType;
}

interface PersonaResponse {
  title: string;
  content: string;
}

// Language detection utility
function detectKorean(text: string): boolean {
  const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
  return koreanRegex.test(text);
}

function getSystemPrompt(persona: PersonaType, isKorean: boolean): string {
  const personaConfig = PERSONAS[persona];
  const languageInstruction = isKorean
    ? 'Please respond entirely in Korean.'
    : 'Please respond entirely in English.';

  return `# Role
You are ${personaConfig.name} - ${personaConfig.role}.

# Your Persona
${personaConfig.prompt}

# Response Guidelines
- Keep your response concise to fit within a sticky note (approx. 50-80 words)
- Use bullet points for readability
- Avoid long introductions; jump straight into your insight
- Stay true to your persona's perspective
- Be specific and actionable

# Language
${languageInstruction}

# Output Format
Respond ONLY with a valid JSON object in this exact format:
{
  "title": "Short evocative title (3-6 words)",
  "content": "• Key insight 1\\n• Key insight 2\\n• Key insight 3"
}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: PersonaRequest = await request.json();
    const { prompt, apiKey, persona } = body;

    if (!prompt || !apiKey || !persona) {
      return NextResponse.json(
        { error: 'Missing prompt, API key, or persona' },
        { status: 400 }
      );
    }

    if (!PERSONAS[persona]) {
      return NextResponse.json(
        { error: 'Invalid persona type' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey,
    });

    const isKorean = detectKorean(prompt);
    const systemPrompt = getSystemPrompt(persona, isKorean);
    const personaConfig = PERSONAS[persona];

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `As ${personaConfig.name}, respond to this idea:\n\n"${prompt}"`,
        },
      ],
      system: systemPrompt,
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { error: 'No text response from AI' },
        { status: 500 }
      );
    }

    const responseText = textContent.text.trim();

    // Parse the JSON response
    let parsedResponse: PersonaResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from the response if it's wrapped in other text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: 'Failed to parse AI response as JSON' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Persona API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
