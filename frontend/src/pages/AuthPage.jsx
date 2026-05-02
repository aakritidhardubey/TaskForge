import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage({ mode = 'login' }) {
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isLogin = mode === 'login'

  const handle = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (isLogin) await login(form.email, form.password)
      else await signup(form.name, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(124,106,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(168,85,247,0.06) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: 'var(--accent)', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 16px',
            boxShadow: '0 0 40px rgba(124,106,255,0.4)',
          }}>⚡</div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800 }}>TaskForge</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 6 }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {!isLogin && (
              <div className="form-group">
                <label className="label">Full Name</label>
                <input
                  className="input"
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder={isLogin ? '••••••••' : 'Min. 6 characters'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            {error && <div className="error-msg" style={{ background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              {loading ? <span className="spinner spin" style={{ width: 18, height: 18 }} /> : null}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text3)' }}>
            {isLogin ? (
              <>Don't have an account?{' '}<Link to="/signup" style={{ color: 'var(--accent)' }}>Sign up</Link></>
            ) : (
              <>Already have an account?{' '}<Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
