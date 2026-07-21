import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import PhysicalAssetForm from '../components/PhysicalAssetForm'
import StockAssetForm from '../components/StockAssetForm'
import PhysicalAssetCard from '../components/PhysicalAssetCard'
import AllocationChart from '../components/AllocationChart'
import AiInsight from '../components/AiInsight'
import Logo from '../components/Logo'
import { TrashIcon, PlusIcon, SparkIcon, ChevronIcon } from '../components/icons'
import { money, currentValue } from '../config/assetCategories' 

import noPort from '../assets/no-port.png'


// What a portfolio is worth now versus what it cost, across both stocks and
// physical items. Pulled out of the component because it is plain arithmetic
// over the props and doesn't need to re-run on unrelated state changes.
//
// A stock with no live price yet falls back to its purchase price, which makes
// it contribute zero gain rather than a fake loss while the quote is loading.
function portfolioTotals( portfolio, prices )
{
  let value = 0
  let cost = 0

  for ( const a of portfolio.assets )
  {
    const price = prices[ a.ticker ] != null ? prices[ a.ticker ] : a.purchase_price
    value += price * a.shares
    cost += a.purchase_price * a.shares
  }

  for ( const item of portfolio.physical_assets || [] )
  {
    value += currentValue( item )
    cost += item.initial_value
  }

  return { value, cost, gainLoss: value - cost }
}


// One row per ticker, not one row per buy. Two purchases of IVV stay two rows
// in the database, each with its own price and date, which the totals math
// above needs, but showing them separately in the table reads as a bug.
//
// Shares add up and the paid-per-share becomes the cost weighted average, so
// the gain or loss on the merged row is the same number as the lots summed
// individually. ids carries every lot behind the row because deleting the row
// has to delete all of them, not just whichever one came first.
function mergeLots( assets )
{
  const byTicker = new Map()

  for ( const a of assets )
  {
    const row = byTicker.get( a.ticker )

    if ( row )
    {
      row.shares += a.shares
      row.cost += a.purchase_price * a.shares
      row.ids.push( a.id )
    }
    else
    {
      byTicker.set( a.ticker, {
        ticker: a.ticker,
        shares: a.shares,
        cost: a.purchase_price * a.shares,
        ids: [ a.id ],
      } )
    }
  }

  // Guard the divide. A zero share lot would make this NaN and the toFixed
  // calls in the table would render "NaN" rather than a price.
  return [ ...byTicker.values() ].map( (row) => ( {
    ...row,
    purchase_price: row.shares > 0 ? row.cost / row.shares : 0,
  } ) )
}


