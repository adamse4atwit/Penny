// Donut of net worth split by portfolio. The AllocationChart on each card
// shows what's inside one portfolio, this shows how the whole account divides.

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { SURFACE } from './AllocationChart'
import { money, currentValue } from '../config/assetCategories'


// One hue, dark to light, built off the clay accent. The allocation bar uses
// eight different hues because its slices are unrelated things, but portfolios
// are all the same kind of thing, so they read better as shades of one color.
//
// Steps are about 8 points of lightness apart, which is enough to tell any two
// neighbours apart. Since slices are sorted biggest first, the ramp also ends
// up shading the pie from largest to smallest.
const PIE_PALETTE = [ '#15291d', '#274b35', '#305c41', '#396d4d', '427e59', '#4b8f65', '#54a071', '#61ac7e' ]


// Same math the card headers use: live price if we have one, otherwise what
// they paid, plus the middle of Penny's estimate for physical items.
function portfolioValue( portfolio, prices )
{
  let value = 0

  for ( const a of portfolio.assets )
  {
    const price = prices[ a.ticker ] != null ? prices[ a.ticker ] : a.purchase_price
    value += price * a.shares
  }

  for ( const item of portfolio.physical_assets || [] )
  {
    value += currentValue( item )
  }

  return value
}


function PieTooltip( { active, payload, total } )
{
  if ( !active || !payload || payload.length === 0 ) return null

  const slice = payload[ 0 ].payload

  return (
    <div className="bg-sand-50 border border-sand-300 rounded-lg shadow-md shadow-clay-800/10 px-3 py-2 text-xs">
      <p className="font-semibold text-ink-900">{ slice.name }</p>
      <p className="text-ink-500 font-mono">
        { money( slice.value ) } · { ( slice.value / total * 100 ).toFixed( 1 ) }%
      </p>
    </div>
  )
}


function PortfolioPie( { portfolios, prices } )
{
  // Biggest first so the wedges read clockwise from largest.
  const slices = portfolios
    .map( (p) => ( { name: p.name, value: portfolioValue( p, prices ) } ) )
    .filter( (s) => s.value > 0 )
    .sort( (a, b) => b.value - a.value )

  const total = slices.reduce( (sum, s) => sum + s.value, 0 )

  // One portfolio is just a circle, and nothing priced yet means no whole to
  // split, so in both cases draw nothing at all.
  if ( slices.length < 2 || total <= 0 ) return null

  return (
    <div className="bg-sand-50 rounded-2xl border border-sand-300 shadow-sm shadow-clay-800/5 p-5 sm:p-6 mb-5 flex flex-col">

      {/* Centered header, matching the rest of the card's column layout. */}
      <div className="text-center">
        <h2 className="font-semibold text-ink-900">Across all portfolios</h2>
        <p className="text-sm text-ink-500 mt-0.5">{ money( total ) } total</p>
      </div>

      {/* Square, capped so the pie doesn't balloon on a wide screen. */}
      <div className="mx-auto w-full max-w-75 aspect-square mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={ slices }
              dataKey="value"
              nameKey="name"
              /* start at 12 o'clock and go clockwise */
              startAngle={ 90 }
              endAngle={ -270 }
              isAnimationActive={ false }
              /* 2px of card color between wedges so the hues never touch */
              stroke={ SURFACE }
              strokeWidth={ 2 }
            >
              { slices.map( (s, i) => (
                <Cell key={ s.name } fill={ PIE_PALETTE[ i % PIE_PALETTE.length ] } />
              ) ) }
            </Pie>
            <Tooltip content={ <PieTooltip total={ total } /> } />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend names every slice, same as the allocation bar. Some of these
          hues are low contrast on sand, so color can't be the only label. */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        { slices.map( (s, i) => (
          <div key={ s.name } className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={ { backgroundColor: PIE_PALETTE[ i % PIE_PALETTE.length ] } }
            />
            <span className="text-xs text-ink-700">{ s.name }</span>
            <span className="text-xs text-ink-500 font-mono tabular-nums">
              { ( s.value / total * 100 ).toFixed( 0 ) }%
            </span>
          </div>
        ) ) }
      </div>

    </div>
  )
}
export default PortfolioPie
