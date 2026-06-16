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
      setError( 'Failed to create portfolio.' )
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
      setError( 'Failed to add asset.' )
    }
  }

  if ( loading ) return <p className="p-8">Loading...</p>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Portfolios</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={ () => setShowCreateForm( !showCreateForm ) }
              className="text-sm bg-blue-300 text-white px-3 py-1 rounded hover:bg-blue-400"
            >New Portfolio
            </button>
            <button
              onClick={ handleLogout }
              className="text-sm text-gray-500 hover:text-red-500"
            >Log out
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {showCreateForm && (
          <form onSubmit={handleCreatePortfolio} className="bg-white rounded shadow p-4 mb-6 flex gap-3">
            <input
              type="text"
              placeholder="Portfolio name"
              value={newPortfolioName}
              onChange={ (e) => setNewPortfolioName( e.target.value ) }
              className="border rounded px-3 py-1 text-sm flex-1"
              required
            />
            <button type="submit" className="bg-blue-300 text-white px-4 py-1 rounded text-sm hover:bg-blue-400">
              Create
            </button>
            <button type="button" onClick={ () => setShowCreateForm(false) } className="text-gray-400 text-sm hover:text-gray-600">
              Cancel
            </button>
          </form>
        ) }

        { portfolios.length === 0 ? (
          <p className="text-gray-500">No portfolios yet.</p>
        ) : (
          portfolios.map( (p) => (
            <div key={p.id} className="bg-white rounded shadow p-6 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <button
                  onClick={ () => setActiveAddAsset( activeAddAsset === p.id ? null : p.id ) }
                  className="text-sm text-blue-400 hover:underline"
                >Add Asset
                </button>
              </div>

              { activeAddAsset === p.id && (
                <form onSubmit={ (e) => handleAddAsset(e, p.id) } className="flex gap-2 mb-4 flex-wrap">
                  <input
                    type="text"
                    placeholder="Ticker (e.g. AAPL)"
                    value={newAsset.ticker}
                    onChange={ (e) => setNewAsset( { ...newAsset, ticker: e.target.value } ) }
                    className="border rounded px-3 py-1 text-sm w-36"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Shares"
                    value={newAsset.shares}
                    onChange={(e) => setNewAsset({ ...newAsset, shares: e.target.value })}
                    className="border rounded px-3 py-1 text-sm w-24"
                    step="any"
                    min="0"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Buy price"
                    value={newAsset.purchase_price}
                    onChange={(e) => setNewAsset({ ...newAsset, purchase_price: e.target.value })}
                    className="border rounded px-3 py-1 text-sm w-28"
                    step="any"
                    min="0"
                    required
                  />
                  <button type="submit" className="bg-blue-300 text-white px-3 py-1 rounded text-sm hover:bg-blue-400">
                    Add
                  </button>
                  <button type="button" onClick={() => setActiveAddAsset(null)} className="text-gray-400 text-sm hover:text-gray-600">
                    Cancel
                  </button>
                </form>
              )}

              {p.assets.length === 0 ? (
                <p className="text-gray-400 text-sm">No assets.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2">Ticker</th>
                      <th className="pb-2">Shares</th>
                      <th className="pb-2">Buy Price</th>
                      <th className="pb-2">Current</th>
                      <th className="pb-2">Gain / Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.assets.map((a) => {
                      const current = prices[a.ticker]
                      const gainLoss = current != null
                        ? (current - a.purchase_price) * a.shares
                        : null
                      return (
                        <tr key={a.id} className="border-b last:border-0">
                          <td className="py-2 font-medium">{a.ticker}</td>
                          <td className="py-2">{a.shares}</td>
                          <td className="py-2">${a.purchase_price.toFixed(2)}</td>
                          <td className="py-2">
                            {current != null ? `$${current.toFixed(2)}` : '—'}
                          </td>
                          <td className={`py-2 font-medium ${gainLoss == null ? '' : gainLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {gainLoss != null
                              ? `${gainLoss >= 0 ? '+' : ''}$${gainLoss.toFixed(2)}`
                              : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))
        )}

      </div>
    </div>
  )
}

export default Dashboard
