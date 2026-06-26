import { motion } from 'framer-motion'

interface ProgressRingProps {
  value: number           // 0–100
  size?: number           // px
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
  showLabel?: boolean
  animDelay?: number
}

export function ProgressRing({
  value,
  size = 72,
  strokeWidth = 6,
  color = '#5B5CF6',
  label,
  showLabel = true,
  animDelay = 0.3,
}: ProgressRingProps) {
  const r             = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const clampedVal    = Math.min(100, Math.max(0, value))
  const dashOffset    = circumference - (clampedVal / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="text-gray-100 dark:text-gray-800"
          stroke="currentColor"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.4, ease: [0.21, 0.47, 0.32, 0.98], delay: animDelay }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-black text-gray-900 dark:text-white leading-none">
            {clampedVal}%
          </span>
          {label && (
            <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500 mt-0.5 leading-none">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
