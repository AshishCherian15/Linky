import { useStore } from '../../store/useStore'
import { t } from '../../utils/i18n'

export default function AnalyticsDashboard() {
  const dialog = useStore((s) => s.dialog)
  const closeDialog = useStore((s) => s.closeDialog)
  const activeProfile = useStore((s) => s.activeProfile)
  const analytics = useStore((s) => s.analytics)
  const settings = useStore((s) => s.settings)
  const lang = settings.language ?? 'en'

  if (dialog !== 'analytics') return null

  const shortcuts = activeProfile().shortcuts
  const totalClicks = shortcuts.reduce((sum, s) => sum + s.clicks, 0)
  
  // Tag counts
  const tagCounts: Record<string, number> = {}
  shortcuts.forEach((s) => {
    (s.tags ?? []).forEach((t) => {
      const tag = t.trim().toLowerCase()
      if (tag) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    })
  })
  
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  
  const totalTagUses = Object.values(tagCounts).reduce((sum, v) => sum + v, 0)

  // Top 5 clicked shortcuts
  const topShortcuts = [...shortcuts]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5)

  // Weekly activity (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
  
  const dailyLaunches = last7Days.map((day) => analytics.dailyLaunches[day] ?? 0)
  const maxLaunches = Math.max(...dailyLaunches, 1)

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && closeDialog()}>
      <div className="dialog-panel-lg relative overflow-hidden" style={{ maxWidth: 640 }}>
        {/* ambient background glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 z-0"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 70%)`,
          }}
        />

        <div className="relative z-10 flex items-center justify-between border-b pb-3 mb-5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h2 className="font-display text-base font-bold text-white">{t(lang, 'analyticsTitle') || 'Analytics Dashboard'}</h2>
          </div>
          <button onClick={closeDialog} className="btn-icon w-8 h-8 text-white/50 hover:text-white border-0 bg-transparent">✕</button>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3 mb-6">
          <div className="glass rounded-2xl p-4 text-center">
            <p className="field-label mb-1">Total Shortcuts</p>
            <p className="font-display text-2xl font-bold text-white">{shortcuts.length}</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="field-label mb-1">Total Launches</p>
            <p className="font-display text-2xl font-bold" style={{ color: 'var(--accent)' }}>{totalClicks}</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="field-label mb-1">Unique Tags</p>
            <p className="font-display text-2xl font-bold text-white">{Object.keys(tagCounts).length}</p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Panel: Activity & Top Links */}
          <div className="flex flex-col gap-4">
            {/* Weekly Activity Line/Bar Graph */}
            <div className="glass rounded-2xl p-4">
              <p className="field-label mb-4">Launch Activity (Last 7 Days)</p>
              <div className="flex items-end justify-between gap-1.5 h-24 px-2">
                {last7Days.map((day, idx) => {
                  const launches = dailyLaunches[idx] || 0
                  const heightPct = Math.round((launches / maxLaunches) * 100)
                  const label = new Date(day).toLocaleDateString([], { weekday: 'short' })
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2 group/bar cursor-default">
                      <div className="relative w-full flex items-end justify-center h-16">
                        {/* Tooltip */}
                        <span className="absolute -top-6 scale-0 group-hover/bar:scale-100 transition-transform duration-100 text-[10px] bg-black/80 px-1.5 py-0.5 rounded text-white border border-white/10 pointer-events-none select-none z-20">
                          {launches}
                        </span>
                        <div 
                          className="w-full max-w-[14px] rounded-t-md transition-all duration-300"
                          style={{ 
                            height: `${Math.max(4, heightPct)}%`,
                            background: launches > 0 
                              ? 'linear-gradient(to top, var(--accent), #6c8fff)' 
                              : 'rgba(255,255,255,0.06)'
                          }}
                        />
                      </div>
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top Shortcuts */}
            <div className="glass rounded-2xl p-4 flex-1">
              <p className="field-label mb-3">Top Shortcuts</p>
              <div className="flex flex-col gap-2">
                {topShortcuts.length > 0 ? (
                  topShortcuts.map((s, idx) => {
                    const pct = totalClicks > 0 ? Math.round((s.clicks / totalClicks) * 100) : 0
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="w-4 text-white/30 font-bold">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white/80 truncate">{s.name}</p>
                          <div className="w-full bg-white/5 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                          </div>
                        </div>
                        <span className="shrink-0 font-mono font-bold text-white/60">{s.clicks}</span>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-white/30 text-center py-4">No launch activity recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Tags Distribution */}
          <div className="glass rounded-2xl p-4 flex flex-col">
            <p className="field-label mb-3">Top Tags Distribution</p>
            <div className="flex-1 flex flex-col gap-2.5 justify-center">
              {sortedTags.length > 0 ? (
                sortedTags.map(([tag, count]) => {
                  const pct = totalTagUses > 0 ? Math.round((count / totalTagUses) * 100) : 0
                  return (
                    <div key={tag} className="flex items-center gap-3 text-xs">
                      <span className="w-20 truncate text-white/70 font-medium">#{tag}</span>
                      <div className="flex-1 bg-white/5 h-3 rounded-md overflow-hidden relative">
                        <div 
                          className="h-full transition-all duration-300" 
                          style={{ 
                            width: `${pct}%`, 
                            background: 'linear-gradient(to right, color-mix(in srgb, var(--accent) 50%, transparent), var(--accent))' 
                          }} 
                        />
                        <span className="absolute right-1.5 inset-y-0 flex items-center font-mono text-[9px] text-white/40 font-bold">{pct}%</span>
                      </div>
                      <span className="shrink-0 font-mono font-bold text-white/60 w-6 text-right">{count}</span>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🏷️</p>
                  <p className="text-xs text-white/30">Add tags to your shortcuts to view distribution chart.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="btn-primary px-5 py-2 text-xs" onClick={closeDialog}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
