import { useRef, useState } from 'react'
import { useStore } from '../../store/useStore'
import { fileToBase64, getInitials } from '../../utils/helpers'
import { t } from '../../utils/i18n'

export default function WelcomeDialog() {
  const isFirstRun      = useStore((s) => s.isFirstRun)
  const setFirstRunDone = useStore((s) => s.setFirstRunDone)
  const updateSettings  = useStore((s) => s.updateSettings)
  const language        = useStore((s) => s.settings.language)

  const [name, setName]       = useState('')
  const [avatar, setAvatar]   = useState('')   // base64 or URL
  const [error, setError]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  if (!isFirstRun) return null

  function getLocalizedGreeting() {
    const h = new Date().getHours()
    if (h < 12) return t(language, 'goodMorning')
    if (h < 17) return t(language, 'goodAfternoon')
    return t(language, 'goodEvening')
  }

  const features = [
    { icon: '⚡', label: t(language, 'oneClickLaunch'), desc: t(language, 'oneClickDesc') },
    { icon: '🗂', label: t(language, 'smartGroups'), desc: t(language, 'smartGroupsDesc') },
    { icon: '🎨', label: t(language, 'fullControl'), desc: t(language, 'fullControlDesc') },
  ]

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const b64 = await fileToBase64(f)
    setAvatar(b64)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return setError(t(language, 'whatToCall'))
    updateSettings({ userName: clean, userAvatar: avatar })
    setFirstRunDone()
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog-panel animate-scaleIn relative overflow-hidden max-w-sm w-full text-center">
        {/* ambient glow */}
        <div className="welcome-bg" />

        {/* Avatar upload */}
        <div className="relative z-10 mb-5 flex justify-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative flex items-center justify-center overflow-hidden transition-all duration-200"
            style={{
              width: 80, height: 80, borderRadius: '50%',
              background: avatar ? 'transparent' : 'linear-gradient(135deg, var(--accent), #7c9eff)',
              boxShadow: avatar ? `0 0 0 3px var(--accent), var(--accent-glow)` : 'var(--accent-glow-lg)',
              border: '3px solid color-mix(in srgb, var(--accent) 60%, transparent)',
            }}
            title={t(language, 'uploadYourPhoto')}
          >
            {avatar
              ? <img src={avatar} alt="You" className="w-full h-full object-cover" />
              : name
                ? <span className="font-display text-2xl font-black text-white">{getInitials(name) || '👤'}</span>
                : <span className="text-3xl">👤</span>
            }
            {/* hover overlay */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: 'rgba(0,0,0,0.55)', borderRadius: '50%' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[9px] font-semibold text-white/80">{t(language, 'uploadPhoto')}</span>
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          {/* small edit badge */}
          <div
            className="absolute bottom-0 right-[calc(50%-48px)] flex h-5 w-5 items-center justify-center rounded-full"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #7c9eff)',
              boxShadow: 'var(--accent-glow)',
              border: '1.5px solid rgba(0,0,0,0.5)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>

        <h2 className="font-display relative z-10 text-[22px] font-bold text-white mb-1">
          {t(language, 'welcomeTitle')}
        </h2>
        <p className="relative z-10 text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {getLocalizedGreeting()} — {t(language, 'welcomeSub')}
        </p>

        {/* Feature cards */}
        <div className="relative z-10 grid grid-cols-3 gap-2 mb-5">
          {features.map((f) => (
            <div key={f.label}
              className="flex flex-col items-center gap-1.5 rounded-[14px] px-2 py-3"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-xl">{f.icon}</span>
              <span className="text-[11px] font-semibold text-white/80">{f.label}</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.38)' }}>{f.desc}</span>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="relative z-10 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="field-label">{t(language, 'whatToCall')}</label>
            <input
              className="input-base text-center"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder={t(language, 'yourName')}
              maxLength={40}
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center py-3 text-sm">
            {avatar ? `${t(language, 'letsGo').replace('←', '').replace('→', '').trim()}, ${name || 'you'} →` : t(language, 'letsGo')}
          </button>
          {!avatar && (
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {t(language, 'addPhotoLater')}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
