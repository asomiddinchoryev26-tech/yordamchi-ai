// Supabase Edge Function: ai-chat
// Deploy: supabase functions deploy ai-chat
// Streaming + File attachments supported.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL   = "gemini-2.5-flash";
const GEMINI_BASE    = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}`;
const GEMINI_URL     = `${GEMINI_BASE}:generateContent`;
const GEMINI_STREAM  = `${GEMINI_BASE}:streamGenerateContent?alt=sse`;

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResp(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function sseResp(stream) {
  return new Response(stream, {
    headers: {
      ...CORS,
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildSystemPrompt(ctx) {
  const subjectList = ctx.groups
    .map((g) => [g.subjectIcon, g.subjectName ?? g.name].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(", ") || "Aniqlanmagan";

  const lessonSection = ctx.recentLessons.length > 0
    ? ctx.recentLessons.map((l, i) => {
        const raw     = l.content ? stripHtml(l.content) : "";
        const excerpt = raw.length > 600 ? raw.slice(0, 600) + "..." : raw;
        return `${i + 1}. **${l.title}**${excerpt ? "\n" + excerpt : ""}`;
      }).join("\n\n")
    : "Hali darslar qoshilmagan.";

  const testSection = ctx.testStats.total > 0
    ? `${ctx.testStats.passed} ta / ${ctx.testStats.total} tadan. Ortacha: ${ctx.testStats.avgPct}%`
    : "Hali natijalar yoq";

  const attSection = ctx.attPct !== null
    ? `${ctx.attPct}% (${ctx.attTotal} ta dars)`
    : "Hali davomat yoq";

  return `Sen YordamchiAI — ${ctx.studentName} uchun shaxsiy AI oqituvchi.

QOIDALAR:
1. SALOMLASHMA — darhol javob ber
2. Hech qanday savolni rad etma
3. Javobni foydalanuvchi tilida yoz (uzbek/rus/ingliz)
4. Rasm yoki fayl kelsa — tahlil qil

FORMATLASH:
- Markdown ishlatish: bold, italic, code
- Matematika: $formula$ va $$formula$$
- Kod: fenced code blocks

FOYDALANUVCHI:
- Ism: ${ctx.studentName}
- Fanlar: ${subjectList}
- Test: ${testSection}
- Davomat: ${attSection}

DARSLAR:
${lessonSection}`;
}

function buildContents(messages) {
  return messages.map((m) => {
    const parts = [];
    if (m.parts && m.parts.length > 0) {
      for (const p of m.parts) {
        if (p.type === "text" && p.text) {
          parts.push({ text: p.text });
        } else if (p.type === "file" && p.base64) {
          parts.push({ inlineData: { mimeType: p.mimeType, data: p.base64 } });
        }
      }
      if (m.content && !m.parts.some((p) => p.type === "text")) {
        parts.unshift({ text: m.content });
      }
    } else {
      parts.push({ text: m.content || "" });
    }
    return {
      role:  m.role === "assistant" ? "model" : "user",
      parts: parts.length ? parts : [{ text: m.content || "" }],
    };
  });
}

function buildGeminiBody(systemPrompt, messages) {
  return {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents:          buildContents(messages),
    generationConfig: {
      temperature:     0.7,
      topP:            0.85,
      maxOutputTokens: 4096,
      thinkingConfig:  { thinkingBudget: 0 },
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };
}

function extractText(parts) {
  return (parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
}

async function callGemini(systemPrompt, messages) {
  if (!messages.length) throw new Error("messages_empty");
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(buildGeminiBody(systemPrompt, messages)),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = extractText(data.candidates?.[0]?.content?.parts);
  if (!text) throw new Error(`Gemini bosh javob (${data.candidates?.[0]?.finishReason ?? "UNKNOWN"})`);
  return text;
}

async function streamGemini(systemPrompt, messages) {
  if (!messages.length) throw new Error("messages_empty");
  const gemRes = await fetch(`${GEMINI_STREAM}&key=${GEMINI_API_KEY}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(buildGeminiBody(systemPrompt, messages)),
  });
  if (!gemRes.ok) throw new Error(`Stream ${gemRes.status}: ${await gemRes.text()}`);

  const reader = gemRes.body.getReader();
  const enc    = new TextEncoder();
  const dec    = new TextDecoder();

  return new ReadableStream({
    async start(ctrl) {
      let buf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const raw = t.slice(5).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const chunk = JSON.parse(raw);
              const text  = extractText(chunk.candidates?.[0]?.content?.parts);
              if (text) ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ text })}\n\n`));
            } catch { /* skip malformed */ }
          }
        }
      } catch (err) {
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
      } finally {
        ctrl.enqueue(enc.encode("data: [DONE]\n\n"));
        ctrl.close();
      }
    },
    cancel() { reader.cancel(); },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!GEMINI_API_KEY) return jsonResp({ error: "AI xizmati sozlanmagan." }, 503);

  try {
    const body       = await req.json();
    const messages   = Array.isArray(body.messages) ? body.messages : [];
    const context    = body.context;
    const wantStream = body.stream === true;

    if (!context?.studentName) return jsonResp({ error: "context majburiy." }, 400);

    const richSP       = typeof body.systemPrompt === "string" && body.systemPrompt.length > 50 ? body.systemPrompt : null;
    const systemPrompt = richSP ?? buildSystemPrompt(context);

    if (wantStream) {
      const stream = await streamGemini(systemPrompt, messages);
      return sseResp(stream);
    }

    const text = await callGemini(systemPrompt, messages);
    return jsonResp({ response: text });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ai-chat]", message);
    return jsonResp({ error: message }, 500);
  }
});
