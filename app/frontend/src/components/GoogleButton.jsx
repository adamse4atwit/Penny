import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

// Renders Google's own sign-in button and exchanges the credential it returns
// for one of our JWTs. Shared by Login and Register. Google makes no
// distinction between the two, the backend creates the account if it's new.
function GoogleButton({ onError })
{
  const navigate = useNavigate()
  const divRef = useRef( null )

  useEffect( () => {
    let cancelled = false

    async function handleCredential( response )
    {
      try
      {
        const res = await api.post( '/auth/google', { credential: response.credential } )
        localStorage.setItem( 'token', res.data.access_token ) //same key the password login uses
        navigate( '/dashboard' )
      } catch {
        onError?.( 'Google sign-in failed. Please try again.' )
      }
    }

    // The GIS script is async, so window.google may not exist yet on first render.
    // Poll briefly instead of guessing at a load order.
    function init()
    {
      if ( cancelled ) return
      if ( !window.google?.accounts?.id )
      {
        setTimeout( init, 100 )
        return
      }

      window.google.accounts.id.initialize( {
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredential,
      } )

      window.google.accounts.id.renderButton( divRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 340, //matches the max-w-md card so the button doesn't sit narrow
      } )
    }

    init()
    return () => { cancelled = true } //stops the poll if the page unmounts first
  }, [ navigate, onError ] )

  return <div ref={ divRef } className="flex justify-center" />
}

export default GoogleButton
