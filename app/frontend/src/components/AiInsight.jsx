// Penny's portfolio insight. The backend hands back structured fields instead of
// free text, so this lays them out directly and no raw markdown ever reaches the page.

import { CloseIcon, SparkIcon } from './icons'

function AiInsight( { insight, onClose } )
{
  const observations = insight.observations || []
  const suggestions = insight.suggestions || []

  return (
    <div className="animate-rise bg-sand-50 border border-sand-300 shadow-sm shadow-clay-800/5 rounded-2xl mb-6 overflow-hidden">

      {/* A clay header bar separates Penny's voice from the user's own data
          below it, without needing a differently-colored panel. */}
      <div className="flex justify-between items-center gap-4 bg-clay-700 px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-sand-50">
          <SparkIcon width={ 15 } height={ 15 } />
          Penny&apos;s AI Insight
        </h2>
        <button
          onClick={ onClose }
          aria-label="Dismiss insight"
          className="btn btn-sm btn-icon btn-dark shrink-0"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="px-5 py-4">

        <p className="text-[15px] leading-relaxed text-ink-900 font-medium mb-5">{ insight.headline }</p>

        { observations.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-ink-500 uppercase tracking-wide font-medium mb-2.5">What stands out</p>
            <div className="space-y-2">
              { observations.map( (o, i) => (
                <div key={ i } className="text-sm leading-relaxed">
                  <span className="font-semibold text-ink-900">{ o.label }</span>
                  <span className="text-ink-700"> — { o.detail }</span>
                </div>
              ) ) }
            </div>
          </div>
        ) }

        { suggestions.length > 0 && (
          <div>
            <p className="text-xs text-ink-500 uppercase tracking-wide font-medium mb-2.5">What you could do</p>
            <div className="space-y-2.5">
              { suggestions.map( (s, i) => (
                <div key={ i } className="flex gap-2.5 text-sm leading-relaxed">
                  {/* Numbered so the steps read in order without relying on list markers */}
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sand-200 text-xs font-semibold text-clay-700">
                    { i + 1 }
                  </span>
                  <span>
                    <span className="text-ink-900">{ s.action }</span>
                    <span className="text-ink-500"> { s.why }</span>
                  </span>
                </div>
              ) ) }
            </div>
          </div>
        ) }

      </div>
    </div>
  )
}
export default AiInsight
