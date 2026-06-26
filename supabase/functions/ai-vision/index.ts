// Supabase Edge Function: ai-vision
// Sprint 3.2 Phase 1 — Gemini Vision Integration
// Deploy: supabase functions deploy ai-vision
// Uses the same GEMINI_API_KEY as ai-chat.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY  = Deno.env.get('GEMINI_API_KEY') ?? ''
const GEMINI_MODEL    = 'gemini-2.5-flash'
// Vision uses generateContent (same endpoint, different content format)
const GEMINI_URL      = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// ─── Request body ─────────────────────────────────────────────────────────────

interface VisionRequest {
  imageBase64:       string
  mimeType:          string
  systemInstruction: string
  userMessage:       string
}

// ─── Supported MIME types ─────────────────────────────────────────────────────

const SUPPORTED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
])

// ─── Gemini Vision call ───────────────────────────────────────────────────────

async function callGeminiVision(req: VisionRequest): Promise<string> {
  const contents = [{
    role:  'user',
    parts: [
      // Image part (or PDF)
      {
        inlineData: {
          mimeType: req.mimeType,
          data:     req.imageBase64,
        },
      },
      // Text instruction
      { text: req.userMessage },
    ],
  }]

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: req.systemInstruction }],
      },
      contents,
      generationConfig: {
        temperature:     0.3,    // Lower temp for more factual/accurate solutions
        topP:            0.90,
        maxOutputTokens: 2500,   // Vision solutions need more tokens
        thinkingConfig:  { thinkingBudget: 0 },
        responseMimeType: 'application/json',  // Request JSON response directly
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    const isQuota = res.status === 429
    throw new Error(isQuota ? 'quota_exceeded' : `Gemini Vision ${res.status}: ${errText}`)
  }

  const data = await res.json()

  // Extract non-thinking parts (same pattern as ai-chat)
  const allParts: Array<{ text?: string; thought?: boolean }> =
    data.candidates?.[0]?.content?.parts ?? []

  const text = allParts
    .filter(p => !p.thought)
    .map(p => p.text ?? '')
    .join('')

  if (!text) {
    const reason = data.candidates?.[0]?.finishReason ?? 'UNKNOWN'
    throw new Error(`Gemini Vision empty response (reason: ${reason})`)
  }

  return text
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  if (!GEMINI_API_KEY) {
    return json({ error: 'AI Vision xizmati sozlanmagan.' }, 503)
  }

  try {
    const body: VisionRequest = await req.json()

    // Validate required fields
    if (!body.imageBase64 || typeof body.imageBase64 !== 'string') {
      return json({ error: 'imageBase64 majburiy.' }, 400)
    }
    if (!SUPPORTED_MIMES.has(body.mimeType)) {
      return json({ error: `Qo'llab-quvvatlanmagan fayl turi: ${body.mimeType}` }, 400)
    }
    if (!body.systemInstruction || !body.userMessage) {
      return json({ error: 'systemInstruction va userMessage majburiy.' }, 400)
    }

    // Size guard (base64 string length × 0.75 ≈ bytes)
    const approxBytes = body.imageBase64.length * 0.75
    if (approxBytes > 25 * 1024 * 1024) {  // 25 MB safety margin
      return json({ error: 'file_too_large' }, 413)
    }

    const response = await callGeminiVision(body)
    return json({ response })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[ai-vision]', message)

    // Known error codes passed through
    if (['quota_exceeded', 'gemini_error', 'parse_failed'].includes(message)) {
      return json({ error: message }, 503)
    }

    return json({ error: message }, 500)
  }
})
