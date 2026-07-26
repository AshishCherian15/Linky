import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import { detectBgType, getYoutubeId, isValidUrl, normalizeBackgroundSrc } from '../../../lib/helpers'
import { t } from '../../../lib/i18n'
import type { Background, BackgroundType } from '../../../types'

type BgTab = 'presets' | 'url' | 'solid'

const PRESETS = [
  { label: 'Space Drive', src: '/space-drive.webm', type: 'video' as BackgroundType },
  { label: 'Aurora',      src: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80', type: 'image' as BackgroundType },
  { label: 'Deep Ocean',  src: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1920&q=80', type: 'image' as BackgroundType },
  { label: 'Night City',  src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80', type: 'image' as BackgroundType },
  { label: 'Galaxy',      src: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80', type: 'image' as BackgroundType },
  { label: 'Forest',      src: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80', type: 'image' as BackgroundType },
]

const GRADIENT_PRESETS = [
  { label: 'Midnight',  from: '#0f0c29', to: '#302b63' },
  { label: 'Ocean',     from: '#0575e6', to: '#021b79' },
  { label: 'Sunset',    from: '#f7971e', to: '#ffd200' },
  { label: 'Aurora',    from: '#00c6ff', to: '#0072ff' },
  { label: 'Cosmos',    from: '#1a1a2e', to: '#16213e' },
  { label: 'Rose',      from: '#ee0979', to: '#ff6a00' },
]

export default function BackgroundDialog() {
  const dialog          = useStore((s) => s.dialog)
  const background      = useStore((s) => s.background)
  const settings        = useStore((s) => s.settings)
  const closeDialog     = useStore((s) => s.closeDialog)
  const setBackground   = useStore((s) => s.setBackground)
  const resetBackground = useStore((s) => s.resetBackground)

  const lang = settings.language ?? 'en'

  const [bgTab, setBgTab]     = useState<BgTab>('presets')
  const [urlType, setUrlType] = useState<BackgroundType | 'auto'>('auto')
  const [src, setSrc]         = useState('')
  const [error, setError]     = useState('')

  // solid/gradient state
  const [solidColor, setSolidColor]   = useState(background.bgColor ?? '#0a1020')
  const [gradFrom, setGradFrom]       = useState('#0f0c29')
  const [gradTo, setGradTo]           = useState('#302b63')
  const [gradAngle, setGradAngle]     = useState(135)
  const [useGradient, setUseGradient] = useState(false)

  if (dialog !== 'background') return null

  function applyPreset(p: typeof PRESETS[0]) {
    setBackground({ type: p.type, src: p.src, sourceKind: 'url' })
    closeDialog()
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const ftype: BackgroundType = f.type.startsWith('video/') ? 'video' : 'image'
    setBackground({ type: ftype, src: URL.createObjectURL(f), sourceKind: 'upload' })
    closeDialog()
  }

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!src.trim()) { resetBackground(); closeDialog(); return }
    const norm     = normalizeBackgroundSrc(src.trim())
    if (!isValidUrl(norm)) return setError('Please enter a valid URL.')
    const resolved: BackgroundType = urlType === 'auto' ? detectBgType(norm) : urlType as BackgroundType
    if (resolved === 'youtube' && !getYoutubeId(norm)) return setError('Could not find a YouTube video ID.')
    setBackground({ type: resolved, src: norm, sourceKind: 'url' })
    closeDialog()
  }

  function applySolidOrGradient() {
    const bg: Background = useGradient
      ? { type: 'none', src: '', sourceKind: 'url', bgGradient: `linear-gradient(${gradAngle}deg, ${gradFrom}, ${gradTo})` }
      : { type: 'none', src: '', sourceKind: 'url', bgColor: solidColor }
    setBackground(bg)
    closeDialog()
  }

  const previewStyle = useGradient
    ? { background: `linear-gradient(${gradAngle}deg, ${gradFrom}, ${gradTo})` }
    : { background: solidColor }

  const tabCls = (active: boolean) =>
    `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
      active
        ? 'text-white'
        : 'text-white/50 hover:text-white/75'
    }`

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && closeDialog()}>
      <div className="dialog-panel" style={{ maxWidth: 480 }}>
        <h2 className="font-display text-base font-bold text-white mb-4">
          🖼 {t(lang, 'backgroundTitle')}
        </h2>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {([
            ['presets', `🎬 ${t(lang, 'quickPresets')}`],
            ['url', `🔗 ${t(lang, 'orPasteUrl')}`],
            ['solid', `🎨 ${t(lang, 'solidGradient')}`],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setBgTab(id)}
              className={tabCls(bgTab === id)}
              style={bgTab === id ? {
                background: 'linear-gradient(135deg, var(--accent), #6c8fff)',
                boxShadow: '0 2px 10px color-mix(in srgb, var(--accent) 30%, transparent)',
              } : {}}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Presets tab ── */}
        {bgTab === 'presets' && (
          <div className="flex flex-col gap-3">
            <p className="field-label">{t(lang, 'quickPresets')}</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.src}
                  onClick={() => applyPreset(p)}
                  className="group relative rounded-[14px] overflow-hidden aspect-video border-2 transition-all duration-150"
                  style={{
                    borderColor: background.src === p.src ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                    boxShadow:   background.src === p.src ? 'var(--accent-glow)' : 'none',
                  }}
                >
                  {p.type === 'image' && (
                    <img src={p.src.replace('w=1920','w=320')} alt={p.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  )}
                  {p.type === 'video' && (
                    <div className="w-full h-full flex items-center justify-center text-2xl"
                      style={{ background: 'linear-gradient(135deg,#0a1020,#1a0a30)' }}>🎬</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 px-1.5 pb-1 pt-3"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                    <p className="text-[10px] font-semibold text-white truncate">{p.label}</p>
                  </div>
                  {background.src === p.src && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--accent)' }}>
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              className="btn-ghost text-xs mt-1 w-fit"
              onClick={() => { resetBackground(); closeDialog() }}
            >
              {t(lang, 'resetDefault')}
            </button>
          </div>
        )}

        {/* ── URL / Upload tab ── */}
        {bgTab === 'url' && (
          <form onSubmit={handleUrlSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="field-label">{t(lang, 'typeLabel')}</label>
                <select className="input-base text-xs" value={urlType}
                  onChange={(e) => setUrlType(e.target.value as BackgroundType | 'auto')}>
                  <option value="auto">{t(lang, 'autoDetect')}</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="field-label">{t(lang, 'uploadFile')}</label>
                <input type="file" accept="image/*,video/*"
                  className="text-[11px] text-white/50 file:mr-2 file:rounded-xl file:border-0 file:px-2.5 file:py-1 file:text-white file:text-[11px] file:font-semibold file:cursor-pointer"
                  onChange={handleFile} />
              </div>
            </div>
            <input className="input-base" value={src} onChange={(e) => setSrc(e.target.value)}
              placeholder={`${t(lang, 'orPasteUrl')} — https://…`} />
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {t(lang, 'uploadWarning')}
            </p>
            {error && <p className="text-xs text-red-400">⚠ {error}</p>}
            <div className="flex justify-between gap-2">
              <button type="button" className="btn-ghost text-xs"
                onClick={() => { resetBackground(); closeDialog() }}>
                {t(lang, 'resetDefault')}
              </button>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost text-xs" onClick={closeDialog}>{t(lang, 'cancel')}</button>
                <button type="submit" className="btn-primary text-xs">{t(lang, 'apply')}</button>
              </div>
            </div>
          </form>
        )}

        {/* ── Solid / Gradient tab ── */}
        {bgTab === 'solid' && (
          <div className="flex flex-col gap-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setUseGradient(false)}
                className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all border ${!useGradient ? '' : 'border-white/10 text-white/50'}`}
                style={!useGradient ? { background: 'linear-gradient(135deg, var(--accent), #6c8fff)', border: 'none', color: '#fff' } : {}}
              >
                {t(lang, 'solidColor')}
              </button>
              <button
                onClick={() => setUseGradient(true)}
                className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all border ${useGradient ? '' : 'border-white/10 text-white/50'}`}
                style={useGradient ? { background: 'linear-gradient(135deg, var(--accent), #6c8fff)', border: 'none', color: '#fff' } : {}}
              >
                Gradient
              </button>
            </div>

            {/* Preview */}
            <div className="w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '16/5' }}>
              <div className="w-full h-full" style={previewStyle} />
            </div>

            {!useGradient ? (
              /* Solid color */
              <div className="flex items-center gap-4">
                <label className="field-label mb-0">{t(lang, 'solidColor')}</label>
                <input type="color" value={solidColor}
                  onChange={(e) => setSolidColor(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-xl border-0 bg-transparent p-0" />
                <span className="text-xs font-mono text-white/60">{solidColor}</span>
              </div>
            ) : (
              /* Gradient */
              <div className="flex flex-col gap-3">
                {/* Gradient presets */}
                <div>
                  <p className="field-label mb-2">Gradient presets</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {GRADIENT_PRESETS.map((g) => (
                      <button
                        key={g.label}
                        onClick={() => { setGradFrom(g.from); setGradTo(g.to) }}
                        className="rounded-xl aspect-square border-2 transition-all hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
                          borderColor: gradFrom === g.from && gradTo === g.to ? 'var(--accent)' : 'transparent',
                        }}
                        title={g.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <label className="field-label mb-0 w-8">{t(lang, 'gradientFrom')}</label>
                    <input type="color" value={gradFrom}
                      onChange={(e) => setGradFrom(e.target.value)}
                      className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
                    <span className="text-[10px] font-mono text-white/50">{gradFrom}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="field-label mb-0 w-8">{t(lang, 'gradientTo')}</label>
                    <input type="color" value={gradTo}
                      onChange={(e) => setGradTo(e.target.value)}
                      className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
                    <span className="text-[10px] font-mono text-white/50">{gradTo}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="field-label mb-0">{t(lang, 'gradientAngle')} — {gradAngle}°</label>
                  <input type="range" min={0} max={360} value={gradAngle}
                    onChange={(e) => setGradAngle(Number(e.target.value))}
                    className="flex-1" style={{ accentColor: 'var(--accent)' }} />
                </div>
              </div>
            )}

            <div className="flex justify-between gap-2">
              <button className="btn-ghost text-xs"
                onClick={() => { resetBackground(); closeDialog() }}>
                {t(lang, 'resetDefault')}
              </button>
              <div className="flex gap-2">
                <button className="btn-ghost text-xs" onClick={closeDialog}>{t(lang, 'cancel')}</button>
                <button className="btn-primary text-xs" onClick={applySolidOrGradient}>{t(lang, 'apply')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
