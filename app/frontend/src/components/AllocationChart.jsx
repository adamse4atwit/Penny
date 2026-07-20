// Portfolio allocation as a single horizontal stacked bar.
// Stocks are valued at live price when we have one, physical items at the
// middle of Penny's estimate range. Long tail folds into "Other" so we
// never need more colors than the palette actually has.

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { money, currentValue } from '../config/assetCategories'

// Fixed slot order from the validated categorical palette. Assigned in
// order and never cycled. an extra series folds into "Other" instead.
const PALETTE = [ '#2a78d6', '#008300', '#e87ba4', '#eda100', '#1baf7a', '#eb6834', '#4a3aa7', '#e34948' ]
const MAX_SLICES = 7   // the 8th slot is held for "Other"

// Flattens a portfolio's stocks and physical items into one sorted list of
// { name, value }, folding everything past MAX_SLICES into a single row.
function buildAllocation( portfolio, prices )
{
  const rows = []

  for ( const a of portfolio.assets ) 
    {
    // fall back to what they paid when the live price hasn't landed yet
    const price = prices[ a.ticker ] != null ? prices[ a.ticker ] : a.purchase_price
    rows.push( { name: a.ticker, value: price * a.shares } )
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-gray-900">{ slice.name }</p>
      <p className="text-gray-600 font-mono">
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
        <h3 className="text-xs text-gray-500 uppercase tracking-wide font-medium">Allocation</h3>
        <p className="text-xs text-gray-500">
          Total <span className="font-semibold text-gray-900">{ money( total ) }</span>
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
              /* 2px of white between fills so neighbouring hues never touch */
              stroke="#ffffff"
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
          3:1 on white, so identity must never rest on color alone. */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        { slices.map( (s, i) => (
          <div key={ i } className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={ { backgroundColor: PALETTE[ i ] } } />
            <span className="text-xs text-gray-600">{ s.name }</span>
            <span className="text-xs text-gray-400 font-mono">
              { ( s.value / total * 100 ).toFixed( 0 ) }%
            </span>
          </div>
        ) ) }
      </div>
    </div>
  )
}
export default AllocationChart
