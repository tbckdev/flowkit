import type { Scene, StatusType } from '../../types'

interface SceneCardProps {
  scene: Scene
  stage: 'image' | 'video' | 'upscale'
}

const STATUS_COLORS: Record<StatusType, string> = {
  COMPLETED: 'var(--green)',
  PROCESSING: 'var(--yellow)',
  PENDING: 'var(--muted)',
  FAILED: 'var(--red)',
}

const CHAIN_COLORS: Record<string, string> = {
  ROOT: 'var(--accent)',
  CONTINUATION: 'var(--green)',
  INSERT: 'var(--yellow)',
}

function getStageStatus(scene: Scene, stage: 'image' | 'video' | 'upscale'): StatusType {
  if (stage === 'image') return scene.vertical_image_status !== 'PENDING' ? scene.vertical_image_status : scene.horizontal_image_status
  if (stage === 'video') return scene.vertical_video_status !== 'PENDING' ? scene.vertical_video_status : scene.horizontal_video_status
  return scene.vertical_upscale_status !== 'PENDING' ? scene.vertical_upscale_status : scene.horizontal_upscale_status
}

function getThumbUrl(scene: Scene): string | null {
  return scene.vertical_image_url || scene.horizontal_image_url
}

export default function SceneCard({ scene, stage }: SceneCardProps) {
  const status = getStageStatus(scene, stage)
  const thumbUrl = getThumbUrl(scene)
  const prompt = (scene.prompt ?? scene.image_prompt ?? '').slice(0, 60)

  return (
    <div
      className="flex flex-col gap-1.5 p-2 rounded text-xs"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Thumbnail */}
      <div
        className="w-full rounded overflow-hidden flex items-center justify-center"
        style={{ aspectRatio: '9/16', background: 'var(--surface)', maxHeight: '80px' }}
      >
        {thumbUrl ? (
          <img src={thumbUrl} alt={`Scene ${scene.display_order + 1}`} className="w-full h-full object-cover" />
        ) : (
          <span style={{ color: 'var(--muted)', fontSize: '10px' }}>No image</span>
        )}
      </div>

      {/* Scene # + chain badge */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="font-bold" style={{ color: 'var(--text)' }}>
          #{scene.display_order + 1}
        </span>
        <span
          className="px-1 rounded"
          style={{
            background: CHAIN_COLORS[scene.chain_type] ?? 'var(--muted)',
            color: '#000',
            fontSize: '9px',
            fontWeight: 700,
          }}
        >
          {scene.chain_type}
        </span>
        <span
          className="ml-auto px-1 rounded"
          style={{
            background: STATUS_COLORS[status],
            color: '#000',
            fontSize: '9px',
            fontWeight: 700,
          }}
        >
          {status}
        </span>
      </div>

      {/* Prompt */}
      {prompt && (
        <p className="truncate" style={{ color: 'var(--muted)', fontSize: '10px' }} title={scene.prompt ?? ''}>
          {prompt}{(scene.prompt ?? '').length > 60 ? '…' : ''}
        </p>
      )}
    </div>
  )
}
