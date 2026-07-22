// Portfolio allocation as a single horizontal stacked bar.
// Stocks are valued at live price when we have one, physical items at the
// middle of Penny's estimate range. Long tail folds into "Other" so we
// never need more colors than the palette actually has.

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { money, currentValue } from '../config/assetCategories'

// Fixed slot order for the categorical palette. Assigned in order and never
// cycled: an extra series folds into "Other" instead, so a given holding keeps
// its color when the list changes.
//
// These hues are biased toward the warm half of the wheel so the bar belongs to
// the tan page rather than sitting on top of it, but they are still saturated
// enough to stay distinguishable. Validated against the card surface below:
// lightness band, chroma floor, colorblind separation (worst adjacent pair
// ΔE 10.0) and normal-vision separation (ΔE 20.9) all pass. Gold falls under
// 3:1 against the surface, which is why the legend direct-labels every slice
// instead of letting the swatch carry identity alone.
const PALETTE = [ '#B5601F', '#0E8F6F', '#D9A400', '#3F73CE', '#A8397A', '#6F9B14', '#6A4FD0', '#D1544A' ]
const MAX_SLICES = 7   // the 8th slot is held for "Other"

// The card color the chart is drawn on (--color-sand-50). Recharts needs a
// literal, so it can't read the CSS variable directly.
export const SURFACE = '#FDFBF7'

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
  const slices = buildAllocation( portfolio, prices )
  const total = slices.reduce( (sum, s) => sum + s.value, 0 )

  // Nothing priced yet means there's no whole to take parts of.
  if ( slices.length === 0 || total <= 0 ) return null

  // Recharts stacks along one row, so the whole bar is a single datum
  // with one key per slice.
  const data = [ Object.fromEntries( slices.map( (s, i) => [ `s${i}`, s.value ] ) ) ]

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-xs text-ink-500 uppercase tracking-wide font-medium">Allocation</h3>
        <p className="text-xs text-ink-500">
          Total <span className="font-semibold text-ink-900">{ money( total ) }</span>
        </p>
      </div>

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
              fill={ PALETTE[ i ] }
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

      {/* Legend doubles as the direct labels: three palette hues sit under
          3:1 on the card surface, so identity must never rest on color alone. */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        { slices.map( (s, i) => (
          <div key={ i } className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={ { backgroundColor: PALETTE[ i ] } } />
            <span className="text-xs text-ink-700">{ s.name }</span>
            <span className="text-xs text-ink-500 font-mono">
              { ( s.value / total * 100 ).toFixed( 0 ) }%
            </span>
          </div>
        ) ) }
      </div>
    </div>
  )
}
export default AllocationChart
