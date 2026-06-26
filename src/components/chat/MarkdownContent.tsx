/**
 * components/chat/MarkdownContent.tsx
 * Full markdown renderer with:
 *  • Inline & block KaTeX math ($…$ and $$…$$)
 *  • Syntax-highlighted code blocks (highlight.js)
 *  • Tables, blockquotes, headings, lists, HR
 *  • Bold, italic, inline-code, strikethrough
 */

import { useState, useEffect, useRef } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import hljs from 'highlight.js/lib/core'

// ── Register common languages (tree-shakeable) ────────────────────────────────
import langJS   from 'highlight.js/lib/languages/javascript'
import langTS   from 'highlight.js/lib/languages/typescript'
import langPy   from 'highlight.js/lib/languages/python'
import langSQL  from 'highlight.js/lib/languages/sql'
import langBash from 'highlight.js/lib/languages/bash'
import langJSON from 'highlight.js/lib/languages/json'
import langCSS  from 'highlight.js/lib/languages/css'
import langHTML from 'highlight.js/lib/languages/xml'
import langJava from 'highlight.js/lib/languages/java'
import langCPP  from 'highlight.js/lib/languages/cpp'

hljs.registerLanguage('javascript', langJS)
hljs.registerLanguage('js',         langJS)
hljs.registerLanguage('typescript', langTS)
hljs.registerLanguage('ts',         langTS)
hljs.registerLanguage('python',     langPy)
hljs.registerLanguage('py',         langPy)
hljs.registerLanguage('sql',        langSQL)
hljs.registerLanguage('bash',       langBash)
hljs.registerLanguage('sh',         langBash)
hljs.registerLanguage('json',       langJSON)
hljs.registerLanguage('css',        langCSS)
hljs.registerLanguage('html',       langHTML)
hljs.registerLanguage('xml',        langHTML)
hljs.registerLanguage('java',       langJava)
hljs.registerLanguage('cpp',        langCPP)
hljs.registerLanguage('c',          langCPP)

// ── Katex math rendering ──────────────────────────────────────────────────────

function renderMath(source: string, display: boolean): string {
  try {
    return katex.renderToString(source, {
      displayMode:  display,
      throwOnError: false,
      strict:       false,
      output:       'html',
    })
  } catch {
    return source
  }
}

// Inline math: $...$  (not $$...$$, not $$ on its own)
function MathInline({ src }: { src: string }) {
  return (
    <span
      className="align-middle"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: renderMath(src, false) }}
    />
  )
}

// Block math: $$...$$
function MathBlock({ src }: { src: string }) {
  return (
    <div
      className="overflow-x-auto py-2 text-center"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: renderMath(src, true) }}
    />
  )
}

// ── Inline parser ─────────────────────────────────────────────────────────────
// Handles: **bold**, *italic*, `code`, ~~strike~~, $math$

