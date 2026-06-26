import { BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChartPlaceholderProps {
  label?:     string
  height?:    number
  className?: string
  /** Sprint this chart is planned for */
  sprint?:    string
}

export function ChartPlaceholder({
  label    = 'Chart',
  height   = 120,
  className,
  sprint   = '2.1',
}: ChartPlaceholderProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2',
        className,
      )}
      style={{ height }}
      aria-label={`${label} placeholder — arriving Sprint ${sprint}`}
    >
      {/* Simulated bar chart lines (purely decorative) */}
      <div className="absolute bottom-0 inset-x-0 h-3/4 px-4 flex items-end gap-1.5 pb-2 opacity-20" aria-hidden="true">
        {[40, 65, 50, 80, 55, 70, 45, 85, 60, 75].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-brand"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      {/* Content */}
      <BarChart3 className="w-5 h-5 text-gray-300 dark:text-gray-600 relative z-10" aria-hidden="true" />
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 relative z-10">
        {label} · Sprint {sprint}
      </p>
    </div>
  )
}
