import { useEffect, useRef } from 'react'
import { useStore } from '../../../store/useStore'
import { getSearchUrl } from '../../../lib/helpers'
import { t } from '../../../lib/i18n'

const ENGINE_ICONS: Record<string, string> = {
  google:     'G',
  bing:       'B',
  duckduckgo: 'D',
  brave:      'Br',
  custom:     '✦',
}

export default function SearchBar() {
  const searchQuery   = useStore((s) => s.searchQuery)
  const setSearch     = useStore((s) => s.setSearch)
  const settings      = useStore((s) => s.settings)
  const activeProfile = useStore((s) => s.activeProfile)
  const inputRef      = useRef<HTMLInputElement>(null)
  const lang          = settings.language ?? 'en'

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') { setSearch(''); inputRef.current?.blur() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSearch])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const q = searchQuery.trim()
    if (!q) return
    const match = activeProfile().shortcuts.some((s) =>
      `${s.name} ${s.url} ${s.group} ${(s.tags ?? []).join(' ')} ${s.description ?? ''} ${s.icon ?? ''}`.toLowerCase().includes(q.toLowerCase()))
    if (match) return
    const url = getSearchUrl(settings.searchEngine, settings.customSearchUrl, q)
    if (settings.openInNewTab) window.open(url, '_blank', 'noopener,noreferrer')
    else window.location.href = url
  }

  const icon = ENGINE_ICONS[settings.searchEngine] ?? '?'

  return (
    <div className="glass ring-accent search-wrap rounded-[20px] px-4 py-3 transition-all duration-200">
      <div className="flex items-center gap-3">

        {/* Search icon */}
        <svg className="shrink-0" style={{ width:18, height:18, color:'rgba(255,255,255,0.32)' }}
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>

        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t(lang, 'searchPlaceholder')}
          className="flex-1 bg-transparent text-sm text-white placeholder-white/28 focus:outline-none"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          {searchQuery && (
            <button
              onClick={() => { setSearch(''); inputRef.current?.focus() }}
              className="search-clear flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
              aria-label="Clear"
            >
              ×
            </button>
          )}

          {/* Engine badge */}
          <div
            className="flex h-6 min-w-[24px] items-center justify-center rounded-lg px-1.5 text-[9px] font-black tracking-wider transition-all duration-150"
            style={{
              background: 'color-mix(in srgb, var(--accent) 14%, rgba(255,255,255,0.05))',
              border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
              color: 'var(--accent)',
            }}
            title={`${t(lang, 'searchEngine')}: ${settings.searchEngine}`}
          >
            {icon}
          </div>

          {!searchQuery && (
            <kbd className="hidden sm:flex items-center justify-center rounded-lg border px-1.5 py-0.5 text-[9px] font-mono"
              style={{ borderColor:'rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.28)' }}>
              /
            </kbd>
          )}
        </div>
      </div>
    </div>
  )
}
