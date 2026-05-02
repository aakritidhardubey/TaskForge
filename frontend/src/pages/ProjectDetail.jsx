import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { format, isPast } from 'date-fns'

const STATUSES = ['todo', 'in_progress', 'review', 'done']
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'In Review', done: 'Done' }
const PRIORITIES = ['low', 'medium', 'high', 'critical']

function TaskModal({ task, members, currentUserId, myRole, onClose, onSave }) {
  const [form, setForm] = useState(task ? {
    title: task.title, description: task.description || '',
    status: task.status, priority: task.priority,
    due_date: task.due_date ? task.due_date.slice(0, 16) : '',
    assignee_id: task.assignee_id || '',
  } : { title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assignee_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handle = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    const payload = {
      ...form,
      assignee_id: form.assignee_id ? parseInt(form.assignee_id) : null,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
    }
    try {
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540 }}>
        <h2 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} style={{ resize: 'vertical' }}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input className="input" type="datetime-local" value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Assign To</label>
              <select className="input" value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.user_id} value={m.user_id}>{m.user.name}</option>)}
              </select>
            </div>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Task'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function InviteModal({ projectId, onClose, onInvited }) {
  const [form, setForm] = useState({ email: '', role: 'member' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const { data } = await api.post(`/projects/${projectId}/members`, form)
      onInvited(data); onClose()
    } catch (err) { setError(err.response?.data?.detail || 'Failed to invite') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">Invite Member</h2>
        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="label">Email Address</label>
            <input className="input" type="email" placeholder="colleague@company.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Inviting…' : 'Invite'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('tasks')
  const [taskModal, setTaskModal] = useState(null) // null | 'new' | task object
  const [inviteModal, setInviteModal] = useState(false)
  const [filter, setFilter] = useState({ status: '', priority: '' })
  const [deleting, setDeleting] = useState(false)

  const myRole = project?.members?.find(m => m.user_id === user.id)?.role
  const isAdmin = myRole === 'admin'

  const load = useCallback(async () => {
    try {
      const [proj, tsks] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
      ])
      setProject(proj.data)
      setTasks(tsks.data)
    } catch { navigate('/projects') }
    finally { setLoading(false) }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  const saveTask = async (payload) => {
    if (taskModal === 'new') {
      const { data } = await api.post(`/projects/${id}/tasks`, payload)
      setTasks(t => [data, ...t])
    } else {
      const { data } = await api.put(`/projects/${id}/tasks/${taskModal.id}`, payload)
      setTasks(t => t.map(x => x.id === data.id ? data : x))
    }
  }

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    await api.delete(`/projects/${id}/tasks/${taskId}`)
    setTasks(t => t.filter(x => x.id !== taskId))
  }

  const deleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return
    setDeleting(true)
    await api.delete(`/projects/${id}`)
    navigate('/projects')
  }

  const removeMember = async (memberId) => {
    if (!confirm('Remove this member?')) return
    await api.delete(`/projects/${id}/members/${memberId}`)
    setProject(p => ({ ...p, members: p.members.filter(m => m.id !== memberId) }))
  }

  const filteredTasks = tasks.filter(t => {
    if (filter.status && t.status !== filter.status) return false
    if (filter.priority && t.priority !== filter.priority) return false
    return true
  })

  if (loading) return <div className="loading"><div className="spinner spin" /></div>

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link to="/projects" style={{ fontSize: 13, color: 'var(--text3)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
          ← Projects
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{project.name}</h1>
            {project.description && <p style={{ color: 'var(--text3)', fontSize: 14 }}>{project.description}</p>}
          </div>
          {isAdmin && (
            <button className="btn btn-danger btn-sm" onClick={deleteProject} disabled={deleting}>
              {deleting ? '…' : 'Delete Project'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[['tasks', `Tasks (${tasks.length})`], ['members', `Members (${project.members.length})`]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', fontSize: 14, fontWeight: 500,
            background: 'none', color: tab === t ? 'var(--text)' : 'var(--text3)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            borderRadius: 0, marginBottom: -1, transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <select className="input" style={{ width: 'auto', minWidth: 140 }} value={filter.status}
              onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <select className="input" style={{ width: 'auto', minWidth: 140 }} value={filter.priority}
              onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setTaskModal('new')}>
              + Add Task
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card empty">
              <div className="empty-icon">📋</div>
              <div>{tasks.length === 0 ? 'No tasks yet. Add your first task!' : 'No tasks match your filters.'}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredTasks.map(task => (
                <div key={task.id} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                      background: { low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--orange)', critical: 'var(--red)' }[task.priority],
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{task.title}</span>
                        <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      </div>
                      {task.description && <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>{task.description}</p>}
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap' }}>
                        {task.assignee && <span>👤 {task.assignee.name}</span>}
                        {task.due_date && (
                          <span style={{ color: isPast(new Date(task.due_date)) && task.status !== 'done' ? 'var(--red)' : 'inherit' }}>
                            📅 {format(new Date(task.due_date), 'MMM d, yyyy')}
                          </span>
                        )}
                        <span>by {task.creator.name}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setTaskModal(task)} title="Edit">✏</button>
                      {(isAdmin || task.creator_id === user.id) && (
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteTask(task.id)} title="Delete">🗑</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {tab === 'members' && (
        <div>
          {isAdmin && (
            <div style={{ marginBottom: 16 }}>
              <button className="btn btn-primary" onClick={() => setInviteModal(true)}>+ Invite Member</button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {project.members.map(member => (
              <div key={member.id} className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, flexShrink: 0,
                }}>
                  {member.user.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{member.user.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{member.user.email}</div>
                </div>
                <span className={`badge badge-${member.role}`}>{member.role}</span>
                {isAdmin && member.user_id !== user.id && (
                  <button className="btn btn-danger btn-sm" onClick={() => removeMember(member.id)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {taskModal && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          members={project.members}
          currentUserId={user.id}
          myRole={myRole}
          onClose={() => setTaskModal(null)}
          onSave={saveTask}
        />
      )}
      {inviteModal && (
        <InviteModal
          projectId={id}
          onClose={() => setInviteModal(false)}
          onInvited={(m) => setProject(p => ({ ...p, members: [...p.members, m] }))}
        />
      )}
    </div>
  )
}
