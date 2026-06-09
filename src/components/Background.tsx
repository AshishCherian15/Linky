import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { buildYoutubeEmbed } from '../utils/helpers'

export default function Background() {
  const background = useStore((s) => s.background)
  const settings   = useStore((s) => s.settings)
  const videoRef   = useRef<HTMLVideoElement>(null)

  const muted  = !settings.bgAudio || settings.bgMuted
  const volume = settings.audioVolume / 100

  // ── Keep volume/muted in sync and re-attempt play ──────────────────
  useEffect(() => {
    const v = videoRef.current
    if (!v || background.type !== 'video') return
    v.volume = muted ? 0 : volume
    v.muted  = muted
    // If the video is paused (e.g. browser suspended it), resume
    if (v.paused && v.readyState >= 2) {
      v.play().catch(() => {})
    }
  }, [muted, volume, background.type])

  // ── Load new source and play whenever background changes ───────────
  useEffect(() => {
    const v = videoRef.current
    if (!v || background.type !== 'video') return

    v.src    = background.src
    v.volume = muted ? 0 : volume
    v.muted  = muted
    v.load()
    const tryPlay = () => v.play().catch(() => {})
    v.addEventListener('canplay', tryPlay, { once: true })
    return () => v.removeEventListener('canplay', tryPlay)
  }, [background.src, background.type]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resume when tab becomes visible again ──────────────────────────
  useEffect(() => {
    function onVisible() {
      const v = videoRef.current
      if (!v || background.type !== 'video') return
      if (v.paused) v.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [background.type])

  const youtubeUrl = background.type === 'youtube'
    ? buildYoutubeEmbed(background, muted)
    : ''

  return (
    <>
      {/* ── Video background ── */}
      <video
        id="bg-video"
        ref={videoRef}
        autoPlay
        loop
        muted={muted}
        playsInline
        src={background.type === 'video' ? background.src : undefined}
        style={{ display: background.type === 'video' ? 'block' : 'none' }}
      />

      {/* ── Image background ── */}
      <img
        id="bg-image"
        src={background.type === 'image' ? background.src : undefined}
        alt=""
        style={{ display: background.type === 'image' ? 'block' : 'none' }}
      />

      {/* ── YouTube background ── */}
      {background.type === 'youtube' && youtubeUrl && (
        <iframe
          id="bg-youtube"
          title="Background video"
          src={youtubeUrl}
          allow="autoplay; encrypted-media"
          style={{ display: 'block' }}
        />
      )}

      {/* ── Solid / Gradient background ── */}
      {background.type === 'none' && (
        <div
          className="pointer-events-none fixed inset-0 z-[-4]"
          style={{
            background: background.bgGradient
              ? background.bgGradient
              : (background.bgColor ?? '#050a18'),
          }}
        />
      )}

      {/* ── Dark overlay so content stays readable ── */}
      <div
        className="pointer-events-none fixed inset-0 z-[-2]"
        style={{ background: 'rgba(4, 8, 20, 0.42)' }}
      />
    </>
  )
}
