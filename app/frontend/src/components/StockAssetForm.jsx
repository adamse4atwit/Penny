import { useEffect, useState } from 'react'
import api from '../api'
import { CloseIcon } from './icons'

// Prices need cents, so this doesn't reuse money() from assetCategories —
// that one deliberately rounds to whole dollars for portfolio totals.
function dollars( n )
{
  return n.toLocaleString( 'en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 } )
}

// "2024-01-05" → "Jan 5, 2024". Split by hand rather than handing the string to
// new Date(): that parses a bare date as UTC, which renders as the day before
// anywhere west of Greenwich.
function prettyDate( iso )
{
  const [ year, month, day ] = iso.split( '-' ).map( Number )
  return new Date( year, month - 1, day ).toLocaleDateString( 'en-US', { month: 'short', day: 'numeric', year: 'numeric' } )
}

function StockAssetForm( { onSubmit, onCancel } )
{
  const [ticker, setTicker] = useState( '' )
  const [shares, setShares] = useState( '' )
  const [price, setPrice] = useState( '' )

  // What the market endpoint said about the symbol currently typed.
  // null = nothing typed yet. status is one of:
  //   loading - request in flight
  //   ok      - real symbol, we have the company name and today's price
  //   bad     - the symbol doesn't exist, so adding it would only ever show "—"
  //   offline - Yahoo is unreachable; we can't check, but we don't block either
  const [quote, setQuote] = useState( null )

  // The company-name search, for the very common case of knowing the company
  // but not its symbol. Same three states as `quote`: null / loading / a list.
  const [search, setSearch] = useState( '' )
  const [matches, setMatches] = useState( null )

  // The search stays behind a "yes" rather than sitting open: most people
  // adding a stock already know its symbol, and a second text field under the
  // first one reads as something you're expected to fill in.
  const [showSearch, setShowSearch] = useState( false )

  // "What was it worth the day I bought it?", the number people actually need
  // for this form, and the one they'd otherwise dig out of an old statement.
  const [showDate, setShowDate] = useState( false )
  const [buyDate, setBuyDate] = useState( '' )
  const [dated, setDated] = useState( null )

  // The "checking…" and cleared states belong here rather than in the effect
  // below: they're a direct reaction to typing, and setting state inside an
  // effect body would make React render twice for every keystroke.
  function changeTicker( value )
  {
    // Uppercased as it's typed rather than quietly at submit, so what you see
    // in the field is exactly what gets saved.
    const next = value.toUpperCase()
    setTicker( next )
    setQuote( next.trim() ? { status: 'loading' } : null )
    setDated( null )   // last symbol's historical price doesn't apply to this one
  }

  function changeBuyDate( value )
  {
    setBuyDate( value )
    // A <input type="date"> reports '' until the whole date is valid, so a
    // non-empty value here is always a real day worth looking up.
    setDated( value ? { status: 'loading' } : null )
  }

  function closeDate()
  {
    setShowDate( false )
    changeBuyDate( '' )
  }

  function changeSearch( value )
  {
    setSearch( value )
    // One or two letters match half the market, so the search waits for enough
    // to go on rather than flashing a useless list.
    setMatches( value.trim().length >= 2 ? { status: 'loading' } : null )
  }

  function closeSearch()
  {
    setShowSearch( false )
    changeSearch( '' )   // so reopening it starts clean rather than mid-query
  }

  // Picking a result is the whole point of the search: it fills the symbol in
  // for you, and the lookup above then quotes today's price for it.
  function pickMatch( symbol )
  {
    changeTicker( symbol )
    closeSearch()
  }

  // Look the symbol up as it's typed, so nobody has to submit the form to find
  // out whether "APPL" was a typo. Debounced because the field fires on every
  // keystroke and each lookup is a network round trip.
  useEffect( () => {
    const symbol = ticker.trim()
    if ( !symbol ) return

    let ignore = false   // guards against an older, slower response landing last
    const timer = setTimeout( () => {
      api.get( `/market/${symbol}` )
        .then( (res) => { if ( !ignore ) setQuote( { status: 'ok', ...res.data } ) } )
        .catch( (err) => {
          if ( ignore ) return
          // A 404 means the symbol is wrong. that's on the user and worth
          // blocking. Anything else is our side being down, and shouldn't stop
          // someone recording a stock they definitely own.
          setQuote( { status: err.response?.status === 404 ? 'bad' : 'offline' } )
        } )
    }, 450 )

    return () => { ignore = true; clearTimeout( timer ) }
  }, [ticker] )

  // Same debounce-and-discard shape as the lookup above, against the endpoint
  // that turns "apple" into AAPL.
  useEffect( () => {
    const query = search.trim()
    if ( query.length < 2 ) return

    let ignore = false
    const timer = setTimeout( () => {
      api.get( '/market/search', { params: { q: query } } )
        .then( (res) => { if ( !ignore ) setMatches( { status: 'ok', list: res.data } ) } )
        .catch( () => { if ( !ignore ) setMatches( { status: 'offline' } ) } )
    }, 400 )

    return () => { ignore = true; clearTimeout( timer ) }
  }, [search] )

  // The historical close for the chosen day. No debounce: a date picker gives
  // one complete date per interaction rather than a value per keystroke.
  useEffect( () => {
    const symbol = ticker.trim()
    if ( !symbol || !buyDate ) return

    let ignore = false
    api.get( `/market/${symbol}/history`, { params: { on: buyDate } } )
      .then( (res) => {
        if ( ignore ) return
        setDated( { status: 'ok', ...res.data } )
      } )
      .catch( (err) => {
        if ( ignore ) return
        setDated( { status: err.response?.status === 404 ? 'none' : 'offline' } )
      } )

    return () => { ignore = true }
  }, [ticker, buyDate] )

  const sharesNum = parseFloat( shares )
  const priceNum = parseFloat( price )
  const hasMath = sharesNum > 0 && priceNum > 0
  const cost = hasMath ? sharesNum * priceNum : 0

  // Nothing usable in the ticker field yet, either it's empty or what's there
  // isn't a real symbol, so the help below is worth offering.
  const needsSymbol = !ticker || quote?.status === 'bad'

  // Only worth previewing the gain once we know today's real price.
  const livePrice = quote?.status === 'ok' ? quote.price : null
  const gainLoss = hasMath && livePrice != null ? ( livePrice - priceNum ) * sharesNum : null

  function handleSubmit( e )
  {
    e.preventDefault()
    onSubmit( {
      ticker: ticker.trim().toUpperCase(),
      shares: sharesNum,
      purchase_price: priceNum,
    } )
    changeTicker( '' )   // clears the lookup result along with the field
    closeDate()          // otherwise the panel springs open again on the next symbol
    setShares( '' )
    setPrice( '' )
  }

  // Local, not UTC: toISOString() would hand the date picker tomorrow's date
  // for anyone in a timezone ahead of Greenwich in the evening.
  const today = new Date().toLocaleDateString( 'en-CA' )

  // Same field styling as the item form so the two share one look.
  const inputClass = "field w-full text-sm"
  const labelClass = "block text-xs font-medium text-ink-500 mb-1"

  return (
    <form onSubmit={ handleSubmit } className="animate-rise bg-sand-200/50 rounded-2xl border border-sand-300 p-5 mb-5">

      <p className="text-sm font-medium text-ink-900">Add a stock</p>
      <p className="text-xs text-ink-500 mb-4">
        A ticker is the short code a company trades under. Apple is AAPL, Microsoft is MSFT.
        Type one and Penny will name the company back to you before you add it.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <div className="col-span-2">
          <label htmlFor="ticker" className={ labelClass }>Ticker symbol</label>
          <input
            id="ticker"
            type="text"
            placeholder="AAPL"
            value={ ticker }
            onChange={ (e) => changeTicker( e.target.value ) }
            className={ `${inputClass} font-semibold tracking-wide` }
            autoComplete="off"
            autoFocus
            required
          />
        </div>

        <div>
          <label htmlFor="shares" className={ labelClass }>How many shares</label>
          <input
            id="shares"
            type="number"
            placeholder="10"
            value={ shares }
            onChange={ (e) => setShares( e.target.value ) }
            className={ inputClass }
            step="any" min="0" required
          />
        </div>

        <div>
          <label htmlFor="price" className={ labelClass }>Price paid per share</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">$</span>
            <input
              id="price"
              type="number"
              placeholder="150.00"
              value={ price }
              onChange={ (e) => setPrice( e.target.value ) }
              className={ `${inputClass} pl-7` }
              step="any" min="0" required
            />
          </div>
        </div>

      </div>

      {/* The lookup result. min-h stops the form twitching as the message
          swaps between states of different lengths. */}
      <div className="min-h-9 flex flex-wrap items-center gap-2 mt-2 text-xs">

        { quote?.status === 'loading' && <span className="text-ink-500">Checking { ticker }…</span> }

        { quote?.status === 'ok' && (
          <>
            <span className="text-ink-700">
              <span className="font-medium text-ink-900">{ quote.name || quote.ticker }</span>
              {' · '}{ dollars( quote.price ) } today
            </span>
            {/* Most people adding a stock they just bought would otherwise have
                to go look this number up somewhere else. */}
            <button
              type="button"
              onClick={ () => setPrice( String( quote.price ) ) }
              className="rounded-full bg-sand-50 px-2.5 py-1 font-medium text-clay-700  transition-colors hover:bg-sand-200 hover:ring-sand-400"
            >Use as my price
            </button>
            {/* Today's price only helps if you bought today. This one asks
                Penny what it closed at on the day you actually bought. */}
            <button
              type="button"
              onClick={ () => setShowDate( !showDate ) }
              aria-expanded={ showDate }
              aria-controls="buy-date-panel"
              className="rounded-full bg-sand-50 px-2.5 py-1 font-medium text-clay-700  transition-colors hover:bg-sand-200 hover:ring-sand-400"
            >Price on another date
            </button>
          </>
        ) }

        { quote?.status === 'bad' && (
          <span className="text-loss">No stock trades as { ticker }. Check the spelling, it&apos;s the symbol, not the company name.</span>
        ) }

        { quote?.status === 'offline' && (
          <span className="text-ink-500">Couldn&apos;t reach the market right now, so we can&apos;t confirm { ticker }. You can still add it.</span>
        ) }

      </div>

      {/* Tied to a live quote: without a confirmed symbol there's nothing to
          look up a history for. */}
      { quote?.status === 'ok' && showDate && (
        <div id="buy-date-panel" className="animate-rise rounded-xl border border-sand-300 bg-sand-50 p-3 mb-1">

          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="buy-date" className={ labelClass }>What day did you buy it?</label>
            <button
              type="button"
              onClick={ closeDate }
              aria-label="Close date lookup"
              className="btn btn-sm btn-icon btn-ghost -mt-0.5"
            >
              <CloseIcon width={ 13 } height={ 13 } />
            </button>
          </div>

          <input
            id="buy-date"
            type="date"
            value={ buyDate }
            onChange={ (e) => changeBuyDate( e.target.value ) }
            /* No point offering days the market hasn't traded yet. */
            max={ today }
            className={ `${inputClass} w-auto` }
            autoFocus
          />

          <div className="mt-2 text-xs">

            { dated?.status === 'loading' && (
              <p className="text-ink-500">Looking up what { ticker } closed at…</p>
            ) }

            { dated?.status === 'ok' && (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-ink-700">
                  { ticker } closed at{' '}
                  <span className="font-semibold text-ink-900">{ dollars( dated.price ) }</span>
                  {' '}on { prettyDate( dated.date ) }.
                  {/* Ask for a Saturday and you get Friday's close. Saying so beats
                      quietly answering a question that wasn't asked. */}
                  { dated.date !== dated.requested && (
                    <span className="text-ink-500"> The market was closed on { prettyDate( dated.requested ) }.</span>
                  ) }
                </p>
                {/* Same offer as the one on today's price, for the day you
                    actually bought. Left as a click rather than filled in for
                    you: a date picker gets nudged through wrong days on the way
                    to the right one, and each of those would overwrite the field. */}
                <button
                  type="button"
                  onClick={ () => setPrice( String( dated.price ) ) }
                  className="rounded-full bg-sand-200 px-2.5 py-1 font-medium text-clay-700 transition-colors hover:bg-sand-300"
                >Use as my price
                </button>
              </div>
            ) }

            { dated?.status === 'none' && (
              <p className="text-ink-500">No trading data for { ticker } that far back.</p>
            ) }

            { dated?.status === 'offline' && (
              <p className="text-ink-500">Couldn&apos;t reach the market to check that date.</p>
            ) }

          </div>

        </div>
      ) }

      {/* The offer to help, collapsed to one line. Shown while the field is
          empty, and again if what was typed turned out not to be a real symbol
          the moment you most need it. */}
      { needsSymbol && !showSearch && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-500">Not sure of the symbol or price?</span>
          <button
            type="button"
            onClick={ () => setShowSearch( true ) }
            aria-expanded={ false }
            aria-controls="stock-search-panel"
            className="rounded-xl bg-clay-500 px-2.5 py-1 font-medium text-sand-50  transition-colors hover:bg-clay-600"
          >Look it up here
          </button>
        </div>
      ) }

      { needsSymbol && showSearch && (
        <div id="stock-search-panel" className="animate-rise rounded-xl border border-sand-300 bg-sand-50 p-3">

          <div className="flex items-baseline justify-between gap-2 mb-2">
            <label htmlFor="stock-search" className={ labelClass }>Search by company name</label>
            <button
              type="button"
              onClick={ closeSearch }
              aria-label="Close company search"
              className="btn btn-sm btn-icon btn-ghost -mt-0.5"
            >
              <CloseIcon width={ 13 } height={ 13 } />
            </button>
          </div>

          <input
            id="stock-search"
            type="text"
            placeholder="e.g. Apple"
            value={ search }
            onChange={ (e) => changeSearch( e.target.value ) }
            /* Enter inside a form submits it by default, which would fire the
               half-filled form off. Here it takes the top match instead. */
            onKeyDown={ (e) => {
              if ( e.key === 'Escape' ) { closeSearch(); return }
              if ( e.key !== 'Enter' ) return
              e.preventDefault()
              const top = matches?.status === 'ok' ? matches.list[ 0 ] : null
              if ( top ) pickMatch( top.ticker )
            } }
            className={ inputClass }
            autoComplete="off"
            /* Opening the panel is a deliberate "yes", so land the cursor in
               the field rather than making it a second click. */
            autoFocus
          />

          { matches?.status === 'loading' && (
            <p className="mt-2 text-xs text-ink-500">Searching…</p>
          ) }

          { matches?.status === 'offline' && (
            <p className="mt-2 text-xs text-ink-500">Couldn&apos;t reach the market to search right now.</p>
          ) }

          { matches?.status === 'ok' && matches.list.length === 0 && (
            <p className="mt-2 text-xs text-ink-500">Nothing matched &ldquo;{ search }&rdquo;. Try the company&apos;s full name.</p>
          ) }

          { matches?.status === 'ok' && matches.list.length > 0 && (
            <ul className="mt-2 rounded-lg border border-sand-300 divide-y divide-sand-200 overflow-hidden">
              { matches.list.map( (match) => (
                <li key={ match.ticker }>
                  <button
                    type="button"
                    onClick={ () => pickMatch( match.ticker ) }
                    className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-sand-200"
                  >
                    <span className="truncate text-sm text-ink-900">{ match.name }</span>
                    <span className="shrink-0 text-xs font-semibold text-clay-700">
                      { match.ticker }
                      <span className="ml-1.5 font-normal text-ink-400">{ match.exchange }</span>
                    </span>
                  </button>
                </li>
              ) ) }
            </ul>
          ) }

        </div>
      ) }

      {/* Plain-language read-back of the numbers. The share × price arithmetic
          is the part people second-guess, so it's shown rather than implied. */}
      { hasMath && (
        <p className="mt-3 rounded-lg bg-sand-50 border border-sand-300 px-3 py-2 text-xs text-ink-700">
          { sharesNum } share{ sharesNum === 1 ? '' : 's' } at { dollars( priceNum ) } each, {' '}
          <span className="font-semibold text-ink-900">{ dollars( cost ) } invested</span>
          { gainLoss != null && (
            <>
              {', worth '}{ dollars( livePrice * sharesNum ) } today{' '}
              <span className={ gainLoss >= 0 ? 'text-gain font-medium' : 'text-loss font-medium' }>
                ({ gainLoss >= 0 ? '+' : '−' }{ dollars( Math.abs( gainLoss ) ) })
              </span>
            </>
          ) }
        </p>
      ) }

      <div className="flex gap-2 items-center mt-4">
        <button
          type="submit"
          disabled={ quote?.status === 'loading' || quote?.status === 'bad' }
          className="btn btn-primary"
        >Add stock
        </button>
        <button type="button" onClick={ onCancel } className="btn btn-ghost">Cancel</button>
      </div>

    </form>
  )
}
export default StockAssetForm
