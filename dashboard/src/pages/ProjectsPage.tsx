import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchAPI } from '../api/client'
import type { Project } from '../types'
import ProjectDetailPage from './ProjectDetailPage'

type FilterTab = 'ACTIVE' | 'ARCHIVED' | 'ALL'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null
  const isTwo = tier.includes('TWO')
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: isTwo ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)', color: isTwo ? 'var(--yellow)' : 'var(--accent)' }}
    >
      {isTwo ? 'TIER 2' : 'TIER 1'}
    </span>
  )
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <div
      className="rounded-lg p-4 cursor-pointer transition-opacity hover:opacity-80 flex flex-col gap-2"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      onClick={onClick}
    >
      <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>
        {project.name}
      </div>
      {project.description && (
        <div
          className="text-xs overflow-hidden"
          style={{
            color: 'var(--muted)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {project.description}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-auto pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        {project.material && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold" style={{ background: 'rgba(100,116,139,0.2)', color: 'var(--muted)' }}>
            {project.material}
          </span>
        )}
        <TierBadge tier={project.user_paygate_tier} />
        <span className="text-xs ml-auto" style={{ color: 'var(--muted)' }}>
          {formatDate(project.created_at)}
        </span>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<FilterTab>('ACTIVE')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchAPI<Project[]>('/api/projects')
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // If there's an :id param, show detail page
  if (id) {
    return <ProjectDetailPage projectId={id} onBack={() => navigate('/projects')} />
  }

  const filtered = projects.filter(p => {
    if (tab === 'ALL') return p.status !== 'DELETED'
    return p.status === tab
  })

  const tabs: FilterTab[] = ['ACTIVE', 'ARCHIVED', 'ALL']

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div className="flex gap-1">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded text-xs font-semibold transition-colors"
            style={{
              background: tab === t ? 'var(--accent)' : 'var(--card)',
              color: tab === t ? '#fff' : 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-xs" style={{ color: 'var(--muted)' }}>Loading projects...</div>
      ) : filtered.length === 0 ? (
        <div className="text-xs" style={{ color: 'var(--muted)' }}>No {tab.toLowerCase()} projects.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filtered.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => navigate(`/projects/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
