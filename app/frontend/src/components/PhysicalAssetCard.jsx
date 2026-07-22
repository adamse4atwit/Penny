import { useState } from 'react'
import { categoryInfo, money } from '../config/assetCategories'
import { TrashIcon } from './icons'

function PhysicalAssetCard( { item, estimating, onEstimate, onDelete } )
{
  const [showWhy, setShowWhy] = useState( false )
  const info = categoryInfo( item.category )
  const Icon = info.icon

  const estimated = item.est_low != null && item.est_high != null
  const mid = estimated ? ( item.est_low + item.est_high ) / 2 : null
  const delta = estimated ? mid - item.initial_value : null

  // subtitle line: "Toyota Camry · 2015 · Good"
  const subtitle = [ item.make, item.model, item.year_made, item.condition ].filter( Boolean ).join( ' · ' )

  return (
    <div className="group sheen rounded-2xl border border-sand-200 bg-sand-50 p-5 shadow-sm shadow-clay-800/5 hover:shadow-md hover:shadow-clay-800/10 hover:border-sand-400 hover:-translate-y-0.5 transition-all duration-200">

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sand-200 text-clay-700">
          <Icon className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-ink-900 truncate">{ item.name }</p>
              { subtitle && <p className="text-xs text-ink-500 mt-0.5 truncate">{ subtitle }</p> }
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={ `text-xs font-medium rounded-full px-2.5 py-2 ${info.badge}` }>{ info.label }</span>
              {/* Fades in on hover so a wall of cards isn't a wall of delete
                  buttons, but stays reachable by keyboard via focus. */}
              <button
                onClick={ () => onDelete( item.id ) }
                aria-label={ `Delete ${item.name}` }
                className="btn btn-sm btn-icon btn-ghost btn-danger opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <TrashIcon width={ 14 } height={ 14 } />
              </button>
            </div>
          </div>

          {/* The category specific details, read as one sentence:
              "Mileage 60000, Trim SE, Drivetrain FWD, Accidents None." The
              label stays a shade lighter than its value so the pairs are still
              tellable apart without a box around each one. */}
          { Object.keys( item.specs || {} ).length > 0 && (
            <p className="text-xs text-ink-700 mt-2 leading-relaxed font-style: italic">
              { Object.entries( item.specs ).map( ( [ key, value ], index, all ) => (
                <span key={ key }>
                  <span className="text-ink-500 capitalize">{ key.replace( /_/g, ' ' ) }</span>{' '}
                  {/* A multi-select spec is a list. Joined with a dot rather
                      than a comma so its own entries don't read as more
                      spec pairs in the sentence around it. */}
                  { Array.isArray( value ) ? value.join( ' · ' ) : value }
                  { index < all.length - 1 ? ', ' : '.' } 
                </span>
              ) ) }
            </p>
          ) }
        </div>
      </div>

      {/* Value row */}
      <div className="mt-4 pt-4 border-t border-sand-300 flex items-end justify-between gap-3">
        <div>
          { estimated ? (
            <>
              <p className="text-xs text-ink-500 uppercase tracking-wide font-medium">Estimated value</p>
              <p className="text-xl font-semibold text-ink-900 mt-0.5">
                { money( item.est_low ) } <span className="text-ink-400 font-normal">–</span> { money( item.est_high ) }
              </p>
              <p className="text-xs text-ink-500 mt-1">
                Paid { money( item.initial_value ) } in { item.purchase_year } ·{' '}
                <span className={ delta >= 0 ? 'text-gain font-medium' : 'text-loss font-medium' }>
                  { delta >= 0 ? '+' : '−' }{ money( Math.abs( delta ) ) }
                </span>
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-ink-500 uppercase tracking-wide font-medium">Paid</p>
              <p className="text-xl font-semibold text-ink-900 mt-0.5">{ money( item.initial_value ) }</p>
              <p className="text-xs text-ink-500 mt-1">Not estimated yet</p>
            </>
          ) }
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={ () => onEstimate( item.id ) }
            disabled={ estimating }
            className="btn btn-sm"
          >{ estimating ? 'Estimating…' : estimated ? 'Re-estimate' : 'Estimate value' }</button>
          { item.est_summary && (
            <button onClick={ () => setShowWhy( !showWhy ) } className="text-xs text-ink-500 hover:text-ink-900 transition-colors">
              { showWhy ? 'Hide' : 'Why this number?' }
            </button>
          ) }
        </div>
      </div>

      { showWhy && item.est_summary && (
        <div className="animate-rise bg-sand-200/60 border border-sand-300 rounded-xl px-4 py-3 mt-3">
          <p className="text-xs font-semibold text-clay-700 mb-1">Penny&apos;s take</p>
          <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line">{ item.est_summary }</p>
        </div>
      ) }

    </div>
  )
}
export default PhysicalAssetCard
