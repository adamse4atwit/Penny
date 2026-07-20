import { Navigate } from 'react-router-dom'

// Gate for pages that need a login. Without this, going straight to /dashboard
// renders the whole page first and only bounces once the API call comes back 401,
// which flashes an empty dashboard at someone who isn't signed in.
function RequireAuth( { children } )
{
  const token = localStorage.getItem( 'token' )
  if ( !token ) return <Navigate to="/login" replace />
  return children
}
export default RequireAuth
