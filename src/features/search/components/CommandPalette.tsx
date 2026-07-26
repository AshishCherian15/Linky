import { useEffect, useState } from 'react'
import { useStore } from '../../../store/useStore'
import { getFavicon, isValidUrl, normalizeUrl } from '../../../lib/helpers'
import { t } from '../../../lib/i18n'
import type { Shortcut } from '../../../types'

type CommandOption = 
  | { type: 'shortcut'; data: Shortcut }
  | { type: 'action'; id: string; name: string; icon: string }

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const activeProfile = useStore((s) => s.activeProfile)
  const openDialog = useStore((s) => s.openDialog)
  const trackClick = useStore((s) => s.trackClick)
  const settings = useStore((s) => s.settings)
  const lang = settings.language ?? 'en'

  const shortcuts = activeProfile().shortcuts
  const filteredShortcuts = shortcuts.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.url.toLowerCase().includes(query.toLowerCase()) ||
    s.group?.toLowerCase().includes(query.toLowerCase()) ||
    s.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  )

  // Add Settings as an option
  const commandOptions: CommandOption[] = [
    ...filteredShortcuts.map(s => ({ type: 'shortcut' as const, data: s })),
    { type: 'action' as const, id: 'settings', name: t(lang, 'settings'), icon: '⚙️' },
  ]

  // Open/close with Cmd/Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
        setQuery('')
        setSelectedIndex(0)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % commandOptions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + commandOptions.length) % commandOptions.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleSelect(commandOptions[selectedIndex])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, selectedIndex, commandOptions])

  function handleSelect(option: CommandOption) {
    if (option.type === 'shortcut') {
      const shortcut = option.data
      const url = normalizeUrl(shortcut.url)
      if (isValidUrl(url)) {
        trackClick(shortcut.id)
        if (settings.openInNewTab) {
          window.open(url, '_blank', 'noopener,noreferrer')
        } else {
          window.location.href = url
        }
      }
    } else if (option.id === 'settings') {
      openDialog('settings')
    }
    setIsOpen(false)
    setQuery('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4">
        <div className="rounded-2xl bg-[#1a1a2e] border border-white/10 shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <span className="text-white/40">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              placeholder={t(lang, 'searchPlaceholder') || 'Search shortcuts...'}
              className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-base"
              autoFocus
            />
            <kbd className="px-2 py-1 rounded bg-white/5 text-white/30 text-xs">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto py-2">
            {commandOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-white/40">
                No results found
              </div>
            ) : (
              commandOptions.map((option, index) => (
                <div
                  key={option.type === 'shortcut' ? option.data.id : option.id}
                  onClick={() => handleSelect(option)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedIndex 
                      ? 'bg-white/10' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  {option.type === 'shortcut' ? (
                    <>
                      <img 
                        src={option.data.icon || getFavicon(option.data.url)} 
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getFavicon(option.data.url)
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{option.data.name}</div>
                        <div className="text-white/40 text-sm truncate">{option.data.url}</div>
                      </div>
                      {option.data.pinned && <span className="text-yellow-400">📌</span>}
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1 text-white font-medium">{option.name}</div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/10 flex items-center gap-4 text-xs text-white/30">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5">↵</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5">ESC</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
