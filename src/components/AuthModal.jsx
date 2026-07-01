import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function AuthModal({ onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let result
      if (mode === 'signin') {
        result = await supabase.auth.signInWithPassword({ email, password })
      } else {
        result = await supabase.auth.signUp({ email, password })
      }
      if (result.error) {
        setError(result.error.message)
      } else {
        onAuthSuccess()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box auth-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-content">
          <div className="modal-eyebrow">
            {mode === 'signin' ? '— Welcome Back —' : '— Join Us —'}
          </div>
          <h2 className="modal-title">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>

          <div className="tab-bar" style={{ marginBottom: 20 }}>
            <button
              type="button"
              className={`tab-btn ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => { setMode('signin'); setError('') }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError('') }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            {error && <div className="form-error">{error}</div>}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: 'var(--denim-light)' }}>
            <span style={{ cursor: 'default' }}>Forgot password?</span>
          </p>
        </div>
      </div>
    </div>
  )
}
