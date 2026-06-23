import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function Dashboard() {
  const navigate = useNavigate()
  const [portfolios, setPortfolios] = useState( [] )
  const [loading, setLoading] = useState( true )
  const [error, setError] = useState( '' )
  const [showCreateForm, setShowCreateForm] = useState( false )
  const [newPortfolioName, setNewPortfolioName] = useState( '' )
  const [activeAddAsset, setActiveAddAsset] = useState( null )
  const [newAsset, setNewAsset] = useState( { ticker: '', shares: '', purchase_price: '' } )
  const [prices, setPrices] = useState( {} )
    const [recommendation, setRecommendation] = useState( '' )
  const [recLoading, setRecLoading] = useState( false )


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

  function loadPortfolios() 
  {
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
  }

  useEffect( () => { loadPortfolios() }, [navigate] )

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

  async function handleAddAsset( e, portfolioId ) 
  {
    e.preventDefault()
    try {
      await api.post( `/portfolios/${portfolioId}/assets`, {
        ticker: newAsset.ticker.toUpperCase(),
        shares: parseFloat( newAsset.shares ),
        purchase_price: parseFloat( newAsset.purchase_price ),
      } )
      setNewAsset( { ticker: '', shares: '', purchase_price: '' } )
      setActiveAddAsset(null)
      loadPortfolios()
    } catch {
      setError( 'Failed to add asset. :/' )
    }
  }

  async function handleDeleteAsset( portfolioId, assetId )
  {
    try { 
      await api.delete( `/portfolios/${portfolioId}/assets/${assetId}` )
      loadPortfolios() 
    } catch { 
      setError( 'Failed to delete asset. :/' )
    }
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
    setRecommendation( '' )
    try {
      const res = await api.post( '/ai/recommendations' )
      setRecommendation( res.data.recommendation )
    } catch {
      setError( 'Failed to get recommendation. :/' )
    } finally {
      setRecLoading( false )
    }
  }


  if ( loading ) return ( 
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading portfolios...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Navbar */}
      <nav className="bg-blue-900 text-white px-8 py-4 flex justify-between items-center">

        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="flex flex-col items-center mb-1"> 
            <div className="w-25 h-12 bg-blue-700 rounded-2xl flex items-center justify-center"> 
              <span className="text-white text-xl font-bold">Penny</span>
            </div>
          </div>
        </div>

        {/* New Portfolio Logout */}
        <div className="flex gap-3 items-center">
          <button
            onClick={ () => setShowCreateForm( !showCreateForm ) }
            className="text-sm bg-blue-700 text-white font-medium px-4 py-1.5 rounded-md hover:bg-blue-800 transition-colors"
          >New Portfolio
          </button>
          <button
            onClick={ handleLogout }
            className="text-sm text-white hover:text-white transition-colors rounded-md bg-blue-700 px-4 py-1.5 hover:bg-blue-800"
          >Log out
          </button>
        </div>

      </nav>

      <div className="max-w-5xl mx-auto px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Portfolios</h1>
        { error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
            !! {error}
          </div>
        ) }
        <button
          onClick={ handleGetRecommendation }
          disabled={ recLoading }
          className="text-sm bg-blue-700 text-white font-medium px-4 py-1.5 rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50 mb-3"
            >{ recLoading ? 'Thinking…' : 'AI Insight' }
        </button>
        { recommendation && (
          <div className="bg-blue-50 border-b border-blue-200 rounded-xl px-5 py-4 mb-6">
            <div className="flex justify-between items-start">
              <h2 className="text-sm font-semibold text-blue-900 mb-2 font: italic">Penny's AI Insight</h2>
              <button onClick={ () => setRecommendation('') } className="text-blue-400 text-sm hover:text-blue-600">x</button>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-line">{ recommendation }</p>
          </div>
        ) }



        {/* Creating new port */}
        { showCreateForm && (
          <form onSubmit={handleCreatePortfolio} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex gap-3 items-center">
            <input
              type="text"
              placeholder="Portfolio name"
              value={newPortfolioName}
              onChange={ (e) => setNewPortfolioName( e.target.value ) }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
              required
            />
            <button type="submit" className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-900 transition-colors">Create</button>
            <button type="button" onClick={ () => setShowCreateForm(false) } className="text-gray-400 text-sm hover:text-gray-600">Cancel</button>
          </form>
        ) }

        { portfolios.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <p className="text-gray-700 font-medium">No portfolios yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "New Portfolio" above to get started.</p>
          </div>
        ) : (
          portfolios.map( (p) => (

            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
              <div className="flex justify-between items-center mb-4 flex-row">
                <h2 className="text-lg font-semibold text-gray-900">{p.name}</h2>

                <div className="flex justify-between items-center flex-row gap-2 mb-5">
                  <button
                    onClick={ () => setActiveAddAsset( activeAddAsset === p.id ? null : p.id ) }
                    className="text-sm text-blue-900 font-medium rounded-md bg-blue-50 px-3 py-1 hover:bg-blue-100"
                  >Add Asset
                  </button>
                  <button
                    onClick={ () => handleDeletePort( p.id ) }
                      className="text-sm text-gray-900 font-medium rounded-md bg-gray-100 px-3 py-1 hover:bg-red-50"
                    >x
                  </button>
                </div>
              </div>

              { activeAddAsset === p.id && (
                <form onSubmit={ (e) => handleAddAsset(e, p.id) } className="flex gap-2 mb-5 flex-wrap">
                  <input
                    type="text"
                    placeholder="Ticker (i.e. AAPL)"
                    value={newAsset.ticker}
                    onChange={ (e) => setNewAsset( { ...newAsset, ticker: e.target.value } ) }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Shares"
                    value={newAsset.shares}
                    onChange={ (e) => setNewAsset( { ...newAsset, shares: e.target.value } ) }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                    step="any" min="0" required
                  />
                  <input
                    type="number"
                    placeholder="Buy price"
                    value={newAsset.purchase_price}
                    onChange={ (e) => setNewAsset( { ...newAsset, purchase_price: e.target.value } ) }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                    step="any" min="0" required
                  />
                  <button type="submit" className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition-colors">Add</button>
                  <button type="button" onClick={ () => setActiveAddAsset(null) } className="text-gray-400 text-sm hover:text-gray-600 px-2">Cancel</button>
                </form>
              ) }

              {p.assets.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">No assets yet. Add one above.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      <th className="pb-3 font-medium">Ticker</th>
                      <th className="pb-3 font-medium text-right">Shares</th>
                      <th className="pb-3 font-medium text-right">Buy Price</th>
                      <th className="pb-3 font-medium text-right">Current</th>
                      <th className="pb-3 font-medium text-right">Gain / Loss</th>
                      <th className="pb-3 font-medium text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.assets.map( (a) => {
                      {/* Finds currnet market price for that aasets ticker symbol from a prices map */}
                      const current = prices[a.ticker] 
                      {/* after ? is price change per share */}
                      {/* * a.shares is the total dollar gain or loss accross all shares */}
                      const gainLoss = current != null
                        ? ( current - a.purchase_price ) * a.shares
                        : null
                      return (
                        <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3 font-semibold text-gray-900">{ a.ticker }</td>
                          <td className="py-3 text-right text-gray-600 font-mono">{ a.shares }</td>
                          <td className="py-3 text-right text-gray-600 font-mono">${ a.purchase_price.toFixed(2) }</td>
                          <td className="py-3 text-right text-gray-600 font-mono">
                            { current != null ? `$${ current.toFixed(2) }` : '—' }
                          </td>
                          <td className={ `py-3 text-right font-mono font-semibold ${gainLoss == null ? 'text-gray-400' : gainLoss >= 0 ? 'text-green-800' : 'text-red-800'}` }>
                            {/* If gainLoss is null, show '-', if has value, add '+' depending on gain or loss, with '$' before*/}
                            { gainLoss != null
                              ? `${gainLoss >= 0 ? '+' : '' }$${ gainLoss.toFixed(2) }`
                              : '—' }
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={ () => handleDeleteAsset( p.id, a.id ) }
                              className="text-xs text-gray-600 hover:bg-red-50 font-medium rounded-md bg-gray-100 px-2 py-1 mr-2"
                            >x</button>
                          </td>
                        </tr>
                      )
                    } ) }
                  </tbody>
                </table>
              ) }
            </div>
          ) )
        ) }

      </div>
    </div>
  )
}
export default Dashboard 