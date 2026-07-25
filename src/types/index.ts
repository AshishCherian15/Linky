export interface Shortcut {
  id: string
  name: string
  url: string
  group: string
  tags: string[]
  icon: string
  description: string
  pinned: boolean
  clicks: number
  createdAt: number
}

export interface Profile {
  id: string
  name: string
  emoji: string
  avatar: string
  shortcuts: Shortcut[]
  createdAt: number
}

export type BackgroundType = 'video' | 'image' | 'youtube' | 'none'
export type CardStyle   = 'glass' | 'solid'
export type TileSize    = 'compact' | 'comfortable' | 'large'
export type GroupSort   = 'az' | 'manual' | 'most-used'
export type SearchEngine = 'google' | 'bing' | 'duckduckgo' | 'brave' | 'custom'
export type AppLanguage  = 'en' | 'hi' | 'es' | 'fr' | 'ar'

export interface Background {
  type: BackgroundType
  src: string
  sourceKind: 'url' | 'upload'
  bgColor?: string       // used when type === 'none'
  bgGradient?: string    // CSS gradient string when type === 'none'
}

export interface Settings {
  userName: string
  userAvatar: string
  accent: string
  cardStyle: CardStyle
  tileSize: TileSize
  groupSort: GroupSort
  searchEngine: SearchEngine
  customSearchUrl: string
  openInNewTab: boolean
  confirmDelete: boolean
  editMode: boolean
  showClock: boolean
  showStats: boolean
  showFooter: boolean
  showTips: boolean
  bgAudio: boolean
  bgMuted: boolean
  audioVolume: number
  language: AppLanguage
  activeProfileId: string
}

export interface AppState {
  profiles: Profile[]
  settings: Settings
  background: Background
  analytics: Analytics
}

export interface Analytics {
  dailyLaunches: Record<string, number>
  shortcutDaily: Record<string, Record<string, number>>
}

export type DialogType =
  | 'add-shortcut'
  | 'edit-shortcut'
  | 'view-shortcut'
  | 'background'
  | 'settings'
  | 'welcome'
  | 'profile-manager'
  | null
