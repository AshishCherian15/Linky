import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../../store/useStore'
import { buildYoutubeEmbed } from '../../../lib/helpers'

export default function Background() {
  const background = useStore((s) => s.background)
  const settings   = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const videoRef   = useRef<HTMLVideoElement>(null)
  const [showAudioToggle, setShowAudioToggle] = useState(false)

  const muted  = !settings.bgAudio || settings.bgMuted
  const volume = settings.audioVolume / 100

  // Show audio toggle for video/YouTube backgrounds
  useEffect(() => {
    setShowAudioToggle(background.type === 'video' || background.type === 'youtube')
  }, [background.type])

  // ── Cleanup video when background changes or unmounts ─────────────
  useEffect(() => {
    const v = videoRef.current
    return () => {
      if (v) {
        v.pause()
        v.currentTime = 0
        v.removeAttribute('src')
        v.load() // forces browser to release the decoder/audio track
      }
    }
  }, [background.src, background.type])

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
  }, [background.src, background.type, muted, volume])

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
    ? buildYoutubeEmbed(background)
    : ''

  function toggleAudio() {
    updateSettings({ bgMuted: !settings.bgMuted })
  }

  return (
    <>
      {/* ── Video background (only rendered when active) ── */}
      {background.type === 'video' && (
        <video
          key={background.src}
          id="bg-video"
          ref={videoRef}
          autoPlay
          loop
          muted={muted}
          playsInline
          src={background.src}
        />
      )}

      {/* ── Image background (only rendered when active) ── */}
      {background.type === 'image' && (
        <img
          key={background.src}
          id="bg-image"
          src={background.src}
          alt=""
        />
      )}

      {/* ── YouTube background (only rendered when active) ── */}
      {background.type === 'youtube' && youtubeUrl && (
        <iframe
          key={background.src}
          id="bg-youtube"
          title="Background video"
          src={youtubeUrl}
          allow="autoplay; encrypted-media"
        />
      )}

      {/* ── Solid / Gradient background (only rendered when active) ── */}
      {background.type === 'none' && (
        <div
          key="solid"
          className="pointer-events-none fixed inset-0 z-[-4]"
          style={{
            background: background.bgGradient
              ? background.bgGradient
              : (background.bgColor ?? '#050a18'),
          }}
        />
      )}

      {/* ── Audio toggle button for video/YouTube backgrounds ── */}
      {showAudioToggle && (
        <button
          onClick={toggleAudio}
          className="fixed bottom-4 right-4 z-[-1] p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all border border-white/20"
          title={muted ? 'Unmute background' : 'Mute background'}
        >
          {muted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      )}

      {/* ── Dark overlay so content stays readable ── */}
      <div
        className="pointer-events-none fixed inset-0 z-[-2]"
        style={{ background: 'rgba(4, 8, 20, 0.42)' }}
      />
    </>
  )
}
