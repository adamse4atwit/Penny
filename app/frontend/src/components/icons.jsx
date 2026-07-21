// Small inline SVG icons.
//
// Kept inline instead of pulling in an icon package: only the handful below
// are used, and each ships as a couple of paths, so a dependency would cost
// more bundle than it saves. Every icon inherits the surrounding text color
// via `currentColor`, so they tint themselves from whatever `text-*` class the
// button already has. Sizes come from `base` but a `className` of `h-* w-*`
// overrides them, since CSS outranks the width/height attributes.
//
// These replace the literal "x" characters the delete buttons used to render,
// which screen readers announced as the letter x.

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,   // the button's own aria-label carries the meaning
}

export function TrashIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function CloseIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

export function PlusIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

// Collapse toggle on each portfolio card. Points down when the card is open
// and is rotated to point right when it's collapsed, so one glyph covers both
// states and the rotation animates.
export function ChevronIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

// Used on the AI insight button and panel heading.
export function SparkIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
    </svg>
  )
}

// Category glyphs for the physical-item categories. Same stroked style as the
// icons above so a chip row of them reads as one set, and the same
// `currentColor` inheritance so they invert along with the chip when it's the
// selected one — which is the reason these are inline SVG rather than the PNGs
// the landing page uses.

export function CarIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Z" />
      <path d="M3 13h18M7 15.5h.01M17 15.5h.01" />
    </svg>
  )
}

export function HomeIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M10 21v-6h4v6" />
    </svg>
  )
}

export function LandIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <path d="M3 20h18" />
      <path d="m4 16 4-5 3 3.5L15 8l5 8" />
    </svg>
  )
}

export function BoatIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <path d="M11 3 5 14h6z" />
      <path d="M13 6v8h6z" />
      <path d="M3 17h18l-2.5 4H5.5L3 17Z" />
    </svg>
  )
}

export function GemIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <path d="M6 3h12l3 6-9 12L3 9l3-6Z" />
      <path d="M3 9h18M9 3 6 9l6 12 6-12-3-6" />
    </svg>
  )
}

export function LaptopIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <path d="M4 5h16a1 1 0 0 1 1 1v10H3V6a1 1 0 0 1 1-1Z" />
      <path d="M2 19h20" />
    </svg>
  )
}

export function CardsIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <rect x="9" y="3" width="10" height="14" rx="1.5" />
      <path d="M15 20H6.5A1.5 1.5 0 0 1 5 18.5V7" />
    </svg>
  )
}

export function FrameIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m6 16 4-4 3 3 2-2 3 3M9 9h.01" />
    </svg>
  )
}

export function NoteIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <path d="M9 18V5l12-2v13" />
      <path d="M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3ZM21 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" />
    </svg>
  )
}

export function WrenchIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
    </svg>
  )
}

export function BoxIcon( props )
{
  return (
    <svg { ...base } { ...props }>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12M7.5 4.27l9 5.15" />
    </svg>
  )
}

// The Apple mark on the sign-in button. It doesn't use `base` because the logo
// is a solid shape rather than a stroked outline, and it sits slightly larger
// than the others so it optically matches the text next to it.
export function AppleIcon( props )
{
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" { ...props }>
      <path d="M17.05 12.536c-.024-2.69 2.196-3.98 2.296-4.043-1.25-1.83-3.194-2.08-3.885-2.108-1.654-.167-3.23.973-4.07.973-.84 0-2.135-.949-3.51-.923-1.806.027-3.47 1.05-4.398 2.665-1.874 3.253-.479 8.066 1.345 10.705.892 1.292 1.955 2.742 3.35 2.69 1.344-.053 1.852-.87 3.478-.87 1.626 0 2.083.87 3.505.844 1.446-.026 2.362-1.316 3.246-2.612 1.023-1.498 1.444-2.947 1.468-3.021-.032-.014-2.818-1.081-2.846-4.29ZM14.5 4.9c.74-.9 1.24-2.152 1.104-3.4-1.067.043-2.36.711-3.126 1.61-.686.796-1.287 2.07-1.126 3.292 1.192.092 2.408-.605 3.148-1.502Z" />
    </svg>
  )
}
