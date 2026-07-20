// Penny's portfolio insight. The backend hands back structured fields instead of
// free text, so this lays them out directly and no raw markdown ever reaches the page.

function AiInsight( { insight, onClose } )
{
  const observations = insight.observations || []
  const suggestions = insight.suggestions || []

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-6">

      <div className="flex justify-between items-start gap-4 mb-3">
        <h2 className="text-sm font-semibold text-blue-900 italic">Penny's AI Insight</h2>
        <button onClick={ onClose } className="text-blue-400 text-sm hover:text-blue-600 shrink-0">x</button>
      </div>

      <p className="text-sm text-gray-800 font-medium mb-4">{ insight.headline }</p>

      { observations.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">What stands out</p>
          <div className="space-y-2">
            { observations.map( (o, i) => (
              <div key={ i } className="text-sm">
                <span className="font-semibold text-gray-900">{ o.label }</span>
                <span className="text-gray-700"> — { o.detail }</span>
              </div>
            ) ) }
          </div>
        </div>
      ) }

      { suggestions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">What you could do</p>
          <div className="space-y-2">
            { suggestions.map( (s, i) => (
              <div key={ i } className="flex gap-2 text-sm">
                {/* Numbered so the steps read in order without relying on list markers */}
                <span className="text-blue-900 font-semibold shrink-0">{ i + 1 }.</span>
                <span>
                  <span className="text-gray-900">{ s.action }</span>
                  <span className="text-gray-600"> { s.why }</span>
                </span>
              </div>
            ) ) }
          </div>
        </div>
      ) }

    </div>
  )
}
export default AiInsight
