import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white px-8 py-10 rounded-lg w-full max-w-md"> 

        {/* Logo */}
        <div className="flex flex-col items-center mb-8"> 
          <div className="w-25 h-12 bg-blue-900 rounded-2xl flex items-center justify-center mb-3"> 
            <span className="text-white text-xl font-bold">Penny</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign into Penny</h1>
          <p className="text-sm text-gray-500 mt-1 font-style: italic">Track your investments in one place!</p>
        </div>

        { error && ( 
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3 mb-5">
            {error}
            </div>
        ) }

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-800 hover:bg-blue-900 disabled:bg-blue-800 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm mt-6 text-center text-gray-500">
          No account?{' '}
          <Link to="/register" className="text-blue-900 font-medium hover:text-blue-800">Register here</Link>
        </p>
      </div>
    </div>
  )
}

export default Login