import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import RisingLines from '../components/RisingLines'
import { SparkIcon } from '../components/icons'

import stockImage from '../assets/stock-image.png'
import homeImage from '../assets/home-image.png'
import aiImage from '../assets/ai-image.png'

// The public front door. Before this, "/" bounced straight to the login form,
// which gave a first-time visitor no idea what Penny is. This explains the app,
// offers the two ways in, and carries the privacy notice at the foot.
//
// The three features mirror what the dashboard actually does. Like stocks, physical
// belongings, and the AI insight, so the pitch matches the product.
const FEATURES = [
  {
    icon  : stockImage,
    title : 'Stocks & assets',
    body  : 'Track your holdings with live market prices, and see gain or loss at a glance.',
  },
  {
    icon  : homeImage,
    title : 'Real-world belongings',
    body  : 'Add a car, home, piece of jewelry, or gear, and let Penny estimate what it is worth today.',
  },
  {
    icon  : aiImage,
    title : 'AI insight',
    body  : 'Penny reviews your whole portfolio and points out what stands out and what you could do next.',
  },
]

function Landing()
{
  // Whether there's a saved session. We deliberately do NOT auto-redirect a
  // signed-in visitor to the dashboard: a stale or expired token would bounce
  // through the dashboard and land them on the login page, which made the front
  // page look like it "always opens to login". Instead the front page always
  // renders, and the call to action simply adapts to point at the dashboard.
  const signedIn = Boolean( localStorage.getItem( 'token' ) )

  return (
    <div className="min-h-screen flex flex-col bg-sand-100">

      {/* Slim top bar: brand on the left, a quiet way in on the right. */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4">
        <Logo />
        <Link
          to={ signedIn ? '/dashboard' : '/login' }
          className="text-sm font-medium text-clay-700 hover:text-clay-800 px-3 py-2 rounded-lg bg-sand-50 hover:bg-sand-200 transition-colors"
        >{ signedIn ? 'My dashboard' : 'Sign in' }
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1">

        {/* The rising lines are a full-bleed band, so they run edge to edge
            behind the centred copy instead of stopping at its column. */}
        <div className="relative overflow-hidden">
          <RisingLines />

          <section className="relative max-w-3xl mx-auto px-4 sm:px-8 text-center pt-12 sm:pt-20 pb-28 sm:pb-36">

            <h1 className="text-4xl sm:text-5xl font-bold text-ink-900 tracking-tight leading-tight">
              All your investments,<br className="hidden sm:block" /> tracked together.
            </h1>

            <p className="text-base sm:text-lg text-ink-500 mt-5 max-w-xl mx-auto leading-relaxed">
              Penny brings your stocks and your real-world belongings into one view. Then
              estimates what it is all worth and tells you what matters.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              { signedIn ? (
                // Already has a session: one button straight through to their data.
                <Link
                  to="/dashboard"
                  className="bg-clay-700 text-sand-50 font-medium px-6 py-3 rounded-xl text-sm hover:bg-clay-800 transition-colors"
                >Go to your dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-clay-700 text-sand-50 font-medium px-6 py-3 rounded-xl text-sm hover:bg-clay-800 transition-colors"
                  >Create your account
                  </Link>
                  <Link
                    to="/login"
                    className="bg-sand-50 text-ink-900 font-medium px-6 py-3 rounded-xl text-sm hover:bg-sand-200 transition-colors"
                  >Sign in
                  </Link>
                </>
              ) }
            </div>

          </section>
        </div>

        {/* What it does */}
        <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-16">
          <div className="grid gap-4 md:grid-cols-3">
            { FEATURES.map( (f) => (
              <div key={ f.title } className="bg-sand-50 rounded-2xl p-6 shadow-sm shadow-clay-800/5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sand-200 text-xl mb-4">
                  { f.icon.endsWith( 'png' )
                    ? <img src={ f.icon } alt={ f.title } className="h-6 w-6 object-contain" />
                    : f.icon }
                </div>
                <h2 className="font-semibold text-ink-900">{ f.title }</h2>
                <p className="text-sm text-ink-500 mt-1.5 leading-relaxed">{ f.body }</p>
              </div>
            ) ) }
          </div>
        </section>
      </main>

      {/* Privacy notice. Kept honest and plain: Penny is a student project, the
          estimates are AI approximations, and the data isn't sold on. */}
      <footer className="border-t border-sand-300 mt-auto">
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
export default Landing
