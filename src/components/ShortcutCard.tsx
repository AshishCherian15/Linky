import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from '../store/useStore'
import { getFavicon, isValidUrl, normalizeUrl } from '../utils/helpers'
import type { Shortcut } from '../types'

interface Props { shortcut: Shortcut }

function getDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return '' }
}

export default function ShortcutCard({ shortcut }: Props) {
  const settings       = useStore((s) => s.settings)
  const deleteShortcut = useStore((s) => s.deleteShortcut)
  const trackClick     = useStore((s) => s.trackClick)
  const togglePin      = useStore((s) => s.togglePin)
  const openDialog     = useStore((s) => s.openDialog)
  const openView       = useStore((s) => s.openView)
  const [imgLoaded, setImgLoaded] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: shortcut.id, disabled: !settings.editMode })

  const dStyle = { transform: CSS.Transform.toString(transform), transition }

  const iconSrc = shortcut.icon && isValidUrl(normalizeUrl(shortcut.icon))
    ? normalizeUrl(shortcut.icon)
    : getFavicon(shortcut.url)

  const iconSz = { compact: 'w-8 h-8', comfortable: 'w-10 h-10', large: 'w-12 h-12' }[settings.tileSize] ?? 'w-10 h-10'
  const pad    = { compact: 'px-2 pt-3.5 pb-2.5', comfortable: 'px-3 pt-4 pb-3', large: 'px-3 pt-5 pb-4' }[settings.tileSize] ?? 'px-3 pt-4 pb-3'

  function go() {
    const url = normalizeUrl(shortcut.url)
    if (!isValidUrl(url)) return
    trackClick(shortcut.id)
    if (settings.openInNewTab) window.open(url, '_blank', 'noopener,noreferrer')
    else window.location.href = url
  }

  function stop(fn: () => void) {
    return (e: React.MouseEvent) => { e.stopPropagation(); fn() }
  }

  return (
    <article
      ref={setNodeRef}
      style={{
        ...dStyle,
        borderColor: shortcut.pinned
          ? 'color-mix(in srgb, var(--accent) 42%, rgba(255,255,255,0.12))'
          : undefined,
      }}
      {...attributes}
      {...(settings.editMode ? listeners : {})}
      className={`shortcut-card group rounded-[var(--radius-card)] ${pad}
        text-center cursor-pointer select-none overflow-hidden
        ${isDragging ? 'is-dragging' : ''}`}
      onClick={go}
      title={shortcut.description || shortcut.url}
    >
      {/* ambient icon ring */}
      <div className="icon-ring" />

      {/* pin glow dot */}
      {shortcut.pinned && <div className="pin-dot" />}

      {/* icon */}
      <div className="relative flex justify-center mb-2 z-10">
        {!imgLoaded && <div className={`${iconSz} rounded-xl icon-skeleton`} />}
        <img
          src={iconSrc}
          alt={shortcut.name}
          className={`${iconSz} rounded-xl object-contain transition-transform duration-200 group-hover:scale-[1.12] ${imgLoaded ? 'block' : 'hidden'}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(shortcut.url)}&sz=64`
            setImgLoaded(true)
          }}
        />
      </div>

      {/* name */}
      <span className="relative z-10 block truncate text-[12px] font-semibold leading-tight"
        style={{ color: 'rgba(255,255,255,0.88)' }}>
        {shortcut.name}
      </span>

      {/* domain */}
      {settings.tileSize !== 'compact' && (
        <span className="relative z-10 mt-0.5 block truncate text-[10px]"
          style={{ color: 'rgba(255,255,255,0.28)' }}>
          {getDomain(shortcut.url)}
        </span>
      )}

      {/* description preview — large tile only */}
      {settings.tileSize === 'large' && shortcut.description && (
        <span className="relative z-10 mt-1 block truncate text-[10px] italic"
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          {shortcut.description}
        </span>
      )}

      {settings.tileSize === 'large' && (shortcut.tags ?? []).length > 0 && (
        <span className="relative z-10 mt-1 block truncate text-[10px]"
          style={{ color: 'rgba(255,255,255,0.42)' }}>
          #{shortcut.tags[0]}
        </span>
      )}

      {/* launch count — large tile */}
      {settings.tileSize === 'large' && shortcut.clicks > 0 && (
        <span className="relative z-10 mt-1 block text-[10px] font-semibold"
          style={{ color: 'var(--accent)' }}>
          {shortcut.clicks} launches
        </span>
      )}

      {/* Action bar — slides up on hover */}
      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
        {/* View */}
        <ActionBtn onClick={stop(() => openView(shortcut))} title="View details">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </ActionBtn>

        {/* Pin */}
        {settings.editMode && (
          <ActionBtn onClick={stop(() => togglePin(shortcut.id))} title={shortcut.pinned ? 'Unpin' : 'Pin'}
            accent={shortcut.pinned}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill={shortcut.pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </ActionBtn>
        )}

        {/* Edit */}
        {settings.editMode && (
          <ActionBtn onClick={stop(() => openDialog('edit-shortcut', shortcut))} title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </ActionBtn>
        )}

        {/* Delete */}
        {settings.editMode && (
          <ActionBtn
            onClick={stop(() => {
              if (settings.confirmDelete && !confirm(`Delete "${shortcut.name}"?`)) return
              deleteShortcut(shortcut.id)
            })}
            title="Delete"
            danger
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </ActionBtn>
        )}
      </div>
    </article>
  )
}

function ActionBtn({
  onClick, title, children, danger, accent,
}: {
  onClick: (e: React.MouseEvent) => void
  title: string
  children: React.ReactNode
  danger?: boolean
  accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors"
      style={{
        background: danger
          ? 'rgba(239,68,68,0.8)'
          : accent
            ? 'color-mix(in srgb, var(--accent) 25%, rgba(255,255,255,0.1))'
            : 'rgba(255,255,255,0.1)',
        border: `1px solid ${danger
          ? 'rgba(239,68,68,0.4)'
          : accent
            ? 'color-mix(in srgb, var(--accent) 45%, transparent)'
            : 'rgba(255,255,255,0.14)'}`,
        color: accent ? 'var(--accent)' : 'rgba(255,255,255,0.85)',
      }}
    >
      {children}
    </button>
  )
}
