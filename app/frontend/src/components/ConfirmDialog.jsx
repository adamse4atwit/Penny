import { useEffect, useRef, useState } from 'react'

// A yes/no prompt for something that can't be taken back.
//
// Deliberately not window.confirm: that can't carry the "don't ask again"
// checkbox, it styles itself like the browser rather than like Penny, and it
// blocks the whole tab while it's up.
//
// The confirming action is passed the checkbox state rather than storing it
// here, because where that preference lives is the caller's business.
function ConfirmDialog( { title, body, confirmLabel, rememberLabel, onConfirm, onCancel } )
{
  const [remember, setRemember] = useState( false )
  const cancelRef = useRef( null )

  // Escape cancels, the same as clicking the backdrop. Focus starts on Cancel
  // rather than the destructive button so a stray Enter dismisses the dialog
  // instead of confirming the very thing it's warning about.
  useEffect( () => {
    cancelRef.current?.focus()

    function onKey( e )
    {
      if ( e.key === 'Escape' ) onCancel()
    }

    window.addEventListener( 'keydown', onKey )
    return () => window.removeEventListener( 'keydown', onKey )
  }, [ onCancel ] )

  return (
    <div
      onClick={ onCancel }
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4"
    >
      {/* Clicking the backdrop cancels, so clicks inside the dialog have to
          stop before they reach it. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={ ( e ) => e.stopPropagation() }
        className="animate-rise w-full max-w-md rounded-2xl border border-sand-300 bg-sand-50 p-5 shadow-lg shadow-clay-800/20"
      >
        <h2 id="confirm-title" className="font-semibold text-ink-900">{ title }</h2>
        <p className="text-sm text-ink-700 mt-1.5 leading-relaxed">{ body }</p>

        {/* .check / .check-tile are styled in index.css. The frame the tile
            wipes into is a span beside the input, not around it, because the
            CSS reaches it with a sibling selector. */}
        { rememberLabel && (
          <label className="flex items-center gap-2.5 mt-4 text-sm text-ink-500 cursor-pointer w-fit">
            <span className="check">
              <input
                type="checkbox"
                checked={ remember }
                onChange={ ( e ) => setRemember( e.target.checked ) }
              />
              <span className="check-tile" />
            </span>
            { rememberLabel }
          </label>
        ) }

        <div className="flex justify-end gap-2 mt-5">
          <button
            ref={ cancelRef }
            type="button"
            onClick={ onCancel }
            className="btn"
          >Cancel
          </button>
          {/* The destructive button is the only thing on the page wearing the
              loss color as a fill, so it reads as the weightier of the two. */}
          <button
            type="button"
            onClick={ () => onConfirm( remember ) }
            className="btn btn-destructive"
          >{ confirmLabel }
          </button>
        </div>
      </div>
    </div>
  )
}
export default ConfirmDialog
