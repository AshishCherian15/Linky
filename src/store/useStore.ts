import { create } from 'zustand'
import { persist, StateStorage } from 'zustand/middleware'
import { uid, exportCsv, importCsv } from '../utils/helpers'
import type { Analytics, AppLanguage, AppState, Background, DialogType, Profile, Settings, Shortcut, AppTheme, CategoryMeta } from '../types'

const customIndexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const dbValue = await new Promise<string | null>((resolve) => {
      const request = indexedDB.open('linky-db', 1)
      request.onupgradeneeded = () => {
        request.result.createObjectStore('store')
      }
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('store', 'readonly')
        const getReq = tx.objectStore('store').get(name)
        getReq.onsuccess = () => resolve(getReq.result || null)
        getReq.onerror = () => resolve(null)
      }
      request.onerror = () => resolve(null)
    })

    if (dbValue) return dbValue

    // Fallback: migrate from localStorage if present
    const localValue = localStorage.getItem(name)
    if (localValue) {
      await new Promise<void>((resolve) => {
        const request = indexedDB.open('linky-db', 1)
        request.onsuccess = () => {
          const db = request.result
          const tx = db.transaction('store', 'readwrite')
          tx.objectStore('store').put(localValue, name)
          tx.oncomplete = () => {
            localStorage.removeItem(name)
            resolve()
          }
        }
        request.onerror = () => resolve()
      })
      return localValue
    }
    return null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('linky-db', 1)
      request.onupgradeneeded = () => {
        request.result.createObjectStore('store')
      }
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('store', 'readwrite')
        tx.objectStore('store').put(value, name)
        tx.oncomplete = () => resolve()
      }
      request.onerror = () => resolve()
    })
  },
  removeItem: async (name: string): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('linky-db', 1)
      request.onupgradeneeded = () => {
        request.result.createObjectStore('store')
      }
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('store', 'readwrite')
        tx.objectStore('store').delete(name)
        tx.oncomplete = () => resolve()
      }
      request.onerror = () => resolve()
    })
  }
}


const DEFAULT_PROFILE_ID = 'default'

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: uid(), name: 'YouTube',   url: 'https://www.youtube.com',   group: 'Daily',  tags: ['video', 'learning'], icon: '', description: 'Watch and share videos',     pinned: false, clicks: 0, createdAt: Date.now() },
  { id: uid(), name: 'Gmail',     url: 'https://mail.google.com',   group: 'Daily',  tags: ['mail', 'work'], icon: '', description: 'Google email service',        pinned: false, clicks: 0, createdAt: Date.now() },
  { id: uid(), name: 'Claude',    url: 'https://claude.ai',         group: 'AI',     tags: ['ai', 'assistant'], icon: '', description: 'AI assistant by Anthropic',   pinned: false, clicks: 0, createdAt: Date.now() },
  { id: uid(), name: 'ChatGPT',   url: 'https://chatgpt.com',       group: 'AI',     tags: ['ai', 'chatbot'], icon: '', description: 'AI chatbot by OpenAI',        pinned: false, clicks: 0, createdAt: Date.now() },
  { id: uid(), name: 'Gemini',    url: 'https://gemini.google.com', group: 'AI',     tags: ['ai', 'google'], icon: '', description: 'AI assistant by Google',      pinned: false, clicks: 0, createdAt: Date.now() },
  { id: uid(), name: 'Instagram', url: 'https://www.instagram.com', group: 'Social', tags: ['social', 'media'], icon: '', description: 'Photo & video sharing',       pinned: false, clicks: 0, createdAt: Date.now() },
  { id: uid(), name: 'WhatsApp',  url: 'https://web.whatsapp.com',  group: 'Social', tags: ['social', 'chat'], icon: '', description: 'Messaging & calls',           pinned: false, clicks: 0, createdAt: Date.now() },
  { id: uid(), name: 'LinkedIn',  url: 'https://www.linkedin.com',  group: 'Career', tags: ['career', 'networking'], icon: '', description: 'Professional networking',     pinned: false, clicks: 0, createdAt: Date.now() },
  { id: uid(), name: 'Discord',   url: 'https://discord.com/app',   group: 'Social', tags: ['community', 'chat'], icon: '', description: 'Chat with communities',       pinned: false, clicks: 0, createdAt: Date.now() },
]

