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
    ? 'You are a helpful assistant. Please answer in Korean.'
    : 'You are a helpful assistant. Please answer in English.';

  return `${languageInstruction}

You are a creative thinking assistant that helps expand ideas in multiple directions.
Given an idea or concept, generate exactly 4 related concepts:
1. Scenario: A practical real-world application or use case
2. Tech: A relevant technology, tool, or technical approach
3. Visual: A visual metaphor, imagery, or design concept
4. Counter: A contrasting perspective, challenge, or alternative viewpoint

Respond ONLY with a valid JSON object in this exact format:
{
  "concepts": [
    { "type": "scenario", "title": "Short Title", "content": "Brief description (1-2 sentences)" },
    { "type": "tech", "title": "Short Title", "content": "Brief description (1-2 sentences)" },
    { "type": "visual", "title": "Short Title", "content": "Brief description (1-2 sentences)" },
    { "type": "counter", "title": "Short Title", "content": "Brief description (1-2 sentences)" }
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
          content: `Expand this idea into 4 related concepts:\n\n"${prompt}"`,
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
