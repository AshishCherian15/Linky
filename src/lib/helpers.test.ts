import { describe, expect, it } from 'vitest'
import {
  getYoutubeId,
  importCsv,
  inferShortcutMeta,
  normalizeBackgroundSrc,
  normalizeUrl,
} from './helpers'

describe('normalizeUrl', () => {
  it('adds https to plain domains', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com')
  })

  it('keeps existing protocol', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com')
  })
})

describe('normalizeBackgroundSrc', () => {
  it('converts github blob url to raw url', () => {
    expect(
      normalizeBackgroundSrc('https://github.com/a/b/blob/main/video.webm'),
    ).toBe('https://raw.githubusercontent.com/a/b/main/video.webm')
  })

  it('keeps absolute URLs untouched', () => {
    expect(normalizeBackgroundSrc('https://cdn.example.com/bg.mp4')).toBe(
      'https://cdn.example.com/bg.mp4',
    )
  })
})

describe('getYoutubeId', () => {
  it('extracts ID from youtu.be url', () => {
    expect(getYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from watch url', () => {
    expect(getYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    )
  })
})

describe('inferShortcutMeta', () => {
  it('infers AI category for chatgpt domain', () => {
    const meta = inferShortcutMeta('https://chatgpt.com', 'ChatGPT')
    expect(meta.group).toBe('AI')
    expect(meta.tags).toContain('ai')
  })

  it('returns fallback for unknown domains', () => {
    const meta = inferShortcutMeta('https://unknown-example-domain.test')
    expect(meta.group).toBe('General')
    expect(meta.tags).toEqual(['web'])
  })
})

describe('importCsv', () => {
  it('imports rows with tags and booleans', () => {
    const csv = [
      'Name,URL,Group,Tags,Description,Pinned,Clicks,Created',
      '"Docs","https://docs.example.com","Work","dev; docs","Project docs","true","5","2026-06-09"',
    ].join('\n')

    const rows = importCsv(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.name).toBe('Docs')
    expect(rows[0]?.pinned).toBe(true)
    expect(rows[0]?.tags).toEqual(['dev', 'docs'])
    expect(rows[0]?.clicks).toBe(5)
  })

  it('ignores invalid empty rows', () => {
    const csv = [
      'Name,URL,Group,Description,Pinned,Clicks,Created',
      '"","","General","","false","0","2026-06-09"',
    ].join('\n')
    expect(importCsv(csv)).toHaveLength(0)
  })
})