function normalizeShortcut(input: Partial<Shortcut>): Shortcut {
  return {
    id: input.id ?? uid(),
    name: input.name ?? '',
    url: input.url ?? '',
    group: input.group ?? 'General',
    tags: Array.isArray(input.tags) ? input.tags.filter(Boolean) : [],
    icon: input.icon ?? '',
    description: input.description ?? '',
    pinned: Boolean(input.pinned),
    clicks: Number(input.clicks ?? 0),
    createdAt: input.createdAt ?? Date.now(),
    expiryDate: input.expiryDate,
    status: input.status,
    browser: input.browser,
  }
}

const DEFAULT_SETTINGS: Settings = {
  userName: '',
  userAvatar: '',
  accent: '#3de0d0',
  cardStyle: 'glass',
  tileSize: 'comfortable',
  groupSort: 'az',
  searchEngine: 'google',
  customSearchUrl: '',
  openInNewTab: true,
  confirmDelete: true,
  editMode: true,
  showClock: true,
  showStats: true,
  showFooter: true,
  showTips: true,
  bgAudio: true,
  bgMuted: false,
  audioVolume: 65,
  language: 'en' as AppLanguage,
  activeProfileId: DEFAULT_PROFILE_ID,
  
  // Upgrades
  theme: 'neon' as AppTheme,
  darkMode: true,
  expiryReminders: true,
  keyboardShortcuts: true,
  browserSyncToken: Math.random().toString(36).slice(2, 10),
  browserSyncPort: 49152,
  splitViewEnabled: false,
  splitViewProfileId: undefined,
  categories: {
    Daily: { name: 'Daily', emoji: '📅' },
    AI: { name: 'AI', emoji: '🤖' },
    Social: { name: 'Social', emoji: '💬' },
    Career: { name: 'Career', emoji: '💼' },
    Entertainment: { name: 'Entertainment', emoji: '🎮' },
    Work: { name: 'Work', emoji: '💻' },
    Study: { name: 'Study', emoji: '🎓' },
    Shopping: { name: 'Shopping', emoji: '🛍️' },
    General: { name: 'General', emoji: '🔗' },
  },
}

const DEFAULT_BACKGROUND: Background = {
  type: 'video',
  src: '/space-drive.webm',
  sourceKind: 'url',
}

const DEFAULT_PROFILE: Profile = {
  id: DEFAULT_PROFILE_ID,
  name: 'Personal',
  emoji: '🏠',
  avatar: '',
  shortcuts: DEFAULT_SHORTCUTS,
  createdAt: Date.now(),
}

const DEFAULT_ANALYTICS: Analytics = {
  dailyLaunches: {},
  shortcutDaily: {},
}

function getDayKey(ts = Date.now()): string {
  return new Date(ts).toISOString().slice(0, 10)
}

function normalizeAnalytics(input: Partial<Analytics> | undefined): Analytics {
  return {
    dailyLaunches: input?.dailyLaunches ?? {},
    shortcutDaily: input?.shortcutDaily ?? {},
  }
}

interface UIState {
  dialog: DialogType
  editingShortcut: Shortcut | null
  viewingShortcut: Shortcut | null
  searchQuery: string
  isFirstRun: boolean
}

interface StoreState extends AppState, UIState {
  activeProfile: () => Profile
  addProfile: (name: string, emoji: string) => void
  deleteProfile: (id: string) => void
  switchProfile: (id: string) => void
  renameProfile: (id: string, name: string, emoji: string) => void
  updateProfile: (id: string, data: Partial<Profile>) => void

  addShortcut: (data: Omit<Shortcut, 'id' | 'clicks' | 'createdAt'>) => void
  updateShortcut: (id: string, data: Partial<Shortcut>) => void
  deleteShortcut: (id: string) => void
  reorderShortcuts: (activeId: string, overId: string) => void
  trackClick: (id: string) => void
  togglePin: (id: string) => void

  updateSettings: (patch: Partial<Settings>) => void
  resetSettings: () => void
  setBackground: (bg: Background) => void
  resetBackground: () => void
  checkBrokenLinks: () => Promise<void>
  addCategory: (name: string, emoji: string, color?: string) => void
  deleteCategory: (name: string) => void

  exportData: () => void
  exportCsvData: () => void
  exportAnalyticsData: () => void
  resetAnalyticsData: () => void
  importData: (json: string) => string | null
  importCsvData: (csv: string) => string | null

  openDialog: (d: DialogType, shortcut?: Shortcut) => void
  openView: (shortcut: Shortcut) => void
  closeDialog: () => void
  setSearch: (q: string) => void
  setFirstRunDone: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      profiles: [DEFAULT_PROFILE],
      settings: DEFAULT_SETTINGS,
      background: DEFAULT_BACKGROUND,
      analytics: DEFAULT_ANALYTICS,
      dialog: null,
      editingShortcut: null,
      viewingShortcut: null,
      searchQuery: '',
      isFirstRun: true,

