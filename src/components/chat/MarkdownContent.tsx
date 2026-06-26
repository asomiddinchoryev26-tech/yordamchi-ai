import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Inline parser ────────────────────────────────────────────────────────────
// **bold**, *italic*, `code`, ~~strike~~, __bold__

const INLINE_RE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\*[^*\n]+\*|`[^`\n]+`)/

export function parseInline(text: string): React.ReactNode[] {
  return text.split(INLINE_RE).map((part, i) => {
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

// ─── Code block ───────────────────────────────────────────────────────────────

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)

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
        >
          {copied
            ? <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Nusxalandi</span></>
            : <><Copy className="w-3.5 h-3.5" /><span>Nusxalash</span></>}
        </button>
      </div>
      {/* Code */}
      <pre className="bg-[#0d1117] dark:bg-gray-950 px-5 py-4 overflow-x-auto text-[13px] leading-relaxed">
        <code className="font-mono text-gray-200 whitespace-pre">{code.trimEnd()}</code>
      </pre>
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────

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

// ─── Segment extractor ────────────────────────────────────────────────────────

type Seg = { k: 'code'; lang: string; code: string } | { k: 'text'; text: string }

function extractSegments(raw: string): Seg[] {
  const segs: Seg[] = []
  let rest = raw

  while (rest.length > 0) {
    const idx = rest.indexOf('```')
    if (idx === -1) { segs.push({ k: 'text', text: rest }); break }

    if (idx > 0) segs.push({ k: 'text', text: rest.slice(0, idx) })

    const after    = rest.slice(idx + 3)
    const nlIdx    = after.indexOf('\n')
    const lang     = nlIdx === -1 ? '' : after.slice(0, nlIdx).trim()
    const body     = nlIdx === -1 ? after : after.slice(nlIdx + 1)
    const closeIdx = body.indexOf('```')

    if (closeIdx === -1) { segs.push({ k: 'text', text: rest.slice(idx) }); break }

    segs.push({ k: 'code', lang, code: body.slice(0, closeIdx) })
    rest = body.slice(closeIdx + 3)
  }

  return segs
}

// ─── Text block renderer ──────────────────────────────────────────────────────

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
      let   num = 1
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

// ─── Main export ──────────────────────────────────────────────────────────────

export default function MarkdownContent({ text }: { text: string }) {
  if (!text) return null

  const segs = extractSegments(text)

  return (
    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2.5">
      {segs.map((seg, i) =>
        seg.k === 'code'
          ? <CodeBlock key={i} lang={seg.lang} code={seg.code} />
          : <TextBlock  key={i} text={seg.text} />
      )}
    </div>
  )
}
