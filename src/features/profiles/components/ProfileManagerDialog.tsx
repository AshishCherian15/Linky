import { useRef, useState } from 'react'
import { useStore } from '../../../store/useStore'
import { fileToBase64, getInitials } from '../../../lib/helpers'
import { t } from '../../../lib/i18n'

const EMOJIS = ['🏠','💼','🎓','🎮','🎨','🚀','❤️','🌍','🔬','💡','🎵','🏋️','🌙','☀️','🎯']

function Avatar({ name, emoji, avatar, size = 40 }: { name: string; emoji: string; avatar: string; size?: number }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
      />
    )
  }
  if (emoji) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.45,
        background: 'linear-gradient(135deg, var(--accent), #6c8fff)',
      }}>
        {emoji}
      </div>
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      background: 'linear-gradient(135deg, var(--accent), #6c8fff)',
    }}>
      {getInitials(name) || '?'}
    </div>
  )
}

export default function ProfileManagerDialog() {
  const dialog        = useStore((s) => s.dialog)
  const profiles      = useStore((s) => s.profiles)
  const settings      = useStore((s) => s.settings)
  const closeDialog   = useStore((s) => s.closeDialog)
  const addProfile    = useStore((s) => s.addProfile)
  const deleteProfile = useStore((s) => s.deleteProfile)
  const switchProfile = useStore((s) => s.switchProfile)
  const renameProfile = useStore((s) => s.renameProfile)
  const updateProfile = useStore((s) => s.updateProfile)
  const language      = useStore((s) => s.settings.language)

  const [newName, setNewName]     = useState('')
  const [newEmoji, setNewEmoji]   = useState('🏠')
  const [editId, setEditId]       = useState<string | null>(null)
  const [editName, setEditName]   = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  if (dialog !== 'profile-manager') return null

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const n = newName.trim(); if (!n) return
    addProfile(n, newEmoji); setNewName(''); setNewEmoji('🏠')
  }

  function saveEdit(id: string) {
    const n = editName.trim(); if (!n) return
    renameProfile(id, n, editEmoji); setEditId(null)
  }

  async function handleAvatarUpload(id: string, file: File) {
    const base64 = await fileToBase64(file)
    updateProfile(id, { avatar: base64 })
  }

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && closeDialog()}>
      <div className="dialog-panel" style={{ maxWidth: 460 }}>
        <h2 className="font-display text-base font-bold text-white mb-1">{t(language, 'profilesTitle')}</h2>
        <p className="text-[11px] mb-5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          {t(language, 'profilesDesc')}
        </p>

        {/* Profile list */}
        <div className="flex flex-col gap-2 mb-5">
          {profiles.map((p) => {
            const isActive = p.id === settings.activeProfileId
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-[18px] p-3 transition-all duration-200"
                style={{
                  background: isActive
                    ? 'color-mix(in srgb, var(--accent) 10%, rgba(255,255,255,0.05))'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive
                    ? 'color-mix(in srgb, var(--accent) 35%, transparent)'
                    : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isActive ? 'var(--accent-glow)' : 'none',
                }}
              >
                {editId === p.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <select
                      className="rounded-lg border border-white/20 bg-black/40 px-1 py-1 text-base"
                      value={editEmoji} onChange={(e) => setEditEmoji(e.target.value)}
                    >
                      {EMOJIS.map((em) => <option key={em} value={em}>{em}</option>)}
                    </select>
                    <input
                      className="input-base flex-1 py-1.5 text-sm"
                      value={editName} onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(p.id)}
                      autoFocus
                    />
                    <button className="btn-primary text-xs px-2.5 py-1.5" onClick={() => saveEdit(p.id)}>{t(language, 'save')}</button>
                    <button className="btn-ghost text-xs px-2 py-1" onClick={() => setEditId(null)}>✕</button>
                  </div>
                ) : (
                  <>
                    {/* Clickable avatar — upload photo */}
                    <div className="relative shrink-0 cursor-pointer group/av"
                      onClick={() => fileInputRefs.current[p.id]?.click()}
                      title={t(language, 'uploadPhoto')}
                    >
                      <div
                        className="overflow-hidden transition-all duration-150"
                        style={{
                          borderRadius: '50%',
                          boxShadow: isActive
                            ? '0 0 0 2px var(--accent), 0 0 12px color-mix(in srgb, var(--accent) 40%, transparent)'
                            : '0 0 0 2px rgba(255,255,255,0.12)',
                        }}
                      >
                        <Avatar name={p.name} emoji={p.emoji} avatar={p.avatar} size={44} />
                      </div>
                      {/* camera overlay */}
                      <div
                        className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover/av:opacity-100 transition-opacity duration-150"
                        style={{ background: 'rgba(0,0,0,0.55)' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <input
                        ref={(el) => { fileInputRefs.current[p.id] = el }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) handleAvatarUpload(p.id, f)
                        }}
                      />
                    </div>

                    <button
                      className="flex-1 text-left min-w-0"
                      onClick={() => { switchProfile(p.id); closeDialog() }}
                    >
                      <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                        {p.shortcuts.length} {t(language, 'shortcuts_count')}
                        {isActive && (
                          <span className="ml-2 font-bold" style={{ color: 'var(--accent)' }}>● {t(language, 'active')}</span>
                        )}
                      </p>
                    </button>

                    <div className="flex gap-1.5 shrink-0">
                      {/* Remove photo */}
                      {p.avatar && (
                        <button
                          className="btn-ghost w-7 h-7 !px-0 text-xs"
                          onClick={() => updateProfile(p.id, { avatar: '' })}
                          title={t(language, 'removePhoto')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {/* Rename */}
                      <button
                        className="btn-icon w-7 h-7"
                        onClick={() => { setEditId(p.id); setEditName(p.name); setEditEmoji(p.emoji) }}
                        title={t(language, 'rename')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Delete */}
                      {profiles.length > 1 && (
                        <button
                          className="btn-danger w-7 h-7 !px-0"
                          onClick={() => { if (confirm(`${t(language, 'delete')} "${p.name}"?`)) deleteProfile(p.id) }}
                          title={t(language, 'delete')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* New profile form */}
        <div className="rounded-[16px] p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="field-label mb-3">{t(language, 'newProfile')}</p>
          <form onSubmit={handleAdd} className="flex gap-2">
            <select
              className="rounded-xl border border-white/20 bg-black/40 px-2 py-2 text-base"
              value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)}
            >
              {EMOJIS.map((em) => <option key={em} value={em}>{em}</option>)}
            </select>
            <input
              className="input-base flex-1"
              value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder={t(language, 'profileName')} maxLength={24}
            />
            <button type="submit" className="btn-primary text-sm px-4">{t(language, 'save')}</button>
          </form>
        </div>

        <div className="mt-4 flex justify-end">
          <button className="btn-ghost text-sm" onClick={closeDialog}>{t(language, 'close')}</button>
        </div>
      </div>
    </div>
  )
}
