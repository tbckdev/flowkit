import { useState } from 'react'
import type { Scene } from '../../types'
import VideoPlayer from './VideoPlayer'

interface VideoGalleryProps {
  scenes: Scene[]
}

export default function VideoGallery({ scenes }: VideoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const videoscenes = scenes.filter(s => s.vertical_video_url)

  if (videoscenes.length === 0) {
    return (
      <div className="flex items-center justify-center py-16" style={{ color: 'var(--muted)' }}>
        No completed videos yet.
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {videoscenes.map((scene, idx) => (
          <div
            key={scene.id}
            className="relative rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
            style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
            onClick={() => setActiveIndex(idx)}
          >
            {/* Thumbnail */}
            <div className="relative" style={{ aspectRatio: '9/16' }}>
              {scene.vertical_image_url ? (
                <img
                  src={scene.vertical_image_url}
                  alt={`Scene ${scene.display_order + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
                  No image
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-2" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)' }}>
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--text)' }}>
                    #{scene.display_order + 1}
                  </span>
                  <div className="flex gap-1">
                    {scene.vertical_video_url && (
                      <span title="Video ready" className="text-xs px-1 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.8)', color: '#fff' }}>
                        ✓
                      </span>
                    )}
                    {scene.vertical_upscale_url && (
                      <span title="Upscaled" className="text-xs px-1 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.8)', color: '#fff' }}>
                        ★
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--text)' }}>
                  {scene.prompt?.slice(0, 60) ?? ''}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeIndex !== null && (
        <VideoPlayer
          scenes={videoscenes}
          initialIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  )
}
