import { useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'
import { getFavicon, inferShortcutMeta, isValidUrl, normalizeUrl, safeText } from '../../utils/helpers'
import { t } from '../../utils/i18n'

const QUICK_PICKS = [
  { name: 'YouTube',  url: 'https://youtube.com',         desc: 'Watch and share videos' },
  { name: 'GitHub',   url: 'https://github.com',          desc: 'Code hosting & collaboration' },
  { name: 'ChatGPT',  url: 'https://chatgpt.com',         desc: 'AI chatbot by OpenAI' },
  { name: 'Gmail',    url: 'https://mail.google.com',     desc: 'Google email service' },
  { name: 'Spotify',  url: 'https://open.spotify.com',   desc: 'Music streaming' },
  { name: 'Twitter',  url: 'https://x.com',              desc: 'Short-form social media' },
  { name: 'LinkedIn', url: 'https://linkedin.com',        desc: 'Professional networking' },
  { name: 'Notion',   url: 'https://notion.so',           desc: 'All-in-one workspace' },
]

export default function ShortcutDialog() {
  const dialog          = useStore((s) => s.dialog)
  const editingShortcut = useStore((s) => s.editingShortcut)
  const closeDialog     = useStore((s) => s.closeDialog)
  const addShortcut     = useStore((s) => s.addShortcut)
  const updateShortcut  = useStore((s) => s.updateShortcut)
  const activeProfile   = useStore((s) => s.activeProfile)
  const language        = useStore((s) => s.settings.language)

  const isEdit = dialog === 'edit-shortcut'
  const isOpen = dialog === 'add-shortcut' || isEdit

  const existingGroups = [...new Set(activeProfile().shortcuts.map((s) => s.group).filter(Boolean))]

  const [name, setName]             = useState('')
  const [url, setUrl]               = useState('')
  const [group, setGroup]           = useState('')
  const [tagsText, setTagsText]     = useState('')
  const [icon, setIcon]             = useState('')
  const [description, setDesc]      = useState('')
  const [error, setError]           = useState('')
  const [preview, setPreview]       = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (isEdit && editingShortcut) {
      setName(editingShortcut.name)
      setUrl(editingShortcut.url)
      setGroup(editingShortcut.group)
      setTagsText((editingShortcut.tags ?? []).join(', '))
      setIcon(editingShortcut.icon)
      setDesc(editingShortcut.description ?? '')
      setPreview(editingShortcut.icon || getFavicon(editingShortcut.url))
    } else {
      setName(''); setUrl(''); setGroup(''); setTagsText(''); setIcon(''); setDesc(''); setPreview('')
    }
    setError('')
  }, [isOpen, isEdit, editingShortcut])

  useEffect(() => {
    const u = normalizeUrl(url)
    if (isValidUrl(u)) setPreview(icon ? normalizeUrl(icon) : getFavicon(u))
    else setPreview('')
  }, [url, icon])

  useEffect(() => {
    const u = normalizeUrl(url)
    if (!isValidUrl(u)) return
    const suggestion = inferShortcutMeta(u, name)

    if (!group.trim()) setGroup(suggestion.group)
    if (!description.trim()) setDesc(suggestion.description)
    if (!tagsText.trim()) setTagsText(suggestion.tags.join(', '))
  }, [url])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n  = safeText(name.trim())
    const u  = normalizeUrl(url)
    const g  = safeText(group.trim()) || 'General'
    const tags = tagsText
      .split(',')
      .map((tag) => safeText(tag.trim()))
      .filter(Boolean)
    const ic = icon.trim() ? normalizeUrl(icon.trim()) : ''
    const d  = safeText(description.trim())
    if (!n) return setError(`${t(language, 'name')} is required.`)
    if (!isValidUrl(u)) return setError(`Enter a valid ${t(language, 'url')}.`)
    if (ic && !isValidUrl(ic)) return setError(`${t(language, 'customIconUrl')} is not valid.`)
    if (isEdit && editingShortcut) {
      updateShortcut(editingShortcut.id, { name: n, url: u, group: g, tags, icon: ic, description: d })
    } else {
      addShortcut({ name: n, url: u, group: g, tags, icon: ic, description: d, pinned: false })
    }
    closeDialog()
  }

  function applyQuick(q: typeof QUICK_PICKS[0]) {
    setName(q.name); setUrl(q.url); setDesc(q.desc); setGroup('')
  }

  if (!isOpen) return null

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && closeDialog()}>
      <div className="dialog-panel">

        {/* Live preview header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {preview
              ? <img src={preview} alt="" className="w-10 h-10 rounded-xl object-contain" />
              : <span className="text-2xl">🔗</span>}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-bold text-white leading-tight truncate">
              {name || (isEdit ? t(language, 'editShortcut') : t(language, 'newShortcut'))}
            </h2>
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {url || 'https://example.com'}
            </p>
            {description && (
              <p className="text-[11px] truncate mt-0.5 italic" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Quick picks — add only */}
        {!isEdit && (
          <div className="mb-4">
            <p className="field-label mb-2">{t(language, 'quickAdd')}</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PICKS.map((q) => {
                const active = name === q.name
                return (
                  <button
                    key={q.url}
                    type="button"
                    onClick={() => applyQuick(q)}
                    className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-150"
                    style={{
                      background: active ? 'color-mix(in srgb, var(--accent) 18%, rgba(255,255,255,0.07))' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${active ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : 'rgba(255,255,255,0.1)'}`,
                      color: active ? 'var(--accent)' : 'rgba(255,255,255,0.65)',
                    }}
                  >
                    <img src={getFavicon(q.url)} alt="" className="w-3.5 h-3.5 rounded" />
                    {q.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Name + Group */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="field-label">{t(language, 'name')} *</label>
              <input className="input-base" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="YouTube" maxLength={40} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="field-label">{t(language, 'group')}</label>
              <input className="input-base" value={group} onChange={(e) => setGroup(e.target.value)}
                placeholder="Work, AI…" list="grp-list" maxLength={30} />
              <datalist id="grp-list">
                {existingGroups.map((g) => <option key={g} value={g} />)}
              </datalist>
            </div>
          </div>

          {/* URL */}
          <div className="flex flex-col gap-1.5">
            <label className="field-label">{t(language, 'url')} *</label>
            <input className="input-base" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com" required />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="field-label">
              Tags
              <span className="ml-1 normal-case font-normal opacity-55">(comma separated)</span>
            </label>
            <input
              className="input-base"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="ai, study, productivity"
              maxLength={120}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="field-label">
              {t(language, 'description')}
              <span className="ml-1 normal-case font-normal opacity-55">({t(language, 'shownInView')})</span>
            </label>
            <input className="input-base" value={description} onChange={(e) => setDesc(e.target.value)}
              placeholder="What is this site for?" maxLength={120} />
          </div>

          {/* Custom icon */}
          <div className="flex flex-col gap-1.5">
            <label className="field-label">
              {t(language, 'customIconUrl')}
              <span className="ml-1 normal-case font-normal opacity-55">({t(language, 'optional')})</span>
            </label>
            <input className="input-base" value={icon} onChange={(e) => setIcon(e.target.value)}
              placeholder="https://…/icon.png" />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-300"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              ⚠ {error}
            </div>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={closeDialog}>{t(language, 'cancel')}</button>
            <button type="submit" className="btn-primary">
              {isEdit ? t(language, 'saveChanges') : t(language, 'addShortcutBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
