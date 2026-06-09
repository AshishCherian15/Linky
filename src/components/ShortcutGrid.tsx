import { useState } from 'react'
import {
  DndContext, PointerSensor, closestCenter,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { useStore } from '../store/useStore'
import ShortcutCard from './ShortcutCard'
import type { Shortcut } from '../types'
import { t } from '../utils/i18n'

export default function ShortcutGrid() {
  const activeProfile    = useStore((s) => s.activeProfile)
  const searchQuery      = useStore((s) => s.searchQuery)
  const settings         = useStore((s) => s.settings)
  const reorderShortcuts = useStore((s) => s.reorderShortcuts)
  const openDialog       = useStore((s) => s.openDialog)
  const lang             = settings.language ?? 'en'

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const all      = activeProfile().shortcuts
  const filtered = all.filter((s) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.url.toLowerCase().includes(q) ||
      s.group.toLowerCase().includes(q) ||
      (s.tags ?? []).join(' ').toLowerCase().includes(q) ||
      (s.description ?? '').toLowerCase().includes(q) ||
      (s.icon ?? '').toLowerCase().includes(q)
    )
  })

  const pinned   = filtered.filter((s) => s.pinned)
  const unpinned = filtered.filter((s) => !s.pinned)

  function groupBy(items: Shortcut[]) {
    const m: Record<string, Shortcut[]> = {}
    items.forEach((s) => { const k = s.group||'General'; m[k]??=[]; m[k]!.push(s) })
    return m
  }

  function sorted(m: Record<string, Shortcut[]>) {
    const keys = Object.keys(m)
    if (settings.groupSort === 'az') return keys.sort((a,b) => a.localeCompare(b))
    if (settings.groupSort === 'most-used')
      return keys.sort((a,b) =>
        (m[b]?.reduce((s,c) => s+c.clicks, 0)??0) - (m[a]?.reduce((s,c) => s+c.clicks, 0)??0))
    return keys
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    reorderShortcuts(String(active.id), String(over.id))
  }

  const grid = {
    compact:     'grid-cols-[repeat(auto-fill,minmax(88px,1fr))]',
    comfortable: 'grid-cols-[repeat(auto-fill,minmax(118px,1fr))]',
    large:       'grid-cols-[repeat(auto-fill,minmax(148px,1fr))]',
  }[settings.tileSize]

  /* ── Empty state ── */
  if (filtered.length === 0) {
    return (
      <div className="mt-2 rounded-[22px] border border-dashed p-14 text-center animate-fadeIn"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        {searchQuery ? (
          <>
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-sm font-medium mb-1" style={{ color:'rgba(255,255,255,0.6)' }}>
              {t(lang, 'noMatch')} <span className="font-bold text-white/80">"{searchQuery}"</span>
            </p>
            <p className="text-xs" style={{ color:'rgba(255,255,255,0.32)' }}>{t(lang, 'pressEnterSearch')}</p>
          </>
        ) : (
          <>
            <p className="text-5xl mb-4 animate-float">🚀</p>
            <p className="text-base font-semibold mb-1 text-white/70">{t(lang, 'noShortcutsYet')}</p>
            <p className="text-xs mb-6 text-white/38">{t(lang, 'addFirst')}</p>
            <button className="btn-primary text-sm" onClick={() => openDialog('add-shortcut')}>
              + {t(lang, 'addShortcut')}
            </button>
          </>
        )}
      </div>
    )
  }

  const groups = groupBy(unpinned)
  const names  = sorted(groups)

  function Section({ title, items, delay }: { title: string; items: Shortcut[]; delay: number }) {
    const isCollapsed = !!collapsed[title]
    const h = isCollapsed ? 0 : items.length * 200
    return (
      <section
        className="group-section p-4 animate-rise"
        style={{ animationDelay: `${delay}ms` }}
      >
        {/* header */}
        <button
          className="flex w-full items-center gap-2.5 mb-3 text-left"
          onClick={() => setCollapsed((c) => ({ ...c, [title]: !c[title] }))}
        >
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.15em]"
            style={{ color:'rgba(255,255,255,0.6)' }}>
            {title}
          </span>
          <div className="group-header-line" />
          <span className="chip">{items.length}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0 transition-transform duration-200"
            style={{ width:13, height:13, color:'rgba(255,255,255,0.28)', transform: isCollapsed?'rotate(-90deg)':'rotate(0deg)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* body */}
        <div
          className={`group-body ${isCollapsed ? 'collapsed' : ''}`}
          style={{ maxHeight: isCollapsed ? 0 : `${h}px` }}
        >
          <SortableContext items={items.map((s) => s.id)} strategy={rectSortingStrategy}>
            <div className={`grid ${grid} gap-2.5`}>
              {items.map((s, i) => (
                <div key={s.id} className="animate-riseStagger" style={{ animationDelay: `${i * 22}ms` }}>
                  <ShortcutCard shortcut={s} />
                </div>
              ))}
            </div>
          </SortableContext>
        </div>
      </section>
    )
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="flex flex-col gap-3 animate-rise">

          {/* Pinned */}
          {pinned.length > 0 && (
            <section className="group-section p-4 rounded-[22px]">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.15em]"
                  style={{ color:'rgba(255,255,255,0.6)' }}>
                  {t(lang, 'pinned_section')}
                </span>
                <div className="group-header-line" />
                <span className="chip-accent">{pinned.length}</span>
              </div>
              <SortableContext items={pinned.map((s) => s.id)} strategy={rectSortingStrategy}>
                <div className={`grid ${grid} gap-2.5`}>
                  {pinned.map((s, i) => (
                    <div key={s.id} className="animate-riseStagger" style={{ animationDelay: `${i * 25}ms` }}>
                      <ShortcutCard shortcut={s} />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </section>
          )}

          {/* Groups */}
          {names.map((name, gi) => (
            <Section key={name} title={name} items={groups[name]!} delay={gi * 45} />
          ))}
        </div>
      </DndContext>

      {/* FAB — visible when edit mode on */}
      {settings.editMode && (
        <button className="fab" onClick={() => openDialog('add-shortcut')} title="Add shortcut [n]">
          +
        </button>
      )}
    </>
  )
}
