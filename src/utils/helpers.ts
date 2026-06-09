import type { Background, BackgroundType } from '../types'
import Papa from 'papaparse'

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function isValidUrl(value: string): boolean {
  const raw = value.trim()
  if (!raw) return false
  if (/^(data:|blob:)/i.test(raw) || raw.startsWith('/') || raw.startsWith('./')) return true
  try {
    const p = new URL(raw)
    return p.protocol === 'https:' || p.protocol === 'http:'
  } catch {
    return false
  }
}

export function getFavicon(url: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=64`
}

export function detectBgType(src: string): BackgroundType {
  const v = src.toLowerCase()
  if (v.includes('youtube.com') || v.includes('youtu.be')) return 'youtube'
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(v)) return 'video'
  if (/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(v)) return 'image'
  return 'image'
}

export function normalizeBackgroundSrc(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const blobMatch = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i,
  )
  if (blobMatch) {
    const [, owner, repo, branch, path] = blobMatch
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
  }
  if (/^(https?:|data:|blob:)/i.test(trimmed) || trimmed.startsWith('/')) return trimmed
  if (/\.(mp4|webm|ogg|png|jpe?g|gif|webp|svg)(\?|$)/i.test(trimmed))
    return `/${trimmed.replace(/^\/+/, '')}`
  return normalizeUrl(trimmed)
}

export function getYoutubeId(url: string): string {
  const pattern = /^[a-zA-Z0-9_-]{11}$/
  if (pattern.test(url)) return url
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./i, '').replace(/^m\./i, '')
    if (host === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0] ?? ''
    const v = u.searchParams.get('v') ?? ''
    if (pattern.test(v)) return v
    const parts = u.pathname.split('/').filter(Boolean)
    const idx = parts.findIndex((p) => ['embed', 'shorts', 'live', 'v'].includes(p))
    if (idx >= 0 && pattern.test(parts[idx + 1] ?? '')) return parts[idx + 1]!
  } catch {
    const m = url.match(/([a-zA-Z0-9_-]{11})/)
    return m ? m[1] : ''
  }
  return ''
}

export function buildYoutubeEmbed(bg: Background, muted: boolean): string {
  const id = getYoutubeId(bg.src)
  if (!id) return ''
  const m = muted ? '1' : '0'
  const origin =
    window.location.origin && window.location.origin !== 'null'
      ? `&origin=${encodeURIComponent(window.location.origin)}`
      : ''
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=${m}&controls=0&loop=1&playlist=${id}&playsinline=1&enablejsapi=1&rel=0&modestbranding=1${origin}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export const SEARCH_ENGINES: Record<string, string> = {
  google: 'https://www.google.com/search?q=%s',
  bing: 'https://www.bing.com/search?q=%s',
  duckduckgo: 'https://duckduckgo.com/?q=%s',
  brave: 'https://search.brave.com/search?q=%s',
}

export function getSearchUrl(engine: string, custom: string, query: string): string {
  let tpl = SEARCH_ENGINES[engine] ?? SEARCH_ENGINES.google
  if (engine === 'custom' && custom.includes('%s')) tpl = custom
  return tpl.replace('%s', encodeURIComponent(query))
}

export function safeText(value: string): string {
  return value.replace(/[<>]/g, '')
}

export function inferShortcutMeta(rawUrl: string, rawName = ''): {
  group: string
  description: string
  tags: string[]
} {
  const fallback = {
    group: 'General',
    description: 'Saved website shortcut',
    tags: ['web'],
  }

  const value = normalizeUrl(rawUrl).toLowerCase()
  const name = rawName.trim()
  if (!value) return fallback

  let host = ''
  try {
    host = new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return fallback
  }

  const DOMAIN_HINTS: Array<{
    match: RegExp
    group: string
    description: string
    tags: string[]
  }> = [
    { match: /(youtube|netflix|spotify|primevideo|hotstar|twitch)/, group: 'Entertainment', description: 'Streaming and entertainment platform', tags: ['media', 'video'] },
    { match: /(github|gitlab|stackoverflow|vercel|codepen|npmjs)/, group: 'Work', description: 'Developer and coding resource', tags: ['dev', 'coding'] },
    { match: /(gmail|outlook|mail|notion|drive\.google|docs\.google|calendar\.google)/, group: 'Work', description: 'Productivity and communication tool', tags: ['productivity', 'work'] },
    { match: /(coursera|udemy|edx|khanacademy|w3schools|geeksforgeeks|leetcode)/, group: 'Study', description: 'Learning and educational platform', tags: ['learning', 'study'] },
    { match: /(linkedin|indeed|naukri|wellfound)/, group: 'Career', description: 'Career and professional networking site', tags: ['career', 'jobs'] },
    { match: /(instagram|facebook|x\.com|twitter|reddit|discord|whatsapp|telegram)/, group: 'Social', description: 'Social and community platform', tags: ['social', 'community'] },
    { match: /(amazon|flipkart|ebay|aliexpress)/, group: 'Shopping', description: 'Online shopping platform', tags: ['shopping', 'commerce'] },
    { match: /(chatgpt|claude|gemini|copilot|perplexity)/, group: 'AI', description: 'AI assistant and research tool', tags: ['ai', 'assistant'] },
  ]

  const hint = DOMAIN_HINTS.find((h) => h.match.test(host))
  if (!hint) return fallback

  return {
    group: hint.group,
    description: name ? `${hint.description} (${name})` : hint.description,
    tags: hint.tags,
  }
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function exportCsv(shortcuts: import('../types').Shortcut[]): void {
  const rows = shortcuts.map((s) => ({
    Name: s.name,
    URL: s.url,
    Group: s.group,
    Tags: (s.tags ?? []).join('; '),
    Description: s.description ?? '',
    Pinned: s.pinned ? 'true' : 'false',
    Clicks: String(s.clicks),
    Created: new Date(s.createdAt).toISOString().slice(0, 10),
  }))
  const csv = Papa.unparse(rows, {
    columns: ['Name', 'URL', 'Group', 'Tags', 'Description', 'Pinned', 'Clicks', 'Created'],
  })
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `linky-shortcuts-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function importCsv(csv: string): import('../types').Shortcut[] {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  })

  if (!parsed.data.length) return []

  const pick = (row: Record<string, string>, keys: string[]) => {
    for (const k of keys) {
      const value = row[k]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
    return ''
  }

  return parsed.data
    .map((row) => {
      const name = pick(row, ['Name', 'name'])
      const url = pick(row, ['URL', 'Url', 'url'])
      const group = pick(row, ['Group', 'group']) || 'General'
      const tagsRaw = pick(row, ['Tags', 'tags'])
      const description = pick(row, ['Description', 'description'])
      const pinnedRaw = pick(row, ['Pinned', 'pinned']).toLowerCase()
      const clicksRaw = pick(row, ['Clicks', 'clicks'])
      const tags = tagsRaw
        ? tagsRaw.split(/[;,]/).map((tag) => tag.trim()).filter(Boolean)
        : []

      return {
        id: uid(),
        name,
        url,
        group,
        tags,
        description,
        pinned: pinnedRaw === 'true' || pinnedRaw === '1' || pinnedRaw === 'yes',
        clicks: parseInt(clicksRaw || '0', 10) || 0,
        createdAt: Date.now(),
        icon: '',
      }
    })
    .filter((s) => s.name && s.url)
}
