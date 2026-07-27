import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Logo from '../components/Logo'
import GoogleButton from '../components/GoogleButton'

function Register()
{
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState( false )

  async function handleSubmit(e)
  {
    e.preventDefault()
    setError('')
    setLoading( true )
    try {
      await api.post( '/auth/register', { email, password, full_name: fullName } )
      navigate( '/login' )
    } catch ( err ) {
      setError( err.response?.data?.detail || 'Registration failed.' )
    } finally {
      // Without this the button stayed stuck on "Creating…" after a failure.
      setLoading( false )
    }
  }

  const inputClass = "w-full bg-sand-50 border border-sand-300 rounded-xl px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors hover:border-sand-400 focus:border-clay-600"
  const labelClass = "block text-sm font-medium text-ink-700 mb-1.5"

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-100 px-4 py-10">
      <div className="w-full max-w-md">

        <div className="flex flex-col items-center mb-7">
          <Logo size="lg" />
          <h1 className="text-2xl font-bold text-ink-900 mt-5">Create your account</h1>
          <p className="text-sm text-ink-500 mt-1.5">Track your investments in one place.</p>
        </div>

        <div className="bg-sand-50 border border-sand-300 shadow-sm shadow-clay-800/5 px-7 py-8 rounded-2xl">

          { error && (
            <div
              role="alert"
              className="animate-rise bg-loss/10 text-loss text-sm rounded-xl px-4 py-3 mb-5"
            >
              { error }
            </div>
          ) }

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className={ labelClass }>Full Name</label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Penny"
                value={fullName}
                onChange={ (e) => setFullName( e.target.value ) }
                className={ inputClass }
              />
            </div>
            <div>
              <label htmlFor="email" className={ labelClass }>Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={ (e) => setEmail( e.target.value ) }
                className={ inputClass }
              />
            </div>
            <div>
              <label htmlFor="password" className={ labelClass }>Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={ (e) => setPassword(e.target.value ) }
                className={ inputClass }
              />
            </div>
            <button
              type="submit"
              disabled={ loading }
              className="btn btn-primary w-full"
            >
              { loading ? 'Creating…' : 'Register' }
            </button>
          </form>

          {/* Divider between the two sign-up paths. The line is drawn with a
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
          Already have an account?{' '}
          <Link to="/login" className="text-clay-700 font-medium underline underline-offset-2 decoration-clay-500/40 hover:decoration-clay-700 transition-colors">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Register