      activeProfile: () => {
        const { profiles, settings } = get()
        return profiles.find((p) => p.id === settings.activeProfileId) ?? profiles[0]!
      },

      addProfile: (name, emoji) =>
        set((s) => ({ profiles: [...s.profiles, { id: uid(), name, emoji, avatar: '', shortcuts: [], createdAt: Date.now() }] })),

      deleteProfile: (id) => {
        const { profiles, settings } = get()
        if (profiles.length <= 1) return
        const next = profiles.filter((p) => p.id !== id)
        const activeId = settings.activeProfileId === id ? next[0]!.id : settings.activeProfileId
        set({ profiles: next, settings: { ...settings, activeProfileId: activeId } })
      },

      switchProfile: (id) => set((s) => ({ settings: { ...s.settings, activeProfileId: id } })),

      renameProfile: (id, name, emoji) =>
        set((s) => ({ profiles: s.profiles.map((p) => p.id === id ? { ...p, name, emoji } : p) })),

      updateProfile: (id, data) =>
        set((s) => ({ profiles: s.profiles.map((p) => p.id === id ? { ...p, ...data } : p) })),

      addShortcut: (data) => {
        const { profiles, settings } = get()
        const shortcut: Shortcut = {
          ...data,
          tags: data.tags ?? [],
          id: uid(),
          clicks: 0,
          createdAt: Date.now(),
        }
        set({ profiles: profiles.map((p) => p.id === settings.activeProfileId ? { ...p, shortcuts: [...p.shortcuts, shortcut] } : p) })
      },

      updateShortcut: (id, data) => {
        const { profiles, settings } = get()
        set({ profiles: profiles.map((p) => p.id === settings.activeProfileId ? { ...p, shortcuts: p.shortcuts.map((s) => s.id === id ? { ...s, ...data } : s) } : p) })
      },

      deleteShortcut: (id) => {
        const { profiles, settings } = get()
        set({ profiles: profiles.map((p) => p.id === settings.activeProfileId ? { ...p, shortcuts: p.shortcuts.filter((s) => s.id !== id) } : p) })
      },

      reorderShortcuts: (activeId, overId) => {
        const { profiles, settings } = get()
        const profile = profiles.find((p) => p.id === settings.activeProfileId)
        if (!profile) return
        const items = [...profile.shortcuts]
        const from = items.findIndex((s) => s.id === activeId)
        const to   = items.findIndex((s) => s.id === overId)
        if (from === -1 || to === -1) return
        const [moved] = items.splice(from, 1)
        items.splice(to, 0, moved!)
        set({ profiles: profiles.map((p) => p.id === settings.activeProfileId ? { ...p, shortcuts: items } : p) })
      },

      trackClick: (id) => {
        const { profiles, settings, analytics } = get()
        const day = getDayKey()
        set({
          profiles: profiles.map((p) => p.id === settings.activeProfileId ? { ...p, shortcuts: p.shortcuts.map((s) => s.id === id ? { ...s, clicks: s.clicks + 1 } : s) } : p),
          analytics: {
            dailyLaunches: {
              ...analytics.dailyLaunches,
              [day]: (analytics.dailyLaunches[day] ?? 0) + 1,
            },
            shortcutDaily: {
              ...analytics.shortcutDaily,
              [day]: {
                ...(analytics.shortcutDaily[day] ?? {}),
                [id]: ((analytics.shortcutDaily[day] ?? {})[id] ?? 0) + 1,
              },
            },
          },
        })
      },

