// Supabase Edge Function: ai-chat
// Deploy: supabase functions deploy ai-chat
// Secret:  supabase secrets set GEMINI_API_KEY=your_key_here

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const GEMINI_MODEL   = 'gemini-2.5-flash'
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

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

// ─── Tiplari ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  role:    'user' | 'assistant'
  content: string
}

interface StudentContext {
  studentName:   string
  groups:        { name: string; subjectName?: string; subjectIcon?: string }[]
  recentLessons: { title: string; content?: string | null }[]
  testStats:     { passed: number; total: number; avgPct: number }
  attPct:        number | null
  attTotal:      number
}

// ─── Yordamchi: HTML ni tozalash ──────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(ctx: StudentContext): string {
  const subjectList = ctx.groups
    .map(g => [g.subjectIcon, g.subjectName ?? g.name].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(', ') || "Ko'rsatilmagan"

  const lessonSection = ctx.recentLessons.length > 0
    ? ctx.recentLessons.map((l, i) => {
        const raw     = l.content ? stripHtml(l.content) : ''
        const excerpt = raw.length > 800 ? raw.slice(0, 800) + '…' : raw
        return `${i + 1}. **${l.title}**${excerpt ? `\n${excerpt}` : ''}`
      }).join('\n\n')
    : "Hali darslar qo'shilmagan."

  const testSection = ctx.testStats.total > 0
    ? `${ctx.testStats.passed} ta / ${ctx.testStats.total} tadan o'tgan · O'rtacha ball: ${ctx.testStats.avgPct}%`
    : "Hali test natijalari yo'q"

  const attSection = ctx.attPct !== null
    ? `${ctx.attPct}% (${ctx.attTotal} ta dars)`
    : "Hali davomat ma'lumoti yo'q"

  return `Sen YordamchiAI — ${ctx.studentName} uchun shaxsiy yordamchi va maslahatchi. Har qanday savolga to'liq javob berasan.

MUHIM: Hech qachon "bu savolingiz ta'lim dasturimizga oid emas", "bu mening yo'nalishimga kirmaydi", "faqat ta'lim savollari" yoki shunga o'xshash rad etish javoblarini BERMA. Har qanday savolga — geografiya, tarix, matematika, fan, madaniyat, til, hayot haqida — to'liq va foydali javob ber.

## Foydalanuvchi ma'lumotlari
- Ism: ${ctx.studentName}
- Fanlar: ${subjectList}
- Test: ${testSection}
- Davomat: ${attSection}

## Dars materiallari
${lessonSection}

## Til qoidasi
Foydalanuvchi qaysi tilda yozsa — AYNAN shu tilda javob ber:
- O'zbek (lotin: o', g', sh) → o'zbekcha
- Rus (кирилл) → ruscha
- Ingliz → inglizcha

## Javob uslubi
- Har qanday savolga javob ber, hech narsani rad etma
- Dars materiallari mavjud bo'lsa, ulardan foydalanib tushuntir
- Matematik masalalarda bosqichma-bosqich yechim ko'rsat
- **Bold** va ro'yxatlar ishlatib, javobni o'qishga qulay qil
- Qisqa va aniq bo'l`
}

// ─── Gemini API chaqiruvi ─────────────────────────────────────────────────────

async function callGemini(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  // Gemini "model" deb ataydi, "assistant" emas
  const contents = messages.length > 0
    ? messages.map(m => ({
        role:  m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
    : [{ role: 'user', parts: [{ text: '(Talabani iliq salomlash bilan suhbatni boshlang)' }] }]

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature:     0.7,
        topP:            0.85,
        maxOutputTokens: 1500,
        thinkingConfig:  { thinkingBudget: 0 },
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
    throw new Error(`Gemini ${res.status}: ${errText}`)
  }

  const data = await res.json()

  // Gemini 2.5 Flash "thinking" modeldir — response ikki part qaytaradi:
  //   parts[0] = { thought: true, text: "ichki fikrlash..." }  ← saqlanmaydi
  //   parts[1] = { text: "haqiqiy javob..." }                  ← kerakli
  // Faqat thought=true bo'lmagan partlarni olamiz va birlashtirамиз.
  const allParts: Array<{ text?: string; thought?: boolean }> =
    data.candidates?.[0]?.content?.parts ?? []

  const text = allParts
    .filter(p => !p.thought)
    .map(p => p.text ?? '')
    .join('')

  if (!text) {
    const reason = data.candidates?.[0]?.finishReason ?? 'UNKNOWN'
    throw new Error(`Gemini bo'sh javob qaytardi (reason: ${reason})`)
  }

  return text
}

// ─── Asosiy handler ───────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  if (!GEMINI_API_KEY) {
    return json({ error: 'AI xizmati sozlanmagan. Admin bilan bog\'laning.' }, 503)
  }

  try {
    const body = await req.json()

    const messages: ChatMessage[]  = Array.isArray(body.messages) ? body.messages : []
    const context:  StudentContext = body.context

    if (!context?.studentName) {
      return json({ error: "So'rov noto'g'ri: context majburiy." }, 400)
    }

    // Sprint 3.1: Use the rich AI Brain system prompt when the client builds one.
    // Falls back to the internal generic prompt for backward compatibility.
    const richSystemPrompt: string | null =
      typeof body.systemPrompt === 'string' && body.systemPrompt.length > 50
        ? body.systemPrompt
        : null

    const systemPrompt = richSystemPrompt ?? buildSystemPrompt(context)
    const text         = await callGemini(systemPrompt, messages)

    return json({ response: text })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[ai-chat]', message)
    return json({ error: message }, 500)
  }
})
