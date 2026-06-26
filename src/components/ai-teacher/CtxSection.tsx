import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

interface CtxSectionProps {
  icon:         React.ElementType
  title:        string
  defaultOpen?: boolean
  children:     React.ReactNode
  badge?:       string | number
  /** Optional right-side element (e.g. XP label) */
  extra?:       React.ReactNode
}

export function CtxSection({
  icon: Icon,
  title,
  defaultOpen = false,
  children,
  badge,
  extra,
}: CtxSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-100 dark:border-white/[0.05] last:border-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors text-left"
        aria-expanded={open}
      >
        <div className="w-7 h-7 rounded-lg bg-brand/8 dark:bg-brand/12 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-brand dark:text-brand-light" aria-hidden="true" />
        </div>
        <span className="flex-1 text-[12px] font-semibold text-gray-700 dark:text-gray-300">{title}</span>
        {extra}
        {badge !== undefined && (
          <span className="text-[10px] font-bold text-brand dark:text-brand-light bg-brand/10 dark:bg-brand/15 px-1.5 py-0.5 rounded-md">
            {badge}
          </span>
        )}
        <ChevronDown
          className={cn('w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="ctx-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
