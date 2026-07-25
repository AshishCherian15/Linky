import { useEffect, useState } from 'react'
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
import AnalyticsDashboard   from './components/dialogs/AnalyticsDashboard'
import AuthDialog           from './components/dialogs/AuthDialog'
import { t } from './utils/i18n'

export default function App() {
  const accent     = useStore((s) => s.settings.accent)
  const showFooter = useStore((s) => s.settings.showFooter)
  const showTips   = useStore((s) => s.settings.showTips)
  const openDialog = useStore((s) => s.openDialog)

  const language = useStore((s) => s.settings.language)
  const syncToken = useStore((s) => s.settings.browserSyncToken)
  const [dragOver, setDragOver] = useState(false)

  /* sync sync token to electron main process */
  useEffect(() => {
    if ((window as any).linkyDesktop?.updateToken) {
      (window as any).linkyDesktop.updateToken(syncToken)
    }
  }, [syncToken])

  /* listen for browser extension saved links */
  useEffect(() => {
    if ((window as any).linkyDesktop?.onAddShortcut) {
      const unsub = (window as any).linkyDesktop.onAddShortcut((data: any) => {
        openDialog('add-shortcut', {
          url: data.url,
          name: data.name || '',
          group: data.group || 'General',
          tags: data.tags || [],
          description: data.description || '',
          icon: '',
          pinned: false,
          clicks: 0,
          createdAt: Date.now(),
          id: ''
        })
      })
      return unsub
    }
  }, [openDialog])

  /* page drag-and-drop listener */
  useEffect(() => {
    function onDragOver(e: DragEvent) {
      e.preventDefault()
      const isLink = e.dataTransfer?.types.includes('text/uri-list') || e.dataTransfer?.types.includes('text/plain')
      if (isLink) setDragOver(true)
    }
    
    function onDragLeave(e: DragEvent) {
      e.preventDefault()
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setDragOver(false)
      }
    }
    
    function onDrop(e: DragEvent) {
      e.preventDefault()
      setDragOver(false)
      const urlText = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text/plain') || ''
      const cleanedUrl = urlText.trim().split('\n')[0] || ''
      if (cleanedUrl && (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://') || cleanedUrl.includes('.'))) {
        openDialog('add-shortcut', {
          url: cleanedUrl,
          name: '',
          group: '',
          tags: [],
          description: '',
          icon: '',
          pinned: false,
          clicks: 0,
          createdAt: Date.now(),
          id: ''
        })
      }
    }
    
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [openDialog])

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
      <AnalyticsDashboard />
      <AuthDialog />

      {dragOver && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none" style={{ background: 'rgba(6, 12, 26, 0.85)', border: '4px dashed var(--accent)', backdropFilter: 'blur(8px)' }}>
          <div className="text-center animate-float">
            <span className="text-7xl">📥</span>
            <p className="text-xl font-bold mt-4 text-white">Drop link anywhere to save to Linky!</p>
            <p className="text-xs text-white/40 mt-1">We will automatically fetch page preview details.</p>
          </div>
        </div>
      )}
    </>
  )
}
