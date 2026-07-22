import { useId } from 'react'

// A text or number input whose label sits inside the field and lifts out of it,
// one character at a time, once there's something to fill it in with.
//
// The label has to be split into per-character spans because each one carries
// its own transition delay, and that stagger is the whole effect. Everything
// else (type, value, onChange, required, min…) passes straight through to the
// input, so this stays a drop-in for one.
//
// Styling is .wave / .wave-label / .wave-char / .wave-bar in index.css. The
// label and bar are siblings *after* the input on purpose: the CSS reaches
// them with ~, which only looks forward.
function WaveInput( { label, prefix, className = '', ...inputProps } )
{
  // Falls back to a generated id so callers don't have to invent one just to
  // tie the label to the field. An id they pass wins.
  const generatedId = useId()
  const id = inputProps.id || generatedId

  return (
    <div className="wave">
      <input
        { ...inputProps }
        id={ id }
        // :not(:placeholder-shown) is what tells an empty field from a filled
        // one, and it needs a placeholder to be present at all. A single space
        // stands in when there's no example worth showing.
        placeholder={ inputProps.placeholder || ' ' }
        className={ `field ${ className }` }
      />

      <span className="wave-bar" />
      { prefix && <span className="wave-prefix">{ prefix }</span> }

      <label htmlFor={ id } className="wave-label">
        { [ ...label ].map( ( char, index ) => (
          <span key={ index } className="wave-char" style={ { '--index': index } }>{ char }</span>
        ) ) }
      </label>
    </div>
  )
}
export default WaveInput
