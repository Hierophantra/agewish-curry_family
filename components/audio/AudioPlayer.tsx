'use client'

// components/audio/AudioPlayer.tsx
// Client component — manages native <audio> playback state.
// Intentionally simple in v1: play/pause button + title + metadata.
// No waveform visualisation, no scrubber bar — those are future enhancements.
import { useRef, useState } from 'react'
import type { Audio as AudioRecord } from '@/lib/types'
import { getAudioUrl } from '@/lib/utils'

interface AudioPlayerProps {
  audio: AudioRecord
}

export default function AudioPlayer({ audio }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  function togglePlay() {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
    } else {
      el.play().catch(() => {
        // Silent fail — placeholder files are not real audio; real files will play correctly.
      })
    }
  }

  return (
    <div className="flex items-center gap-4 py-4 px-5 bg-ivory border hairline rounded-lg">
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        aria-label={playing ? `Pause ${audio.title}` : `Play ${audio.title}`}
      >
        {playing ? (
          <svg viewBox="0 0 12 12" width="14" height="14" fill="none" aria-hidden="true">
            <rect x="3" y="2" width="2" height="8" fill="currentColor" />
            <rect x="7" y="2" width="2" height="8" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 12 12" width="14" height="14" fill="none" aria-hidden="true">
            <path d="M3 2 L9 6 L3 10 Z" fill="currentColor" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-serif text-navy text-base leading-tight mb-0.5 truncate">{audio.title}</p>
        {(audio.dateLabel || audio.duration) && (
          <p className="eyebrow text-quiet text-[10px]">
            {audio.circa ? 'Circa ' : ''}{[audio.dateLabel, audio.duration].filter(Boolean).join(' · ')}
          </p>
        )}
        {audio.description && (
          <p className="text-muted text-sm mt-1.5 italic font-serif">{audio.description}</p>
        )}
      </div>
      <audio
        ref={audioRef}
        src={getAudioUrl(audio)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        preload="metadata"
      />
    </div>
  )
}
