import { cn } from "@/lib/utils"

interface AuronLogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
  textColor?: string
}

export function AuronLogo({
  className,
  showText = true,
  size = "md",
  textColor = "text-slate-900 dark:text-white",
}: AuronLogoProps) {
  const sizes = {
    sm: { container: "h-8 w-8", text: "text-lg" },
    md: { container: "h-10 w-10", text: "text-xl" },
    lg: { container: "h-12 w-12", text: "text-2xl" },
  }

  const gradientId = `auron-gradient-${size}`

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative rounded-full overflow-hidden flex-shrink-0", sizes[size].container)}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="55%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="50" fill={`url(#${gradientId})`} />
          <path
            d="M52 24 74 76 H64.5 L59.2 62.5 H40.8 L35.5 76 H26 L48 24 Z M43.5 52.5 H56.5 L50 36 Z"
            fill="white"
          />
          <path
            d="M28 58 C38 44 62 44 72 58"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.35"
          />
        </svg>
      </div>
      {showText && <span className={cn("font-bold whitespace-nowrap", textColor, sizes[size].text)}>Auron</span>}
    </div>
  )
}
