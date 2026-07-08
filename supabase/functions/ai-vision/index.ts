// Supabase Edge Function: ai-vision
// Sprint 3.2 Phase 1 — Gemini Vision Integration
// Deploy: supabase functions deploy ai-vision
// Uses the same GEMINI_API_KEY as ai-chat.

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY  = Deno.env.get('GEMINI_API_KEY') ?? ''
const GEMINI_MODEL    = 'gemini-2.5-flash'
// Vision uses generateContent (same endpoint, different content format)
const GEMINI_URL      = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Caller authentication (blocks anonymous abuse of the paid Vision API) ────
async function getCallerId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader || authHeader === `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`) return null
  try {
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    )
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

// ─── Basic in-memory rate limiting (per user, per warm isolate) ───────────────
const RATE_LIMIT     = 10        // vision calls are heavier — lower cap
const RATE_WINDOW_MS = 60_000
const rateHits = new Map<string, number[]>()
function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const recent = (rateHits.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  recent.push(now)
  rateHits.set(userId, recent)
  if (rateHits.size > 5000) {
    for (const [k, v] of rateHits) if (v.every((t) => now - t >= RATE_WINDOW_MS)) rateHits.delete(k)
  }
  return recent.length > RATE_LIMIT
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

  // ── Require an authenticated user (blocks anonymous Vision abuse) ──
  const callerId = await getCallerId(req)
  if (!callerId) return json({ error: 'Avtorizatsiya talab qilinadi.' }, 401)

  // ── Rate protection ──
  if (isRateLimited(callerId)) {
    return json({ error: "Juda ko'p so'rov. Bir daqiqadan so'ng qayta urinib ko'ring." }, 429)
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
    // Log full detail server-side; return generic/known-code messages only so
    // raw Gemini errors never reach the client.
    const message = err instanceof Error ? err.message : String(err)
    console.error('[ai-vision]', message)

    // Known, safe error codes passed through for client-side handling
    if (['quota_exceeded', 'gemini_error', 'parse_failed', 'file_too_large'].includes(message)) {
      return json({ error: message }, 503)
    }
    if (message.includes('429') || message.includes('quota')) {
      return json({ error: 'quota_exceeded' }, 503)
    }

    return json({ error: 'Rasmni tahlil qila olmadim. Qayta urinib ko\'ring.' }, 500)
  }
})
