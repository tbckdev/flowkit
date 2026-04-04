import { useState, useEffect } from 'react'
import { fetchAPI } from '../api/client'
import { useWebSocket } from '../api/useWebSocket'
import type { Project, Video } from '../types'
import PipelineView from '../components/pipeline/PipelineView'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const { lastEvent } = useWebSocket()

  useEffect(() => {
    fetchAPI<Project[]>('/api/projects').then(setProjects).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedProject) {
      setVideos([])
      setSelectedVideo('')
      return
    }
    fetchAPI<Video[]>(`/api/videos?project_id=${selectedProject}`)
      .then(v => {
        setVideos(v)
        if (v.length > 0) setSelectedVideo(v[0].id)
        else setSelectedVideo('')
      })
      .catch(() => {})
  }, [selectedProject])

  // Re-fetch projects list on WS events that may add new projects
  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.type === 'project_created') {
      fetchAPI<Project[]>('/api/projects').then(setProjects).catch(() => {})
    }
  }, [lastEvent])

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Selectors */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          className="px-2 py-1.5 rounded text-xs"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', minWidth: '180px' }}
        >
          <option value="">Select project…</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={selectedVideo}
          onChange={e => setSelectedVideo(e.target.value)}
          disabled={!selectedProject || videos.length === 0}
          className="px-2 py-1.5 rounded text-xs"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', minWidth: '180px' }}
        >
          <option value="">Select video…</option>
          {videos.map(v => (
            <option key={v.id} value={v.id}>{v.title}</option>
          ))}
        </select>
      </div>

      {/* Pipeline view */}
      {selectedProject && selectedVideo ? (
        <PipelineView projectId={selectedProject} videoId={selectedVideo} />
      ) : (
        <div className="flex items-center justify-center flex-1" style={{ color: 'var(--muted)' }}>
          Select a project and video to view the pipeline
        </div>
      )}
    </div>
  )
}
