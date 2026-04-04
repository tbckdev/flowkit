import { useState, useEffect, useCallback } from 'react'
import { Image, Film, Zap, Users } from 'lucide-react'
import { fetchAPI } from '../../api/client'
import { useWebSocket } from '../../api/useWebSocket'
import type { Character, Scene } from '../../types'
import StageNode from './StageNode'
import SceneCard from './SceneCard'

type ExpandedStage = 'refs' | 'image' | 'video' | 'upscale' | null

interface PipelineViewProps {
  projectId: string
  videoId: string
}

function deriveStatus(completed: number, total: number, hasFailure: boolean) {
  if (total === 0) return 'pending' as const
  if (hasFailure) return 'failed' as const
  if (completed === total) return 'completed' as const
  if (completed > 0) return 'processing' as const
  return 'pending' as const
}

export default function PipelineView({ projectId, videoId }: PipelineViewProps) {
  const [chars, setChars] = useState<Character[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [expanded, setExpanded] = useState<ExpandedStage>(null)
  const { lastEvent } = useWebSocket()

  const load = useCallback(async () => {
    const [c, s] = await Promise.all([
      fetchAPI<Character[]>(`/api/projects/${projectId}/characters`),
      fetchAPI<Scene[]>(`/api/scenes?video_id=${videoId}`),
    ])
    setChars(c)
    setScenes(s)
  }, [projectId, videoId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!lastEvent) return
    const t = lastEvent.type
    if (t === 'scene_updated' || t === 'character_updated' || t === 'request_completed' || t === 'request_failed') {
      load()
    }
  }, [lastEvent, load])

  // Helpers — pick whichever orientation has data
  const imgStatus = (s: Scene) =>
    s.vertical_image_status !== 'PENDING' ? s.vertical_image_status : s.horizontal_image_status
  const vidStatus = (s: Scene) =>
    s.vertical_video_status !== 'PENDING' ? s.vertical_video_status : s.horizontal_video_status
  const upsStatus = (s: Scene) =>
    s.vertical_upscale_status !== 'PENDING' ? s.vertical_upscale_status : s.horizontal_upscale_status

  // Stats
  const refsCompleted = chars.filter(c => c.media_id).length
  const refsTotal = chars.length

  const imagesCompleted = scenes.filter(s => imgStatus(s) === 'COMPLETED').length
  const imagesFailed = scenes.some(s => imgStatus(s) === 'FAILED')

  const videosCompleted = scenes.filter(s => vidStatus(s) === 'COMPLETED').length
  const videosFailed = scenes.some(s => vidStatus(s) === 'FAILED')

  const upscaleCompleted = scenes.filter(s => upsStatus(s) === 'COMPLETED').length
  const upscaleFailed = scenes.some(s => upsStatus(s) === 'FAILED')

  const total = scenes.length

  const stages = [
    {
      key: 'refs' as const,
      name: 'Refs',
      icon: Users,
      completed: refsCompleted,
      total: refsTotal,
      status: deriveStatus(refsCompleted, refsTotal, false),
    },
    {
      key: 'image' as const,
      name: 'Images',
      icon: Image,
      completed: imagesCompleted,
      total,
      status: deriveStatus(imagesCompleted, total, imagesFailed),
    },
    {
      key: 'video' as const,
      name: 'Videos',
      icon: Film,
      completed: videosCompleted,
      total,
      status: deriveStatus(videosCompleted, total, videosFailed),
    },
    {
      key: 'upscale' as const,
      name: 'Upscale',
      icon: Zap,
      completed: upscaleCompleted,
      total,
      status: deriveStatus(upscaleCompleted, total, upscaleFailed),
    },
  ]

  const toggle = (key: ExpandedStage) => setExpanded(prev => prev === key ? null : key)

  return (
    <div className="flex flex-col gap-4">
      {/* Stage nodes row */}
      <div className="flex items-stretch gap-2">
        {stages.map((stage, i) => (
          <div key={stage.key} className="flex items-center gap-2 flex-1 min-w-0">
            <StageNode
              name={stage.name}
              icon={stage.icon}
              completed={stage.completed}
              total={stage.total}
              status={stage.status}
              isExpanded={expanded === stage.key}
              onClick={() => toggle(stage.key)}
            />
            {i < stages.length - 1 && (
              <span className="flex-shrink-0 text-sm" style={{ color: 'var(--muted)' }}>→</span>
            )}
          </div>
        ))}
      </div>

      {/* Expanded scene grid */}
      {expanded && expanded !== 'refs' && scenes.length > 0 && (
        <div>
          <div className="text-xs mb-2 font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            {expanded} — {scenes.length} scenes
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
            {scenes.map(scene => (
              <SceneCard key={scene.id} scene={scene} stage={expanded as 'image' | 'video' | 'upscale'} />
            ))}
          </div>
        </div>
      )}

      {/* Expanded refs grid */}
      {expanded === 'refs' && chars.length > 0 && (
        <div>
          <div className="text-xs mb-2 font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            refs — {chars.length} entities
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
            {chars.map(c => (
              <div
                key={c.id}
                className="flex flex-col gap-1.5 p-2 rounded text-xs"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-full rounded overflow-hidden flex items-center justify-center"
                  style={{ aspectRatio: '3/4', background: 'var(--surface)', maxHeight: '80px' }}
                >
                  {c.reference_image_url ? (
                    <img src={c.reference_image_url} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: '10px' }}>No image</span>
                  )}
                </div>
                <div className="font-semibold truncate" style={{ color: 'var(--text)' }}>{c.name}</div>
                <div style={{ color: 'var(--muted)', fontSize: '10px' }}>{c.entity_type}</div>
                <div style={{ color: c.media_id ? 'var(--green)' : 'var(--muted)', fontSize: '10px' }}>
                  {c.media_id ? 'Ready' : 'Pending'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
