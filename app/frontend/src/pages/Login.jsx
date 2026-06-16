import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

function Login() {
  const navigate = useNavigate()
  const [ email, setEmail ] = useState( '' )
  const [ password, setPassword ] = useState( '' )
  const [ error, setError ] = useState( '' ) 

  async function handleSubmit(e) 
  {
    e.preventDefault()
    setError( '' )
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
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">Sign in to Penny</h1>
        {error && <p className="text-red-500 text-sm mb-4"> {error} </p>}
        <form onSubmit={ handleSubmit } className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={ (e) => setEmail( e.target.value ) }
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={ (e) => setPassword( e.target.value ) }
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-300 text-white py-2 rounded font-medium hover:bg-blue-400"
          >Sign In
          </button>
        </form>
        <p className="text-sm mt-4 text-center">
          No account?{' '}
          <Link to="/register" className="text-blue-400 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
