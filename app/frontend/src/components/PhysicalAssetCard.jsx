import { useState } from 'react'
import { categoryInfo, money } from '../config/assetCategories'

function PhysicalAssetCard( { item, estimating, onEstimate, onDelete } ) 
{
  const [showWhy, setShowWhy] = useState( false )
  const info = categoryInfo( item.category )

  const estimated = item.est_low != null && item.est_high != null
  const mid = estimated ? ( item.est_low + item.est_high ) / 2 : null
  const delta = estimated ? mid - item.initial_value : null

  // subtitle line: "Toyota Camry · 2015 · Good"
  const subtitle = [ item.make, item.model, item.year_made, item.condition ].filter( Boolean ).join( ' · ' )

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-2xl ring-1 ring-gray-100">
          { info.icon }
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{ item.name }</p>
              { subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{ subtitle }</p> }
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={ `text-xs font-medium rounded-full px-2.5 py-0.5 ring-1 ${info.badge}` }>{ info.label }</span>
              <button
                onClick={ () => onDelete( item.id ) }
                className="text-xs text-gray-400 hover:text-red-600 rounded-md px-1.5 py-0.5 hover:bg-red-50"
              >x</button>
            </div>
          </div>

          {/* The category specific details, as little chips */}
          { Object.keys( item.specs || {} ).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              { Object.entries( item.specs ).map( ( [ key, value ] ) => (
                <span key={ key } className="text-xs text-gray-600 bg-gray-50 rounded-md px-2 py-0.5 border border-gray-100">
                  <span className="text-gray-400 capitalize">{ key.replace( /_/g, ' ' ) }</span> { value }
                </span>
              ) ) }
            </div>
          ) }
        </div>
      </div>

      {/* Value row */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-end justify-between gap-3">
        <div>
          { estimated ? (
            <>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Estimated value</p>
              <p className="text-xl font-semibold text-gray-900 mt-0.5">
                { money( item.est_low ) } <span className="text-gray-300 font-normal">–</span> { money( item.est_high ) }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Paid { money( item.initial_value ) } in { item.purchase_year } ·{' '}
                <span className={ delta >= 0 ? 'text-green-700 font-medium' : 'text-red-700 font-medium' }>
                  { delta >= 0 ? '+' : '−' }{ money( Math.abs( delta ) ) }
                </span>
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Paid</p>
              <p className="text-xl font-semibold text-gray-900 mt-0.5">{ money( item.initial_value ) }</p>
              <p className="text-xs text-gray-400 mt-1">Not estimated yet</p>
            </>
          ) }
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={ () => onEstimate( item.id ) }
            disabled={ estimating }
            className="text-xs text-blue-900 font-medium rounded-lg bg-blue-50 px-3 py-1.5 hover:bg-blue-100 disabled:opacity-50 whitespace-nowrap"
          >{ estimating ? 'Estimating…' : estimated ? 'Re-estimate' : 'Estimate value' }</button>
          { item.est_summary && (
            <button onClick={ () => setShowWhy( !showWhy ) } className="text-xs text-gray-400 hover:text-gray-600">
              { showWhy ? 'Hide' : 'Why?' }
            </button>
          ) }
        </div>
      </div>

      { showWhy && item.est_summary && (
        <div className="bg-blue-50 rounded-xl px-4 py-3 mt-3">
          <p className="text-xs font-semibold text-blue-900 mb-1 italic">Penny's take</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{ item.est_summary }</p>
        </div>
      ) }

    </div>
  )
}
export default PhysicalAssetCard
