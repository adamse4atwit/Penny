// Pie of net worth split by portfolio. The AllocationChart on each card shows
// what's inside one portfolio, this shows how the whole account divides.
// Colors live in PieView so every chart in the app matches.

import PieView from './PieView'
import { money, currentValue } from '../config/assetCategories'


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
    <div className=" p-5 sm:p-6 mb-5 flex flex-col">
      {/* add maybe: bg-sand-50 rounded-2xl ^^^ */}
      {/* Centered header, matching the rest of the card's column layout. */}
      <div className="text-center">
        <h2 className="font-semibold text-ink-900">Across all portfolios</h2>
        <p className="text-sm text-ink-500 mt-0.5">{ money( total ) } total</p>
      </div>

      <div className="mt-4">
        <PieView slices={ slices } total={ total } />
      </div>

    </div>
  )
}
export default PortfolioPie
