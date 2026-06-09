import { useEffect } from 'react'
import { useStore } from './store/useStore'

import Background        from './components/Background'
import AppBar            from './components/AppBar'
import Clock             from './components/Clock'
import SearchBar         from './components/SearchBar'
import StatsBar          from './components/StatsBar'
import ShortcutGrid      from './components/ShortcutGrid'

import WelcomeDialog        from './components/dialogs/WelcomeDialog'
import ShortcutDialog       from './components/dialogs/ShortcutDialog'
import BackgroundDialog     from './components/dialogs/BackgroundDialog'
import SettingsDialog       from './components/dialogs/SettingsDialog'
import ProfileManagerDialog from './components/dialogs/ProfileManagerDialog'
import ShortcutViewDialog   from './components/dialogs/ShortcutViewDialog'
import { t } from './utils/i18n'

export default function App() {
  const accent     = useStore((s) => s.settings.accent)
  const showFooter = useStore((s) => s.settings.showFooter)
  const showTips   = useStore((s) => s.settings.showTips)
  const openDialog = useStore((s) => s.openDialog)

  const language = useStore((s) => s.settings.language)

  /* sync language direction */
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir  = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  /* sync accent CSS var + RGB breakdown */
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent)
    const h = accent.replace('#', '')
    const r = parseInt(h.slice(0,2), 16)
    const g = parseInt(h.slice(2,4), 16)
    const b = parseInt(h.slice(4,6), 16)
    if (!isNaN(r+g+b))
      document.documentElement.style.setProperty('--accent-rgb', `${r},${g},${b}`)
  }, [accent])

  /* global keyboard shortcuts */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const busy = tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'
      if (busy) return
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) openDialog('add-shortcut')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openDialog])

  const lang = language ?? 'en'
  const tips = [
    ['/', t(lang, 'tipSearch')],
    ['n', t(lang, 'tipAdd')],
    ['drag', t(lang, 'tipDrag')],
    ['hover', t(lang, 'tipHover')],
  ] as const

  return (
    <>
      {/* Ambient background orbs */}
      <div className="orb orb-1" aria-hidden />
      <div className="orb orb-2" aria-hidden />
      <div className="orb orb-3" aria-hidden />

      <Background />

      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 mx-auto w-full max-w-[1520px] px-3 sm:px-4 lg:px-6 pt-3 pb-8 flex flex-col gap-4 lg:gap-5">

          <AppBar />

          {/* Hero row: search + clock */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch lg:gap-4">
            <div className="flex-1"><SearchBar /></div>
            <Clock />
          </div>

          <StatsBar />
          <ShortcutGrid />

          {showTips && (
            <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-1.5">
              {tips.map(([key, desc]) => (
                <span key={key} className="flex items-center gap-1.5 text-[10px] text-white/22 select-none">
                  <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/35">
                    {key}
                  </kbd>
                  {desc}
                </span>
              ))}
            </div>
          )}
        </div>

        {showFooter && (
          <footer className="pb-4 text-center text-[10px] tracking-[0.18em] uppercase select-none"
            style={{ color: 'rgba(255,255,255,0.15)' }}>
            {t(lang, 'footerTagline')}
          </footer>
        )}
      </div>

      <WelcomeDialog />
      <ShortcutDialog />
      <BackgroundDialog />
      <SettingsDialog />
      <ProfileManagerDialog />
      <ShortcutViewDialog />
    </>
  )
}
