import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { apiClient } from '../../api/client'

export default function AuthDialog() {
  const dialog = useStore((s) => s.dialog)
  const closeDialog = useStore((s) => s.closeDialog)

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isOpen = dialog === 'auth'

  function resetForm() {
    setEmail('')
    setPassword('')
    setError('')
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await apiClient.login(email, password)
      } else {
        await apiClient.signup(email, password)
        // Auto-login after signup
        await apiClient.login(email, password)
      }
      closeDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && closeDialog()}>
      <div className="dialog-panel" style={{ maxWidth: 400 }}>
        <h2 className="font-display text-xl font-bold text-white mb-6">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="field-label">Email</label>
            <input
              className="input-base"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="field-label">Password</label>
            <input
              className="input-base"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
            {!isLogin && (
              <p className="text-[10px] opacity-50">Minimum 8 characters</p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-300"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary py-2.5"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          <div className="text-center">
            <button
              type="button"
              className="text-xs text-white/50 hover:text-white/80 transition-colors"
              onClick={() => {
                setIsLogin(!isLogin)
                resetForm()
              }}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
              onClick={closeDialog}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