export function parseInline(text: string): React.ReactNode[] {
  // Tokenize step-by-step
  const INLINE_RE =
    /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\*[^*\n]+\*|`[^`\n]+`)/

  return text.split(INLINE_RE).map((part, i) => {
    // Block math inline (rare but handle it)
    if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4)
      return <MathInline key={i} src={part.slice(2, -2)} />

    // Inline math $...$
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2 && !part.includes('\n'))
      return <MathInline key={i} src={part.slice(1, -1)} />

    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__')))
      return <strong key={i} className="font-semibold text-gray-900 dark:text-gray-100">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <em key={i} className="italic text-gray-700 dark:text-gray-300">{part.slice(1, -1)}</em>
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4)
      return <del key={i} className="text-gray-400 dark:text-gray-600">{part.slice(2, -2)}</del>
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
      return (
        <code key={i} className="bg-gray-100 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 px-1.5 py-0.5 rounded-md text-[0.8em] font-mono text-violet-700 dark:text-violet-300">
          {part.slice(1, -1)}
        </code>
      )
    return part || null
  })
}

// ── Code block with syntax highlighting ───────────────────────────────────────

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!preRef.current) return
    const el = preRef.current
    const normalLang = lang.toLowerCase().trim()
    if (normalLang && hljs.getLanguage(normalLang)) {
      const result = hljs.highlight(code.trimEnd(), { language: normalLang, ignoreIllegals: true })
      el.innerHTML = result.value
    } else {
      el.textContent = code.trimEnd()
    }
  }, [code, lang])

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const label = lang || 'code'

  return (
    <div className="rounded-xl overflow-hidden border border-gray-700/80 dark:border-gray-600/60 shadow-lg my-1">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900/90 px-4 py-2.5">
        <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">{label}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Nusxalash"
        >
          {copied
            ? <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Nusxalandi</span></>
            : <><Copy className="w-3.5 h-3.5" /><span>Nusxalash</span></>}
        </button>
      </div>
      {/* Code — highlight.js populates via useEffect */}
      <pre className="bg-[#0d1117] dark:bg-gray-950 px-5 py-4 overflow-x-auto text-[13px] leading-relaxed m-0">
        <code
          ref={preRef}
          className={cn('font-mono whitespace-pre', lang && `language-${lang.toLowerCase()}`)}
        />
      </pre>
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────

function TableBlock({ lines }: { lines: string[] }) {
  const parse = (line: string) =>
    line.split('|').map(c => c.trim()).filter((_, i, a) => i !== 0 && i !== a.length - 1)

  const headers = parse(lines[0] ?? '')
  const rows    = lines.slice(2).map(parse)

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-sm my-1">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/70">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700/60 whitespace-nowrap">
                {parseInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={cn(
              'border-b border-gray-100 dark:border-gray-800/60 last:border-0',
              ri % 2 === 1 && 'bg-gray-50/60 dark:bg-gray-800/20',
            )}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{parseInline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Segment extractor (code blocks + block math + text) ───────────────────────

type Seg =
  | { k: 'code';       lang: string; code: string }
  | { k: 'math_block'; src:  string }
  | { k: 'text';       text: string }

function extractSegments(raw: string): Seg[] {
  const segs: Seg[] = []
  let rest = raw

  while (rest.length > 0) {
    // ── Fenced code block ````…``` ──────────────────────────────────────────
    const codeIdx = rest.indexOf('```')
    // ── Block math $$…$$ ────────────────────────────────────────────────────
    const mathIdx = rest.indexOf('$$')

    // Determine which comes first (or neither)
    let nextType: 'code' | 'math' | 'none' = 'none'
    let nextIdx = Infinity
    if (codeIdx !== -1 && codeIdx < nextIdx) { nextType = 'code'; nextIdx = codeIdx }
    if (mathIdx !== -1 && mathIdx < nextIdx) { nextType = 'math'; nextIdx = mathIdx }

    if (nextType === 'none') { segs.push({ k: 'text', text: rest }); break }

    // Text before marker
    if (nextIdx > 0) segs.push({ k: 'text', text: rest.slice(0, nextIdx) })

    if (nextType === 'code') {
      const after    = rest.slice(nextIdx + 3)
      const nlIdx    = after.indexOf('\n')
      const lang     = nlIdx === -1 ? '' : after.slice(0, nlIdx).trim()
      const body     = nlIdx === -1 ? after : after.slice(nlIdx + 1)
      const closeIdx = body.indexOf('```')

      if (closeIdx === -1) { segs.push({ k: 'text', text: rest.slice(nextIdx) }); break }
      segs.push({ k: 'code', lang, code: body.slice(0, closeIdx) })
      rest = body.slice(closeIdx + 3)
    } else {
      // block math $$...$$
      const after    = rest.slice(nextIdx + 2)
      const closeIdx = after.indexOf('$$')
      if (closeIdx === -1) { segs.push({ k: 'text', text: rest.slice(nextIdx) }); break }
      segs.push({ k: 'math_block', src: after.slice(0, closeIdx).trim() })
      rest = after.slice(closeIdx + 2)
    }
  }

  return segs
}

