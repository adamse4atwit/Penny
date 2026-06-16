import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

function Register() 
{
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) 
  {
    e.preventDefault()
    setError('')
    try {
      await api.post( '/auth/register', { email, password, full_name: fullName } )
      navigate( '/login' )
    } catch ( err ) {
      setError( err.response?.data?.detail || 'Registration failed.' )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8"> 
          <div className="w-25 h-12 bg-blue-900 rounded-2xl flex items-center justify-center mb-3"> 
            <span className="text-white text-xl font-bold">Penny</span>
          </div>
          <p className="text-sm text-gray-500 mt-1 font-style: italic">Track your investments in one place!</p>
        </div>
        
        <h1 className="text-2xl font-bold mb-6 px-10">Create your account</h1>
        { error && <p className="text-red-800 text-sm mb-4">{ error }</p> }
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={ (e) => setFullName( e.target.value ) }
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
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
              onChange={ (e) => setPassword(e.target.value ) }
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-900 text-white py-2 rounded font-medium hover:bg-blue-800"
          >
            Register
          </button>
        </form>
        <p className="text-sm mt-4 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-800 hover:text-blue-900">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
