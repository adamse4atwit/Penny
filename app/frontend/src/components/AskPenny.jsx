import { useEffect, useRef } from 'react'
import { SparkIcon, CloseIcon } from './icons'
import Logo from './Logo'

// Penny's tab on the left edge of the dashboard, and the panel it opens.
//
// Both live in here rather than the tab sitting in Dashboard and the panel
// being a separate dialog, because they're two states of one control and
// keeping them together means the open/closed rule is written once.
//
// The tab steps aside while the panel is up. The panel opens in its place, at
// the same edge and the same height, so the tab isn't left sitting underneath
// its own popup.
//
// The risk and goal values live in Dashboard rather than here, so closing the
// panel doesn't throw away what was typed into it.
// working progress. 

function AskPenny( {
  open, onOpen, onClose,
  riskTolerance, onRiskChange,
  financialGoal, onGoalChange,
  loading, onSubmit,
} )
{
  const closeRef = useRef( null )

  // Focus moves into the panel on open so it can be dismissed without reaching
  // for the mouse. Only when open flips, nothing else: Dashboard builds a new
  // onClose every render, so having it in here too meant every letter typed
  // into the goal field re-ran this and pulled focus back onto the X.
  useEffect( () => {
    if ( !open ) return
    closeRef.current?.focus()
  }, [ open ] )

  // Escape closes, the same as clicking the backdrop. Kept apart from the
  // focus above so it can still track onClose without dragging focus with it.
  useEffect( () => {
    if ( !open ) return

    function onKey( e )
    {
      if ( e.key === 'Escape' ) onClose() //esc closing
    }

    window.addEventListener( 'keydown', onKey )
    return () => window.removeEventListener( 'keydown', onKey )
  }, [ open, onClose ] )

  // Same field styling the dashboard forms use, so the inputs stay identical.
  const inputClass = "field text-sm"

  return (
    <>
      {/* Fixed to the viewport so Penny stays reachable however far the
          portfolio list has scrolled, and centered vertically so she never
          runs into the navbar or the footer. */}
      { !open && (
        <button
          onClick={ onOpen }
          aria-label="Ask Penny"
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 h-14 rounded-r-2xl bg-clay-700 text-sand-50 pl-3 pr-4 shadow-lg shadow-clay-800/20 hover:bg-clay-800 transition-colors"
        >
          <Logo tone="dark" size="sm" variant="mark" />
          {/* The coin says it on its own once the screen is narrow enough that
              the words would eat into the cards beside them. */}
          <span className="hidden sm:inline text-sm font-medium">Ask Penny</span>
        </button>
      ) }

      { open && (
        <div
          onClick={ onClose }
          className="animate-fade fixed inset-0 z-50 flex items-center justify-start bg-ink-900/40 p-4"
        >
          {/* Held against the left edge, where the tab that opened it was,
              rather than centered in the window: the eye is already over there.

              Clicking the backdrop closes, so clicks inside the panel have to
              stop before they reach it. */}
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="ask-penny-title"
            onClick={ ( e ) => e.stopPropagation() }
            onSubmit={ ( e ) => { e.preventDefault(); onSubmit() } }
            className="animate-swing origin-left w-120 max-w-full max-h-full overflow-y-auto rounded-2xl border border-sand-300 bg-sand-50 shadow-lg shadow-clay-800/20"
          >

            {/* The same clay the tab wears, and the same h-14, so the panel
                opens looking like the tab did rather than like something else
                that happened to arrive. */}
            <div className="flex justify-between items-center gap-4 h-14 bg-clay-700 px-6">
              <h2 id="ask-penny-title" className="text-sm font-semibold text-sand-50">
                What are you working toward?
              </h2>
              <button
                ref={ closeRef }
                type="button"
                onClick={ onClose }
                aria-label="Close"
                className="btn btn-sm btn-icon btn-dark shrink-0"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="px-6 py-5">

              {/* Both blank still works, it just gives more general advice. */}
              <p className="text-sm text-ink-500 leading-relaxed mb-5">
                Either one can be left blank, you&apos;ll just get more general advice.
              </p>

              <label htmlFor="ask-penny-risk" className="block text-xs text-ink-500 uppercase tracking-wide font-medium mb-1.5">
                Risk tolerance
              </label>
              <select
                id="ask-penny-risk"
                value={ riskTolerance }
                onChange={ ( e ) => onRiskChange( e.target.value ) }
                className={ `${inputClass} w-full mb-5` }
              >
                <option value="">No preference</option>
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>

              <label htmlFor="ask-penny-goal" className="block text-xs text-ink-500 uppercase tracking-wide font-medium mb-1.5">
                Goal
              </label>
              <input
                id="ask-penny-goal"
                type="text"
                placeholder="i.e. buy a house in 5 years"
                value={ financialGoal }
                onChange={ ( e ) => onGoalChange( e.target.value ) }
                className={ `${inputClass} w-full` }
              />

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={ onClose }
                  className="btn"
                >Cancel
                </button>
                <button
                  type="submit"
                  disabled={ loading }
                  className="btn btn-primary"
                >
                  <SparkIcon width={ 15 } height={ 15 } />
                  { loading ? 'Thinking…' : 'AI Insight' }
                </button>
              </div>

            </div>
          </form>
        </div>
      ) }
    </>
  )
}
export default AskPenny
