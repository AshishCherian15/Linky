import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { t } from '../utils/i18n'

export default function Clock() {
  const showClock = useStore((s) => s.settings.showClock)
  const userName  = useStore((s) => s.settings.userName)
  const language  = useStore((s) => s.settings.language)

  const [hhmm, setHhmm]     = useState('')
  const [ss, setSs]         = useState('')
  const [date, setDate]     = useState('')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function tick() {
      const now = new Date()
      const h = String(now.getHours()).padStart(2,'0')
      const m = String(now.getMinutes()).padStart(2,'0')
      const s = String(now.getSeconds()).padStart(2,'0')
      setHhmm(`${h}:${m}`)
      setSs(s)
      setDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }))
      const totalSecs = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds()
      setProgress(Math.round((totalSecs / 86400) * 100))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  function getLocalizedGreeting() {
    const h = new Date().getHours()
    if (h < 12) return t(language, 'goodMorning')
    if (h < 17) return t(language, 'goodAfternoon')
    return t(language, 'goodEvening')
  }

  if (!showClock) return null

  return (
    <div className="glass ring-accent rounded-[20px] px-5 py-4 text-right shrink-0 min-w-[200px] transition-all duration-200">

      {/* Greeting */}
      {userName && (
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: 'rgba(255,255,255,0.38)' }}>
          {getLocalizedGreeting()}, {userName}
        </p>
      )}

      {/* Time — big digits */}
      <div className="flex items-baseline justify-end gap-1">
        <span
          className="clock-digits font-display font-bold tabular-nums leading-none"
          style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)', color: 'var(--accent)' }}
        >
          {hhmm || '--:--'}
        </span>
        <span
          className="font-display font-bold tabular-nums leading-none"
          style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1.1rem)', color: 'color-mix(in srgb, var(--accent) 55%, transparent)' }}
        >
          {ss || '--'}
        </span>
      </div>

      {/* Date */}
      <p className="mt-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.42)' }}>{date}</p>

      {/* Day progress bar */}
      <div className="day-progress-bg">
        <div className="day-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1 text-[9px] tabular-nums" style={{ color: 'rgba(255,255,255,0.25)' }}>
        {progress}% {t(language, 'ofDay')}
      </p>
    </div>
  )
}