function Dashboard() {
  const navigate = useNavigate()
  const [portfolios, setPortfolios] = useState( [] )
  const [loading, setLoading] = useState( true )
  const [error, setError] = useState( '' )
  const [showCreateForm, setShowCreateForm] = useState( false )
  const [newPortfolioName, setNewPortfolioName] = useState( '' )
  const [activeAddAsset, setActiveAddAsset] = useState( null )
  const [prices, setPrices] = useState( {} )
  const [recommendation, setRecommendation] = useState( null )
  const [recLoading, setRecLoading] = useState( false )
  const [riskTolerance, setRiskTolerance] = useState( '' )
  const [financialGoal, setFinancialGoal] = useState( '' )
  const [activeAddPhysical, setActiveAddPhysical] = useState( null )
  const [estimateLoading, setEstimateLoading] = useState( null ) // id currently estimating
  // Ids of the collapsed cards, so anything not in the set is open. Tracking
  // the open ones instead would mean seeding the set on every load, and a
  // portfolio created later would come back collapsed.
  const [collapsed, setCollapsed] = useState( () => new Set() )



  function fetchPrices( portfolioList )
  {
    const tickers = [...new Set (
      portfolioList.flatMap( (p) => p.assets.map( (a) => a.ticker ) )
    ) ]
    tickers.forEach( (ticker) => {
      api.get( `/market/${ticker}` )
        .then( (res) => setPrices( (prev) => ( { ...prev, [ticker]: res.data.price } ) ) )
        .catch( () => {} )
    } )
  }

  // useCallback so the effect below can depend on it without re-running on
  // every render. Only navigate ever changes, and that is stable.
  const loadPortfolios = useCallback( () => {
    api.get( '/portfolios/' )
      .then( (res) => {
        setPortfolios( res.data )
        fetchPrices( res.data )
      } )
      .catch( () => {
        localStorage.removeItem( 'token' )
        navigate( '/login' )
      })
      .finally( () => setLoading(false) )
  }, [navigate] )

  useEffect( () => { loadPortfolios() }, [loadPortfolios] )

  function handleLogout()
  {
    localStorage.removeItem( 'token' )
    navigate( '/login' )
  }

  async function handleCreatePortfolio(e)
  {
    e.preventDefault()
    try {
      await api.post( '/portfolios/', { name: newPortfolioName } )
      setNewPortfolioName( '' )
      setShowCreateForm(false)
      loadPortfolios()
    } catch {
      setError( 'Failed to create portfolio. :/' )
    }
  }

  // Mirrors handleAddPhysical: the form owns its own fields and hands back a
  // finished payload, so this only has to post it.
  async function handleAddAsset( payload, portfolioId )
  {
    try {
      await api.post( `/portfolios/${portfolioId}/assets`, payload )
      setActiveAddAsset( null )
      loadPortfolios()
    } catch {
      setError( 'Failed to add stock.' )
    }
  }

  // Takes a list of ids, not one, because a row in the table can stand for
  // several lots of the same ticker. Promise.all rather than a loop so the
  // deletes overlap and one reload covers all of them.
  async function handleDeleteAsset( portfolioId, assetIds )
  {
    try {
      await Promise.all(
        assetIds.map( (id) => api.delete( `/portfolios/${portfolioId}/assets/${id}` ) )
      )
      loadPortfolios()
    } catch {
      setError( 'Failed to delete asset. :/' )
    }
  }

  // A copy rather than mutating the existing Set, because React compares by
  // reference and would skip the re-render otherwise.
  function toggleCollapsed( portfolioId )
  {
    setCollapsed( (prev) => {
      const next = new Set( prev )
      if ( next.has( portfolioId ) ) next.delete( portfolioId )
      else next.add( portfolioId )
      return next
    } )
  }

  // Adding to a collapsed card has to open it, otherwise the form appears in
  // the part that's hidden and the button looks broken.
  function expand( portfolioId )
  {
    setCollapsed( (prev) => {
      if ( !prev.has( portfolioId ) ) return prev
      const next = new Set( prev )
      next.delete( portfolioId )
      return next
    } )
  }

  async function handleDeletePort( portfolioId )
  {
    try {
      await api.delete( `/portfolios/${portfolioId}` )
      loadPortfolios()
    } catch {
      setError( 'Failed to delete portfolio :/' )
    }
  }

  async function handleGetRecommendation()
  {
    setRecLoading( true )
    setRecommendation( null )
    try {
      // Send null rather than '' for blanks so the backend can tell "not answered"
      // apart from an actual answer.
      const res = await api.post( '/ai/recommendations', {
        risk_tolerance: riskTolerance || null,
        financial_goal: financialGoal || null,
      } )
      setRecommendation( res.data )
    } catch {
      setError( 'Failed to get recommendation. :/' )
    } finally {
      setRecLoading( false )
    }
  }

  async function handleAddPhysical( payload, portfolioId )
  {
    try {
      await api.post( `/portfolios/${portfolioId}/physical-assets`, payload )
      setActiveAddPhysical( null )
      loadPortfolios()
    } catch {
      setError( 'Failed to add item. :/' )
    }
  }

  async function handleDeletePhysical( portfolioId, assetId )
  {
    try {
      await api.delete( `/portfolios/${portfolioId}/physical-assets/${assetId}` )
      loadPortfolios()
    } catch {
      setError( 'Failed to delete item. :/' )
    }
  }

  async function handleGetEstimate( assetId )
  {
    setEstimateLoading( assetId )
    try {
      const res = await api.post( `/ai/estimate/${assetId}` )
      const updated = res.data
      // swap the updated item into state so we don't have to reload the whole page
      setPortfolios( (prev) => prev.map( (p) => ( {
        ...p,
        physical_assets: p.physical_assets.map( (item) => item.id === updated.id ? updated : item ),
      } ) ) )
    } catch {
      setError( 'Failed to get estimate. :/' )
    } finally {
      setEstimateLoading( null )
    }
  }

  // Reused by every form field on this page so the inputs stay identical.
  const inputClass = "bg-sand-50 border border-sand-300 rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 transition-colors hover:border-sand-400"

  if ( loading ) return (
    <div className="min-h-screen bg-sand-100 flex items-center justify-center">
      <p className="text-ink-500 text-sm">Loading portfolios…</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-sand-100">

      {/* Navbar. Sticky so the logout and new-portfolio actions stay reachable
          once a long list of portfolios scrolls past. */}
      <nav className="sticky top-0 z-10 bg-clay-700 text-sand-50 px-4 sm:px-8 py-3 flex justify-between items-center gap-4 shadow-sm shadow-clay-800/20">

        <Logo tone="dark" />

        <div className="flex gap-2 items-center">
          <button
            onClick={ () => setShowCreateForm( !showCreateForm ) }
            className="flex items-center gap-1.5 text-sm bg-clay-600 hover:bg-clay-500 font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors"
          >
            <PlusIcon width={ 15 } height={ 15 } />
            {/* The label is noise on a narrow screen where the icon already says it */}
            <span className="hidden sm:inline">New Portfolio</span>
          </button>
          <button
            onClick={ handleLogout }
            className="text-sm font-medium text-sand-50/80 hover:text-sand-50 hover:bg-clay-800 px-3 py-2 rounded-lg transition-colors"
          >Log out
          </button>
        </div>

      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        <h1 className="text-2xl font-bold text-ink-900 mb-6">My Portfolios</h1>

        { error && (
          <div role="alert" className="animate-rise flex items-start justify-between gap-3 bg-loss/10 text-loss text-sm rounded-xl px-4 py-3 mb-5">
            <span>{ error }</span>
            {/* Errors used to stay on screen until the next action replaced
                them, with no way to dismiss one you'd already read. */}
            <button onClick={ () => setError( '' ) } aria-label="Dismiss error" className="shrink-0 hover:opacity-70">
              ✕
            </button>
          </div>
        ) }

        {/* Optional context for Penny. Both blank still works, it just gives
            more general advice. */}
        <div className="bg-sand-50 border border-sand-300 rounded-2xl p-4 mb-6 shadow-sm shadow-clay-800/5">
          <p className="text-xs text-ink-500 uppercase tracking-wide font-medium mb-3">Ask Penny</p>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={ riskTolerance }
              onChange={ (e) => setRiskTolerance( e.target.value ) }
              aria-label="Risk tolerance"
              className={ inputClass }
            >
              <option value="">Risk tolerance…</option>
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
            <input
              type="text"
              placeholder="Goal, i.e. buy a house in 5 years"
              value={ financialGoal }
              onChange={ (e) => setFinancialGoal( e.target.value ) }
              aria-label="Financial goal"
              className={ `${inputClass} flex-1 min-w-56` }
            />
            <button
              onClick={ handleGetRecommendation }
              disabled={ recLoading }
              className="flex items-center gap-1.5 text-sm bg-clay-700 text-sand-50 font-medium px-4 py-2 rounded-lg hover:bg-clay-800 transition-colors disabled:opacity-50"
            >
              <SparkIcon width={ 15 } height={ 15 } />
              { recLoading ? 'Thinking…' : 'AI Insight' }
            </button>
          </div>
        </div>

        { recommendation && (
          <AiInsight insight={ recommendation } onClose={ () => setRecommendation( null ) } />
        ) }

        {/* Creating new port */}
        { showCreateForm && (
          <form onSubmit={handleCreatePortfolio} className="animate-rise bg-sand-50 rounded-2xl border border-sand-300 shadow-sm shadow-clay-800/5 p-5 mb-6 flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Portfolio name"
              value={newPortfolioName}
              onChange={ (e) => setNewPortfolioName( e.target.value ) }
              aria-label="Portfolio name"
              className={ `${inputClass} flex-1 min-w-48` }
              required
              autoFocus
            />
            <button type="submit" className="bg-clay-700 text-sand-50 font-medium px-4 py-2 rounded-lg text-sm hover:bg-clay-800 transition-colors">Create</button>
            <button type="button" onClick={ () => setShowCreateForm(false) } className="text-ink-500 text-sm hover:text-ink-900 px-2 py-2 transition-colors">Cancel</button>
          </form>
        ) }

        { portfolios.length === 0 ? (
          <div className="bg-sand-50 rounded-2xl border border-sand-300 shadow-sm shadow-clay-800/5 p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sand-200">
              {/* Decorative: The "No portfolios yet" heading below already
                  carries the meaning, so an empty alt keeps it out of the
                  screen reader instead of announcing the file twice. */}
              <img src={ noPort } alt="" className="h-7 w-7 object-contain" />
            </div>
            <p className="text-ink-900 font-medium">No portfolios yet</p>
            <p className="text-ink-500 text-sm mt-1 mb-5">Create one to start tracking your stocks and belongings.</p>
            <button
              onClick={ () => setShowCreateForm( true ) }
              className="inline-flex items-center gap-1.5 bg-clay-700 text-sand-50 font-medium px-4 py-2 rounded-lg text-sm hover:bg-clay-800 transition-colors"
            >
              <PlusIcon width={ 15 } height={ 15 } />
              New Portfolio
            </button>
          </div>
        ) : (
          portfolios.map( (p) => {

            const totals = portfolioTotals( p, prices )
            const isCollapsed = collapsed.has( p.id )
            const itemCount = p.assets.length + ( p.physical_assets || [] ).length

            return (
            <div key={p.id} className="bg-sand-50 rounded-2xl border border-sand-300 shadow-sm shadow-clay-800/5 p-5 sm:p-6 mb-5">

              {/* Header: name and totals on the left, actions on the right.
                  Stacks on narrow screens instead of squeezing. The bottom
                  margin goes away when collapsed so the card closes down to
                  just this row. */}
              <div className={ `flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 ${ isCollapsed ? '' : 'mb-5' }` }>

                {/* The whole name and totals block is the toggle, not just the
                    chevron, so the hit target is the width of the card rather
                    than a 16px glyph. Left aligned because a button centers
                    its text by default. */}
                <button
                  onClick={ () => toggleCollapsed( p.id ) }
                  aria-expanded={ !isCollapsed }
                  className="flex items-start gap-2 text-left rounded-lg -m-1 p-1 hover:bg-sand-200/60 transition-colors"
                >
                  <ChevronIcon
                    width={ 18 }
                    height={ 18 }
                    className={ `mt-1 shrink-0 text-ink-500 transition-transform ${ isCollapsed ? '-rotate-90' : '' }` }
                  />
                  <div>
                    <h2 className="text-lg font-semibold text-ink-900">{p.name}</h2>
                    <div className="flex items-baseline flex-wrap gap-x-2.5 gap-y-1 mt-1">
                      {/* tabular-nums keeps the digits aligned between portfolios
                          without the wide letter-spacing a full mono face brings. */}
                      <span className="text-2xl font-semibold text-ink-900 tabular-nums">{ money( totals.value ) }</span>
                      { totals.cost > 0 && (
                        <span className={ `text-sm font-medium tabular-nums ${ totals.gainLoss >= 0 ? 'text-gain' : 'text-loss' }` }>
                          { totals.gainLoss >= 0 ? '+' : '−' }{ money( Math.abs( totals.gainLoss ) ) }
                          {' '}({ ( totals.gainLoss / totals.cost * 100 ).toFixed( 1 ) }%)
                        </span>
                      ) }
                    </div>
                    {/* Standing in for the holdings that are hidden, so a closed
                        card still says whether there is anything in it. */}
                    { isCollapsed && (
                      <p className="text-sm text-ink-500 mt-1">
                        { itemCount === 0
                          ? 'Empty'
                          : `${ itemCount } holding${ itemCount === 1 ? '' : 's' }` }
                      </p>
                    ) }
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  {/* "Asset" covered both stocks and belongings, which meant the
                      two buttons gave no clue which was which. They now say what
                      they add. */}
                  <button
                    onClick={ () => { expand( p.id ); setActiveAddAsset( activeAddAsset === p.id ? null : p.id ) } }
                    aria-expanded={ activeAddAsset === p.id }
                    className="flex items-center gap-1.5 text-sm text-clay-700 font-medium rounded-lg bg-sand-200 px-3 py-1.5 hover:bg-sand-300 transition-colors"
                  >
                    <PlusIcon width={ 14 } height={ 14 } />
                    Stock
                  </button>
                  <button
                    onClick={ () => { expand( p.id ); setActiveAddPhysical( activeAddPhysical === p.id ? null : p.id ) } }
                    aria-expanded={ activeAddPhysical === p.id }
                    className="flex items-center gap-1.5 text-sm text-clay-700 font-medium rounded-lg bg-sand-200 px-3 py-1.5 hover:bg-sand-300 transition-colors"
                  >
                    <PlusIcon width={ 14 } height={ 14 } />
                    Item
                  </button>
                  <button
                    onClick={ () => handleDeletePort( p.id ) }
                    aria-label={ `Delete portfolio ${p.name}` }
                    className="text-ink-500 rounded-lg p-2 hover:bg-loss/10 hover:text-loss transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              {/* Everything below the header collapses, so a dashboard with
                  several portfolios stays scannable and the one being worked
                  on is the only one taking up room. */}
              { !isCollapsed && (
                <>
                <AllocationChart portfolio={ p } prices={ prices } />

                { activeAddAsset === p.id && (
                  <StockAssetForm
                    onSubmit={ (payload) => handleAddAsset( payload, p.id ) }
                    onCancel={ () => setActiveAddAsset( null ) }
                  />
                ) }

                { activeAddPhysical === p.id && (
                  <PhysicalAssetForm
                    onSubmit={ (payload) => handleAddPhysical( payload, p.id ) }
                    onCancel={ () => setActiveAddPhysical( null ) }
                  />
                ) }

                {/* Property & items */}
                { p.physical_assets && p.physical_assets.length > 0 && (
                  <div className="mt-6 mb-6">
                    <div className="flex items-baseline justify-between gap-3 mb-3">
                      <h3 className="text-xs text-ink-500 uppercase tracking-wide font-medium">Property &amp; Items</h3>
                      <p className="text-xs text-ink-500">
                        { p.physical_assets.length } item{ p.physical_assets.length === 1 ? '' : 's' } ·{' '}
                        <span className="font-semibold text-ink-900">
                          { money( p.physical_assets.reduce( (sum, item) => sum + currentValue( item ), 0 ) ) }
                        </span>
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      { p.physical_assets.map( (item) => (
                        <PhysicalAssetCard
                          key={ item.id }
                          item={ item }
                          estimating={ estimateLoading === item.id }
                          onEstimate={ handleGetEstimate }
                          onDelete={ (assetId) => handleDeletePhysical( p.id, assetId ) }
                        />
                      ) ) }
                    </div>
                  </div>
                ) }

                {p.assets.length === 0 ? (
                  <div className="border-t border-sand-300 py-8 text-center">
                    <p className="text-ink-900 text-sm font-medium">No stocks yet</p>
                    <p className="text-ink-500 text-sm mt-1">Add one with its ticker. The short code it trades under, like AAPL.</p>
                    {/* Nothing to add if the form is already open right above. */}
                    { activeAddAsset !== p.id && (
                      <button
                        onClick={ () => setActiveAddAsset( p.id ) }
                        className="mt-3 inline-flex items-center gap-1.5 text-sm text-clay-700 font-medium rounded-lg bg-sand-200 px-3 py-1.5 hover:bg-sand-300 transition-colors"
                      >
                        <PlusIcon width={ 14 } height={ 14 } />
                        Add a stock
                      </button>
                    ) }
                  </div>
                ) : (
                  <>
                    <h3 className="text-xs text-ink-500 uppercase tracking-wide font-medium mb-2">Stocks</h3>
                    {/* Wrapped so the table scrolls sideways on a phone rather than
                        forcing the whole page to scroll horizontally.
                        contain-paint is load-bearing, not decoration: without it the
                        table's layout overflow still widens the document even though
                        the wrapper itself scrolls correctly, which left the page
                        draggable sideways on mobile. The table sets no min-width, so
                        its width comes from the nowrap cells below. */}
                    <div className="overflow-x-auto contain-paint">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-sand-300">
                            <th className="pb-2.5 font-medium whitespace-nowrap">Ticker</th>
                            <th className="pb-2.5 font-medium text-right whitespace-nowrap">Shares</th>
                            {/* "Buy Price" and "Current" both read as a price with
                                no hint of which one is per share. */}
                            <th className="pb-2.5 font-medium text-right whitespace-nowrap">Paid / Share</th>
                            <th className="pb-2.5 font-medium text-right whitespace-nowrap">Price Now</th>
                            <th className="pb-2.5 font-medium text-right whitespace-nowrap">Gain / Loss</th>
                            {/* The delete column gets no header text on purpose. Each
                                row's button carries its own aria-label ("Delete AAPL"),
                                so nothing is lost, and anything using sr-only here would
                                be position:absolute with no positioned ancestor, it
                                escapes the scroll container below and drags the whole
                                page sideways on mobile. */}
                            <th className="pb-2.5 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {mergeLots( p.assets ).map( (a) => {
                            {/* Finds currnet market price for that aasets ticker symbol from a prices map */}
                            const current = prices[a.ticker]
                            {/* after ? is price change per share */}
                            {/* * a.shares is the total dollar gain or loss accross all shares */}
                            const gainLoss = current != null
                              ? ( current - a.purchase_price ) * a.shares
                              : null
                            return (
                              <tr key={a.ticker} className="group border-b border-sand-200 last:border-0 hover:bg-sand-100 transition-colors">
                                <td className="py-3 pr-4 font-semibold text-ink-900 whitespace-nowrap">{ a.ticker }</td>
                                {/* Adding fractional lots leaves float noise behind,
                                    0.3487 + 1 lands on 1.3486999999999998, so round to
                                    four places. The unary + drops the trailing zeros
                                    toFixed adds back, keeping a whole share holding
                                    as "1" rather than "1.0000". */}
                                <td className="py-3 pl-4 text-right text-ink-700 font-mono whitespace-nowrap">{ +a.shares.toFixed(4) }</td>
                                <td className="py-3 pl-4 text-right text-ink-700 font-mono whitespace-nowrap">${ a.purchase_price.toFixed(2) }</td>
                                <td className="py-3 pl-4 text-right text-ink-700 font-mono whitespace-nowrap">
                                  { current != null ? `$${ current.toFixed(2) }` : '—' }
                                </td>
                                <td className={ `py-3 pl-4 text-right font-mono font-semibold whitespace-nowrap ${gainLoss == null ? 'text-ink-500' : gainLoss >= 0 ? 'text-gain' : 'text-loss'}` }>
                                  {/* If gainLoss is null show a dash. Otherwise the sign goes
                                      before the dollar sign, taking abs() first, because
                                      toFixed on a negative would otherwise render "$-292.50". */}
                                  { gainLoss != null
                                    ? `${gainLoss >= 0 ? '+' : '−' }$${ Math.abs( gainLoss ).toFixed(2) }`
                                    : '—' }
                                </td>
                                <td className="py-3 text-right w-10">
                                  <button
                                    onClick={ () => handleDeleteAsset( p.id, a.ids ) }
                                    aria-label={ `Delete ${a.ticker}` }
                                    className="text-ink-400 hover:text-loss rounded-md p-1.5 hover:bg-loss/10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all"
                                  >
                                    <TrashIcon width={ 14 } height={ 14 } />
                                  </button>
                                </td>
                              </tr>
                            )
                          } ) }
                        </tbody>
                      </table>
                    </div>
                  </>
                ) }
                </>
              ) }
            </div>
            )
          } )
        ) }

        {/* Getting-started guide. Shown under the list rather than in place of
            it so it stays available after the first portfolio exists. The
            empty state above only covers step one. */}
        <div className="bg-sand-100 rounded-2xl shadow-sm shadow-clay-800/5 p-5 sm:p-6 mt-8">
          <h2 className="font-semibold text-ink-500">Not sure where to start?</h2>
          <p className="text-ink-500 text-sm mt-1">
            Penny keeps your stocks and your belongings in one place, then tells you what
            it makes of them. Three steps:
          </p>

          <ol className="mt-5 grid gap-4 sm:grid-cols-3">
            <li>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sand-200 text-clay-700 text-xs font-semibold">1</span>
                <p className="text-ink-900 text-sm font-medium "> Make a portfolio</p>
              </div>
              <p className="text-ink-500 text-sm mt-1">
                Name it anything. “Retirement”, “Stuff in my apartment”. You can keep as
                many as you like.
              </p>
            </li>
            <li>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sand-200 text-clay-700 text-xs font-semibold">2</span>
                <p className="text-ink-900 text-sm font-medium ">Fill it in</p>
              </div>
              <p className="text-ink-500 text-sm mt-1">
                Add a Stock by its ticker, like AAPL, or an Item for things you own. A car, a guitar, jewelry.
              </p>
            </li>
            <li>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sand-200 text-clay-700 text-xs font-semibold">3</span>
                <p className="text-ink-900 text-sm font-medium">Ask Penny</p>
              </div>
              <p className="text-ink-500 text-sm mt-1">
                Set a risk level and a goal at the top of the page, then hit AI Insight for
                advice on what you’re holding.
              </p>
            </li>
          </ol>
        </div>

      </div>

      {/* Same privacy notice as the landing page, so someone who signed up
          straight from a link still sees it once they're inside. */}
      <footer className="border-t border-sand-300">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 text-center">
          <p className="text-xs text-ink-500 leading-relaxed">
            <span className="font-medium text-ink-700">Your privacy.</span>{' '}
            Penny stores your portfolio only to show you your own estimates and insights.
            We do not sell your data or share it with advertisers. Value estimates are
            AI-generated approximations, not financial advice.
          </p>
          <p className="text-xs text-ink-400 mt-3">© 2026 Penny</p>
        </div>
      </footer>
    </div>
  )
}
export default Dashboard
