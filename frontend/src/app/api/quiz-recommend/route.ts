import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

interface QuizAnswerPayload {
  weather?: string;
  companions?: string;
  vibe?: string;
  length?: string;
  budget?: string;
  flexibility?: string;
}

interface DestinationPayload {
  code: string;
  city: string;
  country: string;
  cheapestPrice: number;
  flightTime: string;
  tags: string[];
}

interface RequestBody {
  answers: QuizAnswerPayload;
  freeformNote?: string;
  destinations: DestinationPayload[];
}

interface AiResponse {
  summary: string;
  blurbs: Record<string, string>;
}

const SYSTEM_PROMPT = `You are FairFleet's friendly travel concierge. You help users pick flight destinations.

You will be given:
- The user's quiz answers (weather, companions, vibe, trip length, budget, date flexibility).
- An optional free-form note where they told you something extra in their own words.
- A short list of candidate destinations the app has pre-filtered for them.

Your job:
1. Write a single short, warm "summary" (1-2 sentences, max ~30 words) describing the vibe of trip you understood they're looking for. Use second person ("you"). Do not be salesy. Do not use emojis.
2. For each destination, write a "blurb" (1-2 sentences, max ~25 words) explaining specifically why THIS destination fits THIS user based on their answers and note. Reference concrete details from their answers when relevant. Do not repeat the city name at the start. Do not use emojis.

Return ONLY valid JSON matching this exact shape:
{
  "summary": "string",
  "blurbs": { "<destination code>": "string", ... }
}

The blurbs object must include an entry for every destination code provided, and no others.`;

function fallbackResponse(body: RequestBody): AiResponse {
  const blurbs: Record<string, string> = {};
  for (const d of body.destinations) {
    const tag = d.tags[0] ?? 'travel';
    blurbs[d.code] = `${d.city} is a solid ${tag.toLowerCase()} pick from $${d.cheapestPrice}, about ${d.flightTime} in the air.`;
  }
  return {
    summary: "Here are a few destinations that line up with what you told us.",
    blurbs,
  };
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body?.destinations?.length) {
    return Response.json({ error: 'destinations is required.' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Degrade gracefully so the UI still works locally without a key.
    return Response.json(fallbackResponse(body));
  }

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.anthropic.com/v1/',
    defaultHeaders: { 'anthropic-version': '2023-06-01' },
  });
  const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

  const userPayload = {
    answers: body.answers ?? {},
    freeformNote: body.freeformNote?.trim() || null,
    destinations: body.destinations.map((d) => ({
      code: d.code,
      city: d.city,
      country: d.country,
      cheapestPriceUSD: d.cheapestPrice,
      flightTime: d.flightTime,
      tags: d.tags,
    })),
  };

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(content) as AiResponse;

    if (typeof parsed.summary !== 'string' || typeof parsed.blurbs !== 'object' || parsed.blurbs === null) {
      throw new Error('Malformed AI response.');
    }

    // Ensure every destination has a blurb; fill any missing ones with fallback copy.
    const fallback = fallbackResponse(body);
    for (const d of body.destinations) {
      if (typeof parsed.blurbs[d.code] !== 'string' || !parsed.blurbs[d.code].trim()) {
        parsed.blurbs[d.code] = fallback.blurbs[d.code];
      }
    }

    return Response.json(parsed);
  } catch (err) {
    console.error('[quiz-recommend] OpenAI error', err);
    return Response.json(fallbackResponse(body));
  }
}
