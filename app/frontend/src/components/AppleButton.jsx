import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { AppleIcon } from './icons'

// Sign in with Apple. Unlike Google, Apple's SDK doesn't render a button for us
// It only exposes signIn(), so the markup below is ours, styled to Apple's
// guidelines (black pill, logo left of the label) while matching our own inputs.
function AppleButton({ onError })
{
  const navigate = useNavigate()
  const [ ready, setReady ] = useState( false )

  useEffect( () => {
    let cancelled = false

    // The SDK script is async, so poll for it the same way GoogleButton does.
    function init()
    {
      if ( cancelled ) return
      if ( !window.AppleID?.auth )
      {
        setTimeout( init, 100 )
        return
      }

      window.AppleID.auth.init( {
        clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
        scope: 'name email',
        // Apple requires a registered redirect URI even in popup mode, where it
        // is never actually navigated to. The origin is what we register.
        redirectURI: window.location.origin,
        usePopup: true, //keeps the user on our page instead of a full redirect
      } )
      setReady( true )
    }

    init()
    return () => { cancelled = true } //stops the poll if the page unmounts first
  }, [] )

  async function handleClick()
  {
    try
    {
      const res = await window.AppleID.auth.signIn()

      // Apple only sends the name on the very first authorization, and it comes
      // back beside the token rather than inside it. Pass it along so new
      // accounts get a full_name; returning users just send undefined.
      const name = res.user?.name
      const fullName = name ? `${ name.firstName ?? '' } ${ name.lastName ?? '' }`.trim() : null

      const auth = await api.post( '/auth/apple', {
        identity_token: res.authorization.id_token,
        full_name: fullName || null,
      } )
      localStorage.setItem( 'token', auth.data.access_token ) //same key the password login uses
      navigate( '/dashboard' )
    } catch ( err ) {
      // Closing the popup rejects too, and that isn't worth an error message.
      if ( err?.error === 'popup_closed_by_user' ) return
      onError?.( 'Apple sign-in failed. Please try again.' )
    }
  }

  return (
    <button
      type="button"
      onClick={ handleClick }
      disabled={ !ready }
      className="w-full flex items-center justify-center gap-2 bg-ink-900 hover:bg-ink-700 disabled:opacity-60 text-sand-50 py-2.5 rounded-full font-medium text-sm transition-colors"
    >
      <AppleIcon />
      Continue with Apple
    </button>
  )
}

export default AppleButton
