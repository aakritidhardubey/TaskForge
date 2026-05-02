import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { format, isPast } from 'date-fns'

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'In Review', done: 'Done' }
const STATUS_COLORS = { todo: 'var(--text2)', in_progress: 'var(--blue)', review: 'var(--accent2)', done: 'var(--green)' }
const PRIORITY_COLORS = { low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--orange)', critical: 'var(--red)' }

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner spin" /></div>

  const statCards = [
    { label: 'Projects', value: stats.total_projects, color: 'var(--accent)' },
    { label: 'Total Tasks', value: stats.total_tasks, color: 'var(--blue)' },
    { label: 'My Tasks', value: stats.my_assigned_tasks, color: 'var(--accent2)' },
    { label: 'Overdue', value: stats.overdue_tasks, color: 'var(--red)' },
  ]

  return (
    <div className="page">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text3)' }}>Here's what's happening across your projects.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Task Status Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Task Status</h3>
          {Object.entries(stats.tasks_by_status).map(([status, count]) => (
            <div key={status} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{STATUS_LABELS[status]}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{count}</span>
              </div>
              <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 4 }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  background: STATUS_COLORS[status],
                  width: `${stats.total_tasks ? (count / stats.total_tasks) * 100 : 0}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/projects/new" className="btn btn-primary" style={{ justifyContent: 'center' }}>
              + New Project
            </Link>
            <Link to="/projects" className="btn btn-ghost" style={{ justifyContent: 'center' }}>
              View All Projects →
            </Link>
          </div>

          {stats.overdue_tasks > 0 && (
            <div style={{
              marginTop: 16, padding: '12px 14px', borderRadius: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <div style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>
                ⚠ {stats.overdue_tasks} overdue task{stats.overdue_tasks > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Review and update their status</div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recent Tasks</h3>
        {stats.recent_tasks.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <div>No tasks yet. Create a project and add tasks.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {stats.recent_tasks.map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: PRIORITY_COLORS[task.priority],
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {task.due_date ? (
                      <span style={{ color: isPast(new Date(task.due_date)) && task.status !== 'done' ? 'var(--red)' : 'var(--text3)' }}>
                        Due {format(new Date(task.due_date), 'MMM d')}
                      </span>
                    ) : 'No due date'}
                  </div>
                </div>
                <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