// ── Text block renderer ───────────────────────────────────────────────────────

function isSepLine(s: string)   { return /^\|[\s\-:|]+\|/.test(s.trim()) }
function isTableLine(s: string) { return s.trim().startsWith('|') && s.trim().endsWith('|') }

function TextBlock({ text }: { text: string }) {
  const lines  = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // ── Table ────
    if (isTableLine(line) && i + 1 < lines.length && isSepLine(lines[i + 1])) {
      const tbl: string[] = []
      while (i < lines.length && isTableLine(lines[i])) { tbl.push(lines[i]); i++ }
      nodes.push(<TableBlock key={`t-${i}`} lines={tbl} />)
      continue
    }
    // ── HR ───────
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      nodes.push(<hr key={i} className="border-gray-200 dark:border-gray-700 my-1" />)
      i++; continue
    }
    // ── Headings ─
    if (/^### /.test(line)) {
      nodes.push(<p key={i} className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-2">{parseInline(line.slice(4))}</p>)
      i++; continue
    }
    if (/^## /.test(line)) {
      nodes.push(<p key={i} className="text-[0.93rem] font-bold text-gray-900 dark:text-gray-100 mt-2">{parseInline(line.slice(3))}</p>)
      i++; continue
    }
    if (/^# /.test(line)) {
      nodes.push(<p key={i} className="text-base font-bold text-gray-900 dark:text-gray-100 mt-2">{parseInline(line.slice(2))}</p>)
      i++; continue
    }
    // ── Blockquote ─
    if (/^> /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^> /.test(lines[i])) { items.push(lines[i].slice(2)); i++ }
      nodes.push(
        <div key={`bq-${i}`} className="border-l-4 border-violet-300 dark:border-violet-700/60 pl-4 py-0.5 my-1 text-gray-600 dark:text-gray-400 italic space-y-0.5">
          {items.map((t, j) => <p key={j}>{parseInline(t)}</p>)}
        </div>
      )
      continue
    }
    // ── Bullet list ─
    if (/^[\-\*\+] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[\-\*\+] /.test(lines[i])) { items.push(lines[i].slice(2)); i++ }
      nodes.push(
        <ul key={`ul-${i}`} className="space-y-1 my-0.5">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2.5 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 dark:bg-violet-500 mt-[7px] flex-shrink-0" />
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }
    // ── Numbered list ─
    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      let num = 1
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        const m = lines[i].match(/^(\d+)\. (.+)/)
        if (m) { if (items.length === 0) num = parseInt(m[1]); items.push(m[2]) }
        i++
      }
      nodes.push(
        <ol key={`ol-${i}`} className="space-y-1 my-0.5">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2.5 items-start">
              <span className="text-violet-500 dark:text-violet-400 font-semibold tabular-nums text-xs mt-px flex-shrink-0 min-w-[1.4em]">{num + j}.</span>
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }
    // ── Empty line ─
    if (line.trim() === '') { nodes.push(<div key={i} className="h-2.5" />); i++; continue }
    // ── Paragraph ─
    nodes.push(<p key={i} className="leading-[1.75]">{parseInline(line)}</p>)
    i++
  }

  return <div className="space-y-1">{nodes}</div>
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function MarkdownContent({ text }: { text: string }) {
  if (!text) return null

  const segs = extractSegments(text)

  return (
    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2.5">
      {segs.map((seg, i) => {
        if (seg.k === 'code')       return <CodeBlock  key={i} lang={seg.lang} code={seg.code} />
        if (seg.k === 'math_block') return <MathBlock  key={i} src={seg.src}  />
        return <TextBlock key={i} text={seg.text} />
      })}
    </div>
  )
}
