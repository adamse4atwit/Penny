// Portfolio allocation as a single horizontal stacked bar.
// Stocks are valued at live price when we have one, physical items at the
// middle of Penny's estimate range. Long tail folds into "Other" so we
// never need more colors than the palette actually has.

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import PieView from './PieView'
import { money, currentValue } from '../config/assetCategories'
import { CHART_PALETTE, SURFACE } from '../config/chartColors'

const MAX_SLICES = 7   // the 8th slot is held for "Other"

// Flattens a portfolio's stocks and physical items into one sorted list of
// { name, value }, folding everything past MAX_SLICES into a single row.
function buildAllocation( portfolio, prices )
{
  const rows = []

  // Keyed by ticker so two buys of the same stock land in one slice. Two
  // slices of IVV sitting next to each other in the ring reads as a bug, and
  // splitting the holding also hides how big the position really is.
  const byTicker = new Map()

  for ( const a of portfolio.assets )
    {
    // fall back to what they paid when the live price hasn't landed yet
    const price = prices[ a.ticker ] != null ? prices[ a.ticker ] : a.purchase_price
    byTicker.set( a.ticker, ( byTicker.get( a.ticker ) || 0 ) + price * a.shares )
  }
  for ( const [ ticker, value ] of byTicker ) {
    rows.push( { name: ticker, value } )
  }
  for ( const item of portfolio.physical_assets || [] ) {
    rows.push( { name: item.name, value: currentValue( item ) } )
  }

  const ranked = rows.filter( (r) => r.value > 0 ).sort( (a, b) => b.value - a.value )
  if ( ranked.length <= MAX_SLICES + 1 ) return ranked

  const head = ranked.slice( 0, MAX_SLICES )
  const tail = ranked.slice( MAX_SLICES )
  head.push( { name: `Other (${ tail.length })`, value: tail.reduce( (sum, r) => sum + r.value, 0 ) } )
  return head
}

// Per-segment hover card. Recharts hands us the dataKey ("s3"), which we turn back into an index into slices.
function AllocationTooltip( { active, payload, slices, total } )
{
  if ( !active || !payload || payload.length === 0 ) return null

  const slice = slices[ parseInt( payload[0].dataKey.slice( 1 ) ) ]
  if ( !slice ) return null

  return (
    <div className="bg-sand-50 border border-sand-300 rounded-lg shadow-md shadow-clay-800/10 px-3 py-2 text-xs">
      <p className="font-semibold text-ink-900">{ slice.name }</p>
      <p className="text-ink-500 font-mono">
        { money( slice.value ) } · { ( slice.value / total * 100 ).toFixed( 1 ) }%
      </p>
    </div>
  )
}

function AllocationChart( { portfolio, prices } )
{
  // Bar or pie, picked per card. Kept as plain state so each portfolio can be
  // shown whichever way suits it.
  const [ mode, setMode ] = useState( 'bar' )

  const slices = buildAllocation( portfolio, prices )
  const total = slices.reduce( (sum, s) => sum + s.value, 0 )

  // Nothing priced yet means there's no whole to take parts of.
  if ( slices.length === 0 || total <= 0 ) return null

  // Recharts stacks along one row, so the whole bar is a single datum
  // with one key per slice.
  const data = [ Object.fromEntries( slices.map( (s, i) => [ `s${i}`, s.value ] ) ) ]

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h3 className="text-xs text-ink-500 uppercase tracking-wide font-medium">Allocation</h3>

        <div className="flex items-center gap-3">
          <p className="text-xs text-ink-500">
            Total <span className="font-semibold text-ink-900">{ money( total ) }</span>
          </p>

          {/* Same shape either way, so this switches the drawing rather than
              adding a second chart. aria-pressed says which one is on, since
              the styling alone wouldn't reach a screen reader. */}
          <div className="flex rounded-lg bg-sand-200 p-0.5">
            { [ 'bar', 'pie' ].map( (option) => (
              <button
                key={ option }
                onClick={ () => setMode( option ) }
                aria-pressed={ mode === option }
                className={ `text-xs px-2 py-1 rounded-md capitalize transition-colors ${
                  mode === option
                    ? 'bg-sand-50 text-ink-900 font-medium shadow-sm shadow-clay-800/5'
                    : 'text-ink-500 hover:text-ink-900'
                }` }
              >{ option }
              </button>
            ) ) }
          </div>
        </div>
      </div>

      { mode === 'bar' ? (
        <ResponsiveContainer width="100%" height={ 44 }>
          <BarChart data={ data } layout="vertical" margin={ { top: 0, right: 0, bottom: 0, left: 0 } }>
            <XAxis type="number" hide domain={ [ 0, total ] } />
            <YAxis type="category" hide />
            <Tooltip
              shared={ false }
              cursor={ false }
              content={ <AllocationTooltip slices={ slices } total={ total } /> }
            />
            { slices.map( (s, i) => (
              <Bar
                key={ i }
                dataKey={ `s${i}` }
                stackId="allocation"
                fill={ CHART_PALETTE[ i ] }
                /* 2px of the card color between fills so neighbouring hues never touch */
                stroke={ SURFACE }
                strokeWidth={ 2 }
                /* only the two outer ends of the whole bar get rounded */
                radius={
                  i === 0 ? [ 6, 0, 0, 6 ]
                    : i === slices.length - 1 ? [ 0, 6, 6, 0 ]
                    : 0
                }
              />
            ) ) }
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <PieView slices={ slices } total={ total } size="max-w-60" />
      ) }

      {/* Legend doubles as the direct labels: three palette hues sit under
          3:1 on the card surface, so identity must never rest on color alone.
          Only for the bar, since PieView brings its own. */}
      { mode === 'bar' && (
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        { slices.map( (s, i) => (
          <div key={ i } className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={ { backgroundColor: CHART_PALETTE[ i ] } } />
            <span className="text-xs text-ink-700">{ s.name }</span>
            <span className="text-xs text-ink-500 font-mono">
              { ( s.value / total * 100 ).toFixed( 0 ) }%
            </span>
          </div>
        ) ) }
      </div>
      ) }
    </div>
  )
}
export default AllocationChart
