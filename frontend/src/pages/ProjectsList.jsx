import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { format } from 'date-fns'

export default function ProjectsList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false))
  }, [])

  const createProject = async (e) => {
    e.preventDefault()
    setError(''); setCreating(true)
    try {
      const { data } = await api.post('/projects', form)
      setProjects(p => [{ ...data, member_count: 1, task_count: 0, my_role: 'admin' }, ...p])
      setShowNew(false)
      setForm({ name: '', description: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project')
    } finally { setCreating(false) }
  }

  if (loading) return <div className="loading"><div className="spinner spin" /></div>

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Projects</h1>
          <p style={{ color: 'var(--text3)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>◈</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No projects yet</h3>
          <p style={{ color: 'var(--text3)', marginBottom: 24 }}>Create your first project to start organizing tasks</p>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>Create Project</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {projects.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ height: '100%', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `hsl(${(p.id * 60) % 360}, 60%, 30%)`,
                    border: `1px solid hsl(${(p.id * 60) % 360}, 60%, 40%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <span className={`badge badge-${p.my_role}`}>{p.my_role}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{p.name}</h3>
                {p.description && (
                  <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>{p.description}</p>
                )}
                <div style={{ display: 'flex', gap: 16, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text3)' }}>
                  <span>👥 {p.member_count}</span>
                  <span>📋 {p.task_count} tasks</span>
                  <span style={{ marginLeft: 'auto' }}>{format(new Date(p.created_at), 'MMM d')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showNew && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="modal">
            <h2 className="modal-title">New Project</h2>
            <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="label">Project Name *</label>
                <input className="input" placeholder="e.g. Website Redesign" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea className="input" rows={3} placeholder="What is this project about?"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
              {error && <div className="error-msg">{error}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
                <button className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
