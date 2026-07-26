import { useRef, useState } from 'react'
import { useStore } from '../../../store/useStore'
import { fileToBase64, getInitials } from '../../../lib/helpers'
import { LANGUAGE_OPTIONS, t } from '../../../lib/i18n'
import type { CardStyle, GroupSort, SearchEngine, TileSize } from '../../../types'

type Tab = 'appearance' | 'behavior' | 'audio' | 'profile' | 'data'

const TABS: { id: Tab; icon: string; labelKey: 'appearance' | 'behavior' | 'audio' | 'profile' | 'data' }[] = [
  { id: 'appearance', icon: '🎨', labelKey: 'appearance' },
  { id: 'behavior',   icon: '⚡', labelKey: 'behavior' },
  { id: 'audio',      icon: '🔊', labelKey: 'audio' },
  { id: 'profile',    icon: '👤', labelKey: 'profile' },
  { id: 'data',       icon: '💾', labelKey: 'data' },
]

const ACCENTS = [
  '#3de0d0','#a78bfa','#f472b6','#60a5fa','#fb923c','#4ade80','#facc15','#f87171',
]

export default function SettingsDialog() {
  const dialog         = useStore((s) => s.dialog)
  const settings       = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const resetSettings  = useStore((s) => s.resetSettings)
  const closeDialog    = useStore((s) => s.closeDialog)
  const exportData     = useStore((s) => s.exportData)
  const exportCsvData  = useStore((s) => s.exportCsvData)
  const exportAnalyticsData = useStore((s) => s.exportAnalyticsData)
  const resetAnalyticsData  = useStore((s) => s.resetAnalyticsData)
  const importData     = useStore((s) => s.importData)
  const importCsvData  = useStore((s) => s.importCsvData)

  const [tab, setTab]               = useState<Tab>('appearance')
  const [importError, setImportError]   = useState('')
  const [importOk, setImportOk]         = useState(false)
  const [importCsvError, setImportCsvError] = useState('')
  const [importCsvOk, setImportCsvOk]       = useState(false)
  const avatarFileRef = useRef<HTMLInputElement>(null)

  if (dialog !== 'settings') return null
  const s = settings
  const lang = s.language ?? 'en'

  function reset() {
    if (!confirm(t(lang, 'resetConfirm'))) return
    resetSettings(); closeDialog()
  }

  /* ── helpers ── */
  function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-[14px] px-3.5 py-3"
        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <p className="text-[13px] font-medium text-white/80">{label}</p>
          {sub && <p className="text-[11px] mt-0.5" style={{ color:'rgba(255,255,255,0.38)' }}>{sub}</p>}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    )
  }

  function Sel<T extends string>({ value, onChange, opts }: {
    value: T; onChange: (v:T) => void; opts: {value:T; label:string}[]
  }) {
    return (
      <select
        className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white border"
        style={{ background:'rgba(0,0,0,0.4)', borderColor:'rgba(255,255,255,0.15)' }}
        value={value} onChange={(e) => onChange(e.target.value as T)}
      >
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
  }

  function Tog({ on, onChange }: { on: boolean; onChange: (v:boolean) => void }) {
    return (
      <button className="toggle" data-on={String(on)} onClick={() => onChange(!on)}>
        <span className="toggle-knob" />
      </button>
    )
  }

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && closeDialog()}>
      <div className="dialog-panel-lg !p-0 overflow-hidden flex" style={{ maxHeight:'85vh' }}>

        {/* Sidebar */}
        <div className="flex flex-col gap-1 p-4 shrink-0 border-r" style={{ width:160, borderColor:'rgba(255,255,255,0.07)', background:'rgba(0,0,0,0.18)' }}>
          <p className="field-label px-3 mb-2">{t(lang, 'settingsTitle')}</p>
          {TABS.map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`settings-tab ${tab === tabItem.id ? 'active' : ''}`}
            >
              <span className="text-base">{tabItem.icon}</span>
              <span>{t(lang, tabItem.labelKey)}</span>
            </button>
          ))}
          <div className="flex-1" />
          <button className="btn-danger text-xs py-1.5" onClick={reset}>{t(lang, 'reset')}</button>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="p-5 dialog-scroll flex flex-col gap-3 flex-1">

            {/* ── Appearance ── */}
            {tab === 'appearance' && <>
              <Row label={t(lang, 'language')}>
                <Sel
                  value={s.language}
                  onChange={(v) => updateSettings({ language: v as typeof s.language })}
                  opts={LANGUAGE_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: `${opt.native} (${opt.label})`,
                  }))}
                />
              </Row>
              <div className="rounded-[14px] p-3.5 flex flex-col gap-3"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <p className="field-label">{t(lang, 'accentColor')}</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {ACCENTS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateSettings({ accent: c })}
                      className="w-7 h-7 rounded-full border-2 transition-all duration-150 hover:scale-110"
                      style={{
                        background: c,
                        borderColor: s.accent === c ? '#fff' : 'transparent',
                        boxShadow: s.accent === c ? `0 0 10px ${c}` : 'none',
                      }}
                    />
                  ))}
                  <input
                    type="color" value={s.accent}
                    onChange={(e) => updateSettings({ accent: e.target.value })}
                    className="w-7 h-7 cursor-pointer rounded-full border-2 border-white/20 bg-transparent p-0"
                    title="Custom color"
                  />
                  {/* live preview swatch */}
                  <div
                    className="ml-auto flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold"
                    style={{ background: s.accent, color: '#000', opacity:0.9 }}
                  >
                    {s.accent}
                  </div>
                </div>
              </div>
              <Row label={t(lang, 'cardStyle')}>
                <Sel<CardStyle> value={s.cardStyle} onChange={(v) => updateSettings({ cardStyle:v })}
                  opts={[{ value:'glass', label:'Glass' }, { value:'solid', label:'Solid' }]} />
              </Row>
              <Row label={t(lang, 'tileSize')}>
                <Sel<TileSize> value={s.tileSize} onChange={(v) => updateSettings({ tileSize:v })}
                  opts={[{ value:'compact', label:'Compact' }, { value:'comfortable', label:'Comfortable' }, { value:'large', label:'Large' }]} />
              </Row>
              <Row label={t(lang, 'showClock')}>    <Tog on={s.showClock}  onChange={(v) => updateSettings({ showClock: v })} /></Row>
              <Row label={t(lang, 'showStats')}>    <Tog on={s.showStats}  onChange={(v) => updateSettings({ showStats: v })} /></Row>
              <Row label={t(lang, 'showFooter')}>   <Tog on={s.showFooter} onChange={(v) => updateSettings({ showFooter: v })} /></Row>
              <Row label={t(lang, 'showTips')}>     <Tog on={s.showTips}   onChange={(v) => updateSettings({ showTips: v })} /></Row>
            </>}

            {/* ── Behavior ── */}
            {tab === 'behavior' && <>
              <Row label={t(lang, 'openLinks')}>
                <Sel value={s.openInNewTab ? 'new' : 'same'} onChange={(v) => updateSettings({ openInNewTab: v === 'new' })}
                  opts={[{ value:'new', label:t(lang, 'newTab') }, { value:'same', label:t(lang, 'sameTab') }]} />
              </Row>
              <Row label={t(lang, 'editMode')} sub={t(lang, 'allowDrag')}>
                <Tog on={s.editMode} onChange={(v) => updateSettings({ editMode: v })} />
              </Row>
              <Row label={t(lang, 'confirmDelete')}>
                <Tog on={s.confirmDelete} onChange={(v) => updateSettings({ confirmDelete: v })} />
              </Row>
              <Row label={t(lang, 'groupSort')}>
                <Sel<GroupSort> value={s.groupSort} onChange={(v) => updateSettings({ groupSort: v })}
                  opts={[{ value:'az', label:t(lang, 'sortAZ') }, { value:'manual', label:t(lang, 'sortManual') }, { value:'most-used', label:t(lang, 'sortMostUsed') }]} />
              </Row>
              <Row label={t(lang, 'searchEngine')}>
                <Sel<SearchEngine> value={s.searchEngine} onChange={(v) => updateSettings({ searchEngine: v })}
                  opts={[
                    { value:'google', label:'Google' }, { value:'bing', label:'Bing' },
                    { value:'duckduckgo', label:'DuckDuckGo' }, { value:'brave', label:'Brave' },
                    { value:'custom', label:'Custom' },
                  ]} />
              </Row>
              {s.searchEngine === 'custom' && (
                <div className="flex flex-col gap-1.5">
                  <label className="field-label">Custom search URL <span className="normal-case font-normal">(use %s)</span></label>
                  <input className="input-base" value={s.customSearchUrl}
                    onChange={(e) => updateSettings({ customSearchUrl: e.target.value })}
                    placeholder="https://example.com/search?q=%s" />
                </div>
              )}
            </>}

            {/* ── Audio ── */}
            {tab === 'audio' && <>
              <Row label={t(lang, 'bgAudio')}><Tog on={s.bgAudio} onChange={(v) => updateSettings({ bgAudio: v })} /></Row>
              <Row label={t(lang, 'mutedDefault')}><Tog on={s.bgMuted} onChange={(v) => updateSettings({ bgMuted: v })} /></Row>
              <Row label={`${t(lang, 'volume')} — ${s.audioVolume}%`}>
                <input type="range" min={0} max={100} value={s.audioVolume}
                  onChange={(e) => updateSettings({ audioVolume: Number(e.target.value) })}
                  className="w-28" style={{ accentColor: 'var(--accent)' }} />
              </Row>
            </>}

            {/* ── Profile ── */}
            {tab === 'profile' && <>
              <div className="flex flex-col gap-1.5">
                <label className="field-label">{t(lang, 'displayName')}</label>
                <input className="input-base" value={s.userName}
                  onChange={(e) => updateSettings({ userName: e.target.value })}
                  placeholder={t(lang, 'yourName')} maxLength={40} />
              </div>

              {/* Avatar upload */}
              <div className="flex flex-col gap-2">
                <label className="field-label">{t(lang, 'profilePhoto')}</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    className="group relative overflow-hidden shrink-0 transition-all duration-150"
                    style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: s.userAvatar ? 'transparent' : 'linear-gradient(135deg, var(--accent), #6c8fff)',
                      boxShadow: 'var(--accent-glow)',
                      border: '2px solid color-mix(in srgb, var(--accent) 50%, transparent)',
                    }}
                  >
                    {s.userAvatar
                      ? <img src={s.userAvatar} alt="" className="w-full h-full object-cover" />
                      : <span className="font-bold text-white text-sm">{getInitials(s.userName) || '👤'}</span>
                    }
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '50%' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </button>
                  <div className="flex flex-col gap-2">
                    <button type="button" className="btn-ghost text-xs w-fit" onClick={() => avatarFileRef.current?.click()}>{t(lang, 'uploadPhoto')}</button>
                    {s.userAvatar && (
                      <button type="button" className="btn-ghost text-xs w-fit" style={{ color: 'rgba(255,100,100,0.9)' }} onClick={() => updateSettings({ userAvatar: '' })}>{t(lang, 'removePhoto')}</button>
                    )}
                  </div>
                  <input ref={avatarFileRef} type="file" accept="image/*" className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0]; if (!f) return
                      const b64 = await fileToBase64(f)
                      updateSettings({ userAvatar: b64 })
                    }} />
                </div>
              </div>
            </>}

            {/* ── Data ── */}
            {tab === 'data' && <>
              <div className="rounded-[14px] p-4 flex flex-col gap-2.5"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[13px] font-semibold text-white/80">{t(lang, 'exportBackup')}</p>
                <p className="text-[11px]" style={{ color:'rgba(255,255,255,0.4)' }}>
                  {t(lang, 'exportDesc')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-primary w-fit text-xs" onClick={exportData}>⬇ {t(lang, 'exportJson')}</button>
                  <button className="btn-ghost w-fit text-xs" onClick={exportCsvData}>⬇ {t(lang, 'exportCsv')} (active profile)</button>
                  <button className="btn-ghost w-fit text-xs" onClick={exportAnalyticsData}>⬇ Export analytics JSON</button>
                </div>
              </div>
              <div className="rounded-[14px] p-4 flex flex-col gap-2.5"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[13px] font-semibold text-white/80">{t(lang, 'importBackup')}</p>
                <p className="text-[11px]" style={{ color:'rgba(255,255,255,0.4)' }}>
                  {t(lang, 'importDesc')}
                </p>
                <input type="file" accept=".json"
                  className="text-xs text-white/50 file:mr-3 file:rounded-xl file:border-0 file:px-3 file:py-1.5 file:text-white file:text-xs file:font-semibold file:cursor-pointer"
                  style={{ '--file-bg':'rgba(255,255,255,0.1)' } as React.CSSProperties}
                  onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return
                    setImportError(''); setImportOk(false)
                    const r = new FileReader()
                    r.onload = (ev) => {
                      const err = importData(ev.target?.result as string)
                      if (err) setImportError(err)
                      else { setImportOk(true); setTimeout(() => setImportOk(false), 3500) }
                    }
                    r.readAsText(f)
                  }}
                />
                {importError && <p className="text-xs text-red-400">⚠ {importError}</p>}
                {importOk    && <p className="text-xs text-green-400">✓ {t(lang, 'importSuccess')}</p>}
              </div>
              <div className="rounded-[14px] p-4 flex flex-col gap-2.5"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[13px] font-semibold text-white/80">{t(lang, 'importCsvShortcuts')}</p>
                <p className="text-[11px]" style={{ color:'rgba(255,255,255,0.4)' }}>
                  {t(lang, 'importCsvDesc')}
                </p>
                <input type="file" accept=".csv,text/csv"
                  className="text-xs text-white/50 file:mr-3 file:rounded-xl file:border-0 file:px-3 file:py-1.5 file:text-white file:text-xs file:font-semibold file:cursor-pointer"
                  style={{ '--file-bg':'rgba(255,255,255,0.1)' } as React.CSSProperties}
                  onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return
                    setImportCsvError(''); setImportCsvOk(false)
                    const r = new FileReader()
                    r.onload = (ev) => {
                      const err = importCsvData(ev.target?.result as string)
                      if (err) setImportCsvError(err)
                      else { setImportCsvOk(true); setTimeout(() => setImportCsvOk(false), 3500) }
                    }
                    r.readAsText(f)
                  }}
                />
                {importCsvError && <p className="text-xs text-red-400">⚠ {importCsvError}</p>}
                {importCsvOk    && <p className="text-xs text-green-400">✓ {t(lang, 'importCsvSuccess')}</p>}
              </div>
              <div className="rounded-[14px] p-4 flex flex-col gap-2.5"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[13px] font-semibold text-white/80">{t(lang, 'analyticsControls')}</p>
                <p className="text-[11px]" style={{ color:'rgba(255,255,255,0.4)' }}>
                  {t(lang, 'analyticsResetDesc')}
                </p>
                <button
                  className="btn-danger w-fit text-xs"
                  onClick={() => {
                    if (!confirm(t(lang, 'analyticsResetConfirm'))) return
                    resetAnalyticsData()
                  }}
                >
                  {t(lang, 'analyticsResetAction')}
                </button>
              </div>
            </>}
          </div>

          <div className="px-5 pb-4 flex justify-end">
            <button className="btn-primary" onClick={closeDialog}>{t(lang, 'done')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
