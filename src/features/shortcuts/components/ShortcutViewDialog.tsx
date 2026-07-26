import { useStore } from '../../../store/useStore'
import { getFavicon, isValidUrl, normalizeUrl } from '../../../lib/helpers'
import { t } from '../../../lib/i18n'

function MetaRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] px-3.5 py-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <span className="text-base shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
          style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
        <p className="text-sm font-medium text-white truncate">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function ShortcutViewDialog() {
  const dialog          = useStore((s) => s.dialog)
  const shortcut        = useStore((s) => s.viewingShortcut)
  const settings        = useStore((s) => s.settings)
  const closeDialog     = useStore((s) => s.closeDialog)
  const openDialog      = useStore((s) => s.openDialog)
  const trackClick      = useStore((s) => s.trackClick)
  const togglePin       = useStore((s) => s.togglePin)
  const deleteShortcut  = useStore((s) => s.deleteShortcut)
  const lang            = settings.language ?? 'en'

  if (dialog !== 'view-shortcut' || !shortcut) return null

  const iconSrc = shortcut.icon && isValidUrl(normalizeUrl(shortcut.icon))
    ? normalizeUrl(shortcut.icon)
    : getFavicon(shortcut.url)

  let domainLabel = ''
  try { domainLabel = new URL(shortcut.url).hostname.replace(/^www\./, '') } catch { /* */ }

  const addedDate = new Date(shortcut.createdAt).toLocaleDateString([], {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  function launch() {
    const url = normalizeUrl(shortcut!.url)
    if (!isValidUrl(url)) return
    trackClick(shortcut!.id)
    closeDialog()
    if (settings.openInNewTab) window.open(url, '_blank', 'noopener,noreferrer')
    else window.location.href = url
  }

  function handleDelete() {
    if (settings.confirmDelete && !confirm(`${t(lang, 'delete')} "${shortcut!.name}"?`)) return
    deleteShortcut(shortcut!.id)
    closeDialog()
  }

  return (
    <div
      className="dialog-backdrop"
      onClick={(e) => e.target === e.currentTarget && closeDialog()}
    >
      <div className="dialog-panel relative overflow-hidden" style={{ maxWidth: 420 }}>
        {/* ambient top glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 z-0"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 70%)`,
          }}
        />

        {/* ── Header ── */}
        <div className="relative z-10 flex flex-col items-center text-center mb-5">
          {/* big icon */}
          <div
            className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-[22px] overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: shortcut.pinned
                ? '2px solid color-mix(in srgb, var(--accent) 55%, transparent)'
                : '1px solid rgba(255,255,255,0.12)',
              boxShadow: shortcut.pinned ? 'var(--accent-glow)' : '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <img
              src={iconSrc}
              alt={shortcut.name}
              className="w-14 h-14 object-contain"
              onError={(e) => {
                e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(shortcut.url)}&sz=128`
              }}
            />
            {shortcut.pinned && (
              <span
                className="absolute top-1 right-1 h-2 w-2 rounded-full"
                style={{ background: 'var(--accent)', boxShadow: 'var(--accent-glow)' }}
              />
            )}
          </div>

          <h2 className="font-display text-xl font-bold text-white mb-1">{shortcut.name}</h2>

          {/* domain badge */}
          {domainLabel && (
            <a
              href={normalizeUrl(shortcut.url)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { e.stopPropagation(); trackClick(shortcut.id) }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-150 hover:opacity-80"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {domainLabel}
            </a>
          )}
        </div>

        {/* ── Description ── */}
        {shortcut.description && (
          <div
            className="relative z-10 mb-4 rounded-[16px] px-4 py-3 text-sm leading-relaxed"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.72)',
            }}
          >
            {shortcut.description}
          </div>
        )}

        {/* ── Meta grid ── */}
        <div className="relative z-10 grid grid-cols-2 gap-2 mb-5">
          <MetaRow icon="🗂" label={t(lang, 'group')} value={shortcut.group || 'General'} />
          <MetaRow icon="🖱" label={t(lang, 'launches')} value={shortcut.clicks > 0 ? `${shortcut.clicks} ${t(lang, 'launches')}` : t(lang, 'notTracked')} />
          <MetaRow icon="📅" label={t(lang, 'addedOn')} value={addedDate} />
          <MetaRow icon="📌" label={t(lang, 'pinned')} value={shortcut.pinned ? t(lang, 'pin') : t(lang, 'unpin')} />
        </div>

        {/* ── Actions ── */}
        <div className="relative z-10 flex items-center gap-2">
          {/* Launch */}
          <button className="btn-primary flex-1 py-2.5 text-sm gap-2" onClick={launch}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {t(lang, 'openSite')}
          </button>

          {/* Pin toggle */}
          <button
            onClick={() => togglePin(shortcut.id)}
            className="btn-ghost w-10 h-10 !px-0 text-sm"
            title={shortcut.pinned ? t(lang, 'unpin') : t(lang, 'pin')}
            style={shortcut.pinned ? { borderColor: 'color-mix(in srgb, var(--accent) 50%, transparent)', color: 'var(--accent)' } : {}}
          >
            📌
          </button>

          {/* Edit */}
          <button
            onClick={() => { closeDialog(); openDialog('edit-shortcut', shortcut) }}
            className="btn-ghost w-10 h-10 !px-0 text-sm"
            title={t(lang, 'edit')}
          >
            ✏️
          </button>

          {/* Delete */}
          {settings.editMode && (
            <button
              onClick={handleDelete}
              className="btn-danger w-10 h-10 !px-0 text-sm"
              title={t(lang, 'delete')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Close */}
          <button onClick={closeDialog} className="btn-ghost w-10 h-10 !px-0 text-base" title={t(lang, 'close')}>
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
