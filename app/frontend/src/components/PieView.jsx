// The pie itself, shared by the dashboard-wide chart and the per-portfolio
// one so the two stay identical.

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { money } from '../config/assetCategories'
import { CHART_PALETTE, SURFACE } from '../config/chartColors'


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


// slices are { name, value }, already sorted and filtered by the caller.
function PieView( { slices, total, size = 'max-w-75' } )
{
  return (
    <>
      {/* Square, capped so the pie doesn't balloon on a wide screen. */}
      <div className={ `mx-auto w-full aspect-square ${size}` }>
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
              /* 2px of card color between wedges so the fills never touch */
              stroke={ SURFACE }
              strokeWidth={ 2 }
            >
              { slices.map( (s, i) => (
                <Cell key={ s.name } fill={ CHART_PALETTE[ i % CHART_PALETTE.length ] } />
              ) ) }
            </Pie>
            <Tooltip content={ <PieTooltip total={ total } /> } />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend names every slice. Some of these fills are low contrast on
          sand, so color can't be the only label. */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        { slices.map( (s, i) => (
          <div key={ s.name } className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={ { backgroundColor: CHART_PALETTE[ i % CHART_PALETTE.length ] } }
            />
            <span className="text-xs text-ink-700">{ s.name }</span>
            <span className="text-xs text-ink-500 font-mono tabular-nums">
              { ( s.value / total * 100 ).toFixed( 0 ) }%
            </span>
          </div>
        ) ) }
      </div>
    </>
  )
}
export default PieView
