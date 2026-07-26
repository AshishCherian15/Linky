import { useStore } from '../../../store/useStore'
import { getInitials } from '../../../lib/helpers'
import { t } from '../../../lib/i18n'

/* ── Avatar component — renders photo, emoji, or initials ── */
function Avatar({
  src, name, emoji, size,
}: {
  src: string; name: string; emoji: string; size: number
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block',
          flexShrink: 0,
        }}
      />
    )
  }
  if (emoji) {
    return (
      <span
        style={{
          fontSize: size * 0.55,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size, height: size,
        }}
      >
        {emoji}
      </span>
    )
  }
  return (
    <span
      style={{
        fontSize: size * 0.38,
        fontWeight: 800,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size, height: size,
      }}
    >
      {getInitials(name) || '?'}
    </span>
  )
}

/* ── Icon action button with tooltip ── */
function ActionBtn({
  onClick, tip, children, glow,
}: {
  onClick: () => void
  tip: string
  children: React.ReactNode
  glow?: boolean
}) {
  return (
    <div className="tooltip-wrap">
      <button
        onClick={onClick}
        aria-label={tip}
        className="appbar-btn"
        style={glow ? {
          background: 'linear-gradient(135deg, var(--accent), #6c8fff)',
          border: 'none',
          boxShadow: '0 4px 16px color-mix(in srgb, var(--accent) 40%, transparent)',
        } : {}}
      >
        {children}
      </button>
      <span className="tooltip">{tip}</span>
    </div>
  )
}

export default function AppBar() {
  const openDialog     = useStore((s) => s.openDialog)
  const profiles       = useStore((s) => s.profiles)
  const settings       = useStore((s) => s.settings)
  const switchProfile  = useStore((s) => s.switchProfile)
  const updateSettings = useStore((s) => s.updateSettings)
  const editMode       = settings.editMode
  const lang           = settings.language ?? 'en'
  const activeProfile  = profiles.find((p) => p.id === settings.activeProfileId) ?? profiles[0]!

  return (
    <header className="appbar">
      {/* Animated edit-mode underline */}
      {editMode && <div className="edit-bar" />}

      {/* ══ LEFT — Brand + profile switcher ══ */}
      <div className="flex items-center gap-3 min-w-0">

        {/* Logo + wordmark */}
        <button
          className="appbar-brand group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          <div className="appbar-logo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 6L10 12H14L10.5 18" stroke="white" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" opacity="0.4"/>
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="appbar-wordmark">Linky</span>
            <span className="appbar-sub">{t(lang, 'shortcutHub')}</span>
          </div>
        </button>

        {/* Divider */}
        <div className="appbar-divider" />

        {/* Profile tabs — only shown when multiple profiles exist */}
        {profiles.length > 1 ? (
          <div className="hidden sm:flex items-center gap-1 flex-wrap">
            {profiles.map((p) => {
              const isActive = p.id === settings.activeProfileId
              return (
                <button
                  key={p.id}
                  onClick={() => switchProfile(p.id)}
                  className="appbar-profile-pill"
                  style={isActive ? {
                    background: 'linear-gradient(120deg, var(--accent), #6c8fff)',
                    boxShadow: '0 2px 14px color-mix(in srgb, var(--accent) 35%, transparent)',
                    color: '#fff',
                    border: 'none',
                  } : {}}
                >
                  {/* mini avatar */}
                  <div className="appbar-pill-avatar">
                    <Avatar src={p.avatar} name={p.name} emoji={p.emoji} size={16} />
                  </div>
                  <span className="truncate max-w-[80px]">{p.name}</span>
                </button>
              )
            })}
          </div>
        ) : (
          /* Single profile — show name + greeting */
          settings.userName && (
            <span className="hidden sm:block text-[11px] font-medium"
              style={{ color: 'rgba(255,255,255,0.45)' }}>
              Hey, <span style={{ color: 'rgba(255,255,255,0.75)' }}>{settings.userName}</span>
            </span>
          )
        )}
      </div>

      {/* ══ RIGHT — Actions ══ */}
      <div className="flex items-center gap-2">

        {/* Action cluster 1: content controls */}
        <div className="appbar-cluster">
          {/* Add shortcut */}
          <ActionBtn onClick={() => openDialog('add-shortcut')} tip={`${t(lang, 'addShortcut')} [n]`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-[15px] h-[15px]"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
          </ActionBtn>

          {/* Background */}
          <ActionBtn onClick={() => openDialog('background')} tip={t(lang, 'background')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-[15px] h-[15px]"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </ActionBtn>

          {/* Edit mode toggle */}
          <div className="tooltip-wrap">
            <button
              onClick={() => updateSettings({ editMode: !editMode })}
              className="appbar-btn"
              style={editMode ? {
                background: 'color-mix(in srgb, var(--accent) 18%, rgba(255,255,255,0.08))',
                borderColor: 'color-mix(in srgb, var(--accent) 50%, transparent)',
                color: 'var(--accent)',
                boxShadow: '0 0 10px color-mix(in srgb, var(--accent) 20%, transparent)',
              } : {}}
              aria-label={editMode ? t(lang, 'lockLayout') : t(lang, 'unlockToEdit')}
            >
              {editMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-[15px] h-[15px]"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-[15px] h-[15px]"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM10 9V7a2 2 0 114 0v2"/>
                </svg>
              )}
            </button>
            <span className="tooltip">{editMode ? t(lang, 'lockLayout') : t(lang, 'unlockToEdit')}</span>
          </div>
        </div>

        {/* Cluster divider */}
        <div className="appbar-divider" />

        {/* Action cluster 2: settings + avatar */}
        <div className="appbar-cluster">
          {/* Settings */}
          <ActionBtn onClick={() => openDialog('settings')} tip={t(lang, 'settings')} glow>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-[15px] h-[15px]"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </ActionBtn>

          {/* Avatar bubble — opens profile manager */}
          <div className="tooltip-wrap">
            <button
              onClick={() => openDialog('profile-manager')}
              className="appbar-avatar-btn"
              aria-label="Profile"
            >
              {/* Outer glow ring */}
              <div className="appbar-avatar-ring">
                <Avatar
                  src={settings.userAvatar || activeProfile.avatar}
                  name={settings.userName || activeProfile.name}
                  emoji={activeProfile.emoji}
                  size={30}
                />
              </div>
              {/* Online dot */}
              <span className="appbar-avatar-dot" />
            </button>
            <span className="tooltip">
              {settings.userName || activeProfile.name} — {t(lang, 'profiles')}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
