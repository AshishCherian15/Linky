import { useStore } from '../store/useStore'
import { t } from '../utils/i18n'

function Sparkline({ values }: { values: number[] }) {
  if (!values.length) return null
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-0.5 h-4">
      {values.map((v, i) => (
        <span
          key={i}
          className="spark-bar"
          style={{ height: `${Math.max(3, Math.round((v / max) * 16))}px`, width: 3 }}
        />
      ))}
    </div>
  )
}

export default function StatsBar() {
  const showStats     = useStore((s) => s.settings.showStats)
  const activeProfile = useStore((s) => s.activeProfile)
  const userName      = useStore((s) => s.settings.userName)
  const lang          = useStore((s) => s.settings.language)
  const analytics     = useStore((s) => s.analytics)
  const openDialog    = useStore((s) => s.openDialog)
  if (!showStats) return null

  const shortcuts   = activeProfile().shortcuts
  const totalClicks = shortcuts.reduce((s, c) => s + c.clicks, 0)
  const pinned      = shortcuts.filter((s) => s.pinned).length
  const groupSet    = [...new Set(shortcuts.map((s) => s.group).filter(Boolean))]
  const top5        = [...shortcuts].sort((a,b) => b.clicks - a.clicks).slice(0,5)

  const groupClicks: Record<string,number> = {}
  shortcuts.forEach((s) => { if (s.group) groupClicks[s.group] = (groupClicks[s.group]??0) + s.clicks })
  const topGroup = Object.entries(groupClicks).sort((a,b) => b[1]-a[1])[0]

  const todayKey = new Date().toISOString().slice(0, 10)
  const todayLaunches = analytics.dailyLaunches[todayKey] ?? 0
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
  const last7Values = last7.map((k) => analytics.dailyLaunches[k] ?? 0)
  const activeDays = last7Values.filter((v) => v > 0).length

  const topTodayEntry = Object.entries(analytics.shortcutDaily[todayKey] ?? {}).sort((a, b) => b[1] - a[1])[0]
  const topTodayShortcut = topTodayEntry
    ? shortcuts.find((s) => s.id === topTodayEntry[0])
    : null

  const stats = [
    {
      icon: '👋',
      label: t(lang, 'welcomeBack'),
      value: userName || 'You',
      sub: `${shortcuts.length} ${t(lang, 'shortcutsReady')}`,
      spark: null,
    },
    {
      icon: '🔗',
      label: t(lang, 'library'),
      value: String(shortcuts.length),
      sub: `${groupSet.length} ${t(lang, 'groups')} · ${pinned} ${t(lang, 'pinned')}`,
      spark: null,
    },
    {
      icon: '🏆',
      label: t(lang, 'mostClicked'),
      value: top5[0]?.name ?? '—',
      sub: top5[0] ? `${top5[0].clicks} ${t(lang, 'launches')}` : t(lang, 'notTracked'),
      spark: top5.map((s) => s.clicks),
    },
    {
      icon: '⚡',
      label: t(lang, 'totalLaunches'),
      value: totalClicks > 0 ? String(totalClicks) : '—',
      sub: topGroup ? `${t(lang, 'topGroup')}: ${topGroup[0]}` : t(lang, 'noActivity'),
      spark: null,
    },
    {
      icon: '📈',
      label: t(lang, 'activity7d'),
      value: `${todayLaunches} ${t(lang, 'today')}`,
      sub: activeDays > 0 ? `${activeDays}/7 ${t(lang, 'activeDays')}` : t(lang, 'noActivity'),
      spark: last7Values,
    },
    {
      icon: '🔥',
      label: t(lang, 'topToday'),
      value: topTodayShortcut?.name ?? '—',
      sub: topTodayEntry ? `${topTodayEntry[1]} ${t(lang, 'launches')}` : t(lang, 'notTracked'),
      spark: null,
    },
  ]

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
      {stats.map((st, i) => (
        <div
          key={st.label}
          className="stat-card rounded-[18px] px-4 py-3.5 min-h-[96px] animate-rise cursor-pointer hover:border-accent/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          style={{ animationDelay: `${i * 55}ms` }}
          onClick={() => openDialog('analytics')}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="field-label mb-1">{st.label}</p>
              <p className="font-display text-[15px] font-bold text-white leading-tight truncate">
                {st.value}
              </p>
              <p className="mt-0.5 text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {st.sub}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-xl leading-none">{st.icon}</span>
              {st.spark && st.spark.some((v) => v > 0) && (
                <Sparkline values={st.spark} />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
