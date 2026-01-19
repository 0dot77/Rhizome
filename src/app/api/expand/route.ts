import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface ExpandRequest {
  prompt: string;
  apiKey: string;
}

interface ExpandedConcept {
  type: 'scenario' | 'tech' | 'visual' | 'counter';
  title: string;
  content: string;
}

interface ExpandResponse {
  concepts: ExpandedConcept[];
}

// Language detection utility
function detectKorean(text: string): boolean {
  const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
  return koreanRegex.test(text);
}

function getSystemPrompt(isKorean: boolean): string {
  const languageInstruction = isKorean
    ? 'Please respond entirely in Korean.'
    : 'Please respond entirely in English.';

  return `# Role
You are an expert brainstorming facilitator and Creative Thought Partner.

# Objective
Do NOT just answer the user's input. Instead, analyze the core concept and suggest 4 distinct angles, variations, or follow-up questions to help expand the user's thinking.

# Response Guidelines
- Keep each concept concise to fit within a sticky note (approx. 25-40 words per concept)
- Use bullet points for readability within content
- Avoid long introductions; jump straight into the ideas
- Focus on branching out and exploring unexpected connections

# Language
${languageInstruction}

# Categories
Generate exactly 4 related concepts:
1. Scenario: A practical real-world application, use case, or "what if" situation
2. Tech: A relevant technology, tool, methodology, or technical approach
3. Visual: A visual metaphor, imagery, design concept, or creative representation
4. Counter: A contrasting perspective, potential challenge, devil's advocate view, or alternative angle

# Output Format
Respond ONLY with a valid JSON object in this exact format:
{
  "concepts": [
    { "type": "scenario", "title": "Short Title (3-5 words)", "content": "• Key point 1\\n• Key point 2" },
    { "type": "tech", "title": "Short Title (3-5 words)", "content": "• Key point 1\\n• Key point 2" },
    { "type": "visual", "title": "Short Title (3-5 words)", "content": "• Key point 1\\n• Key point 2" },
    { "type": "counter", "title": "Short Title (3-5 words)", "content": "• Key point 1\\n• Key point 2" }
  ]
}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExpandRequest = await request.json();
    const { prompt, apiKey } = body;

    if (!prompt || !apiKey) {
      return NextResponse.json(
        { error: 'Missing prompt or API key' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey,
    });

    // Detect language and get appropriate system prompt
    const isKorean = detectKorean(prompt);
    const systemPrompt = getSystemPrompt(isKorean);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze this idea and branch it into 4 creative directions:\n\n"${prompt}"`,
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
    let parsedResponse: ExpandResponse;
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
    console.error('Expand API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
