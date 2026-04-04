import { useState, useEffect } from 'react'
import { fetchAPI } from '../api/client'
import type { Project, Video, Scene } from '../types'
import VideoGallery from '../components/gallery/VideoGallery'

export default function GalleryPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAPI<Project[]>('/api/projects')
      .then(ps => {
        const active = ps.filter(p => p.status !== 'DELETED')
        setProjects(active)
        if (active.length > 0) setSelectedProject(active[0].id)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedProject) return
    setVideos([])
    setSelectedVideo('')
    setScenes([])
    fetchAPI<Video[]>(`/api/videos?project_id=${selectedProject}`)
      .then(vs => {
        setVideos(vs)
        if (vs.length > 0) setSelectedVideo(vs[0].id)
      })
      .catch(console.error)
  }, [selectedProject])

  useEffect(() => {
    if (!selectedVideo) return
    setLoading(true)
    fetchAPI<Scene[]>(`/api/scenes?video_id=${selectedVideo}`)
      .then(setScenes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedVideo])

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: 'var(--muted)' }}>Project</label>
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="text-xs px-2 py-1.5 rounded outline-none"
            style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {videos.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Video</label>
            <select
              value={selectedVideo}
              onChange={e => setSelectedVideo(e.target.value)}
              className="text-xs px-2 py-1.5 rounded outline-none"
              style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              {videos.map(v => (
                <option key={v.id} value={v.id}>{v.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-xs" style={{ color: 'var(--muted)' }}>Loading scenes...</div>
      ) : (
        <VideoGallery scenes={scenes} />
      )}
    </div>
  )
}
