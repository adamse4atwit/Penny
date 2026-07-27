import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Logo from '../components/Logo'
import GoogleButton from '../components/GoogleButton'

function Login()
{
  const navigate = useNavigate()
  const [ email, setEmail ] = useState( '' )
  const [ password, setPassword ] = useState( '' )
  const [ error, setError ] = useState( '' )
  const [ loading, setLoading ] = useState( false )

  async function handleSubmit(e)
  {
    e.preventDefault()
    setError( '' )
    setLoading( true )
    try
    {
      const form = new URLSearchParams()
      form.append( 'username', email ) //username = email
      form.append( 'password', password ) //password = password
      const res = await api.post( '/auth/login', form ) //redirection
      localStorage.setItem( 'token', res.data.access_token ) //stores login auth token
      navigate( '/dashboard' ) //redirection
    } catch {
      setError( 'Invalid email or password.' )
    } finally {
      setLoading( false )
    }
  }

  // Shared by both fields so the two inputs can't drift apart visually.
  const inputClass = "w-full bg-sand-50 border border-sand-300 rounded-xl px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors hover:border-sand-400 focus:border-clay-600"

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-100 px-4 py-10">
      <div className="w-full max-w-md">

        <div className="flex flex-col items-center mb-7">
          <Logo size="lg" />
          <h1 className="text-2xl font-bold text-ink-900 mt-5">Welcome back</h1>
          <p className="text-sm text-ink-500 mt-1.5">Track your investments in one place.</p>
        </div>

        {/* The card is raised off the tan page with a soft shadow rather than a
            heavy border, which keeps the whole screen feeling light. */}
        <div className="bg-sand-50 shadow-sm shadow-clay-800/5 px-7 py-8 rounded-2xl">

          { error && (
            <div
              role="alert"
              className="animate-rise bg-loss/10 text-loss text-sm rounded-xl px-4 py-3 mb-5"
            >
              { error }
            </div>
          ) }

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={ inputClass }
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-700 mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={ inputClass }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider between the two sign-in paths. The line is drawn with a
              border on each side so the label sits in a gap rather than on top. */}
          <div className="flex items-center gap-3 my-6">
            <span className="flex-1 border-t border-sand-300" />
            <span className="text-xs text-ink-400">or</span>
            <span className="flex-1 border-t border-sand-300" />
          </div>

          {/* Google writes the same token to the same key the password form
              does, so the rest of the app can't tell the two paths apart. */}
          <GoogleButton onError={ setError } />

        </div>

        <p className="text-sm mt-6 text-center text-ink-500">
          No account?{' '}
          <Link to="/register" className="text-clay-700 font-medium underline underline-offset-2 decoration-clay-500/40 hover:decoration-clay-700 transition-colors">
            Register here
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Login
