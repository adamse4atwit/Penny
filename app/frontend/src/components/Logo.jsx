import lockupUrl from '../assets/pennylogo-text.svg'
const markUrl = '/pennylogo.svg'

// The Penny brand mark. Login, Register and the dashboard navbar were each
// carrying their own copy of this markup, which meant three places to edit
// every time the brand changed. Now it lives here.
//
// `variant` picks the artwork: 'lockup' is the coin plus the PENNY wordmark,
// 'mark' is the bare coin for tight spaces where the words wouldn't read.
//
// `tone` picks which surface the mark is sitting on: 'light' for the tan
// pages, 'dark' for the clay navbar. The art is a single gold, which all but
// disappears on clay-700, so the dark tone knocks it out to white instead
// brightness-0 flattens it to black, then invert lifts it to white.

const HEIGHTS = {
  sm : 'h-6',
  md : 'h-8',
  lg : 'h-11',
}

function Logo( { tone = 'light', size = 'md', variant = 'lockup' } )
{
  const isDark = tone === 'dark'
  const height = HEIGHTS[ size ] ?? HEIGHTS.md

  return (
    <img
      src={ variant === 'mark' ? markUrl : lockupUrl }
      alt="Penny"
      className={ `${height} w-auto shrink-0 ${ isDark ? 'brightness-0 invert' : '' }` }
    />
  )
}
export default Logo
