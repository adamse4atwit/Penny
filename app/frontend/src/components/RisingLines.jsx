// Decorative background for the landing hero: a bundle of thin lines that all
// start tightly packed at the lower left and fan upward to the right, so the
// page reads as "value going up" before a word of copy is read.
//
// It is drawn rather than shipped as an image so it stays crisp at any width,
// picks up the clay accent from the theme, and costs no extra request. It is
// purely decorative, so it is hidden from assistive tech and ignores clicks.

// One entry per line. Everything below is derived from the index, which keeps
// the fan even. Widen the count for a denser bundle.
const LINES = Array.from( { length: 28 }, ( _, i ) => i )

function RisingLines()
{
  return (
    <svg
      // The viewBox is deliberately about 4:1, matching the band's own aspect
      // ratio. preserveAspectRatio="none" is what lets the artwork stretch to
      // any window width, but it also means a viewBox shaped differently from
      // the band gets visibly squashed. Keeping the two in step means the
      // curves keep their shape from phone to widescreen.
      viewBox="0 0 1200 300"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-56 sm:h-80 w-full text-clay-500"
    >
      <defs>
        {/* Without this the bundle begins as 28 hard-cut horizontal stubs
            against the left edge, and the band's own overflow shears the
            lowest lines off flat. Fading both edges to nothing lets the fan
            emerge from the page and dissolve back into it. */}
        <linearGradient id="rising-lines-fade" x1="0" y1="0" x2="1" y2="0.55">
          <stop offset="0"    stopColor="white" stopOpacity="0" />
          <stop offset="0.28" stopColor="white" stopOpacity="1" />
          <stop offset="1"    stopColor="white" stopOpacity="1" />
        </linearGradient>
        <mask id="rising-lines-mask">
          <rect width="1200" height="300" fill="url(#rising-lines-fade)" />
        </mask>
      </defs>

      <g mask="url(#rising-lines-mask)">
      { LINES.map( ( i ) => (
        <path
          key={ i }
          // Lines leave the frame on both sides so the fan has no visible ends.
          // The pair of control points holds each line flat for the first third
          // and then lifts it, which is what gives the sweep its curve.
          //
          // Index 0 is the bottom line and 27 the top, at both ends, so the
          // lines never cross. The left edge is spread over ~90 units rather
          // than bunched: packed any tighter, 28 near-transparent strokes
          // merge into one smudge and the left half of the band reads as empty.
          d={ `M -40 ${ 290 - i * 3.2 }
               C 420 ${ 292 - i * 3.2 },
                 780 ${ 272 - i * 5.6 },
                 1240 ${ 240 - i * 8.0 }` }
          fill="none"
          stroke="currentColor"
          // Do not add vectorEffect="non-scaling-stroke" here. Combined with
          // preserveAspectRatio="none" above, Chromium rasterises the path in
          // unscaled user space: the artwork silently stops at 1240px however
          // wide the window is, leaving a bare strip down the right of the page.
          strokeWidth={ 1.25 }
          // Faintest at the bottom of the bundle, strongest at the top edge,
          // so the eye is pulled along the rise instead of into the mass.
          strokeOpacity={ 0.10 + i * 0.011 }
          // pathLength normalises every curve to 1 unit, so a single dash
          // pattern draws all of them evenly regardless of true arc length.
          pathLength={ 1 }
          strokeDasharray={ 1 }
          className="animate-draw"
          style={ { animationDelay: `${ i * 35 }ms` } }
        />
      ) ) }
      </g>
    </svg>
  )
}
export default RisingLines