      togglePin: (id) => {
        const { profiles, settings } = get()
        set({ profiles: profiles.map((p) => p.id === settings.activeProfileId ? { ...p, shortcuts: p.shortcuts.map((s) => s.id === id ? { ...s, pinned: !s.pinned } : s) } : p) })
      },

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS, background: DEFAULT_BACKGROUND }),

      setBackground: (bg) => set({ background: bg }),

      resetBackground: () => set({ background: DEFAULT_BACKGROUND }),

      checkBrokenLinks: async () => {
        const { profiles, settings } = get()
        const activeProfile = profiles.find((p) => p.id === settings.activeProfileId)
        if (!activeProfile) return

        set({
          profiles: profiles.map((p) =>
            p.id === settings.activeProfileId
              ? { ...p, shortcuts: p.shortcuts.map((s) => ({ ...s, status: 'checking' as const })) }
              : p
          ),
        })

        for (const s of activeProfile.shortcuts) {
          let isOk = false
          try {
            if ((window as any).linkyDesktop?.checkLink) {
              isOk = await (window as any).linkyDesktop.checkLink(s.url)
            } else {
              const res = await fetch(s.url, { method: 'HEAD', mode: 'no-cors' })
              isOk = true
            }
          } catch {
            isOk = false
          }
          
          set((state) => ({
            profiles: state.profiles.map((p) =>
              p.id === settings.activeProfileId
                ? {
                    ...p,
                    shortcuts: p.shortcuts.map((shortcut) =>
                      shortcut.id === s.id
                        ? { ...shortcut, status: (isOk ? 'ok' : 'broken') as 'ok' | 'broken' }
                        : shortcut
                    ),
                  }
                : p
            ),
          }))
        }
      },

      addCategory: (name, emoji, color) => {
        const { settings } = get()
        set({
          settings: {
            ...settings,
            categories: {
              ...settings.categories,
              [name]: { name, emoji, color },
            },
          },
        })
      },

      deleteCategory: (name) => {
        const { settings } = get()
        const newCats = { ...settings.categories }
        delete newCats[name]
        set({
          settings: {
            ...settings,
            categories: newCats,
          },
        })
      },

      openDialog: (d, shortcut) => set({ dialog: d, editingShortcut: shortcut ?? null }),

      openView: (shortcut) => set({ dialog: 'view-shortcut', viewingShortcut: shortcut }),

      closeDialog: () => set({ dialog: null, editingShortcut: null, viewingShortcut: null }),

      setSearch: (q) => set({ searchQuery: q }),

      setFirstRunDone: () => set({ isFirstRun: false }),

      exportData: () => {
        const { profiles, settings, background, analytics } = get()
        const data = JSON.stringify({ profiles, settings, background, analytics }, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href = url
        a.download = `linky-backup-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      },

      exportCsvData: () => {
        const { profiles, settings } = get()
        const profile = profiles.find((p) => p.id === settings.activeProfileId) ?? profiles[0]!
        exportCsv(profile.shortcuts)
      },

      exportAnalyticsData: () => {
        const { analytics } = get()
        const data = JSON.stringify(analytics, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `linky-analytics-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      },

      resetAnalyticsData: () => set({ analytics: DEFAULT_ANALYTICS }),

      importData: (json) => {
        try {
          const parsed = JSON.parse(json)
          if (!Array.isArray(parsed.profiles) || parsed.profiles.length === 0) {
            return 'Invalid file: profiles must contain at least one profile.'
          }

          const safeProfiles: Profile[] = parsed.profiles.map((p: Profile) => ({
            ...p,
            shortcuts: Array.isArray(p.shortcuts)
              ? p.shortcuts.map((s) => normalizeShortcut(s))
              : [],
          }))

          const mergedSettings = { ...DEFAULT_SETTINGS, ...parsed.settings }
          const activeExists = safeProfiles.some((p: Profile) => p.id === mergedSettings.activeProfileId)

          set({
            profiles: safeProfiles,
            settings: {
              ...mergedSettings,
              activeProfileId: activeExists ? mergedSettings.activeProfileId : safeProfiles[0]!.id,
            },
            background: parsed.background ?? DEFAULT_BACKGROUND,
            analytics: normalizeAnalytics(parsed.analytics),
          })
          return null
        } catch { return 'Failed to parse JSON file.' }
      },

      importCsvData: (csv) => {
        try {
          const shortcuts = importCsv(csv)
          if (!shortcuts.length) return 'No valid rows found in CSV.'
          const { profiles, settings } = get()
          set({
            profiles: profiles.map((p) =>
              p.id === settings.activeProfileId
                ? { ...p, shortcuts: [...p.shortcuts, ...shortcuts] }
                : p
            ),
          })
          return null
        } catch { return 'Failed to parse CSV file.' }
      },
    }),
    {
      name: 'linky_v2',
      storage: customIndexedDBStorage,
      partialize: (s) => ({
        profiles:   s.profiles,
        settings:   s.settings,
        background: s.background.sourceKind === 'upload'
          ? { type: 'video', src: DEFAULT_BACKGROUND.src, sourceKind: 'url' }
          : s.background,
        analytics: s.analytics,
        isFirstRun: s.isFirstRun,
      }),
    },
  ),
)
