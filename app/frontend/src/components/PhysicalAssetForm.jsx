import { useMemo, useState } from 'react'
import { CATEGORIES, BASIC_FIELDS, categoryInfo } from '../config/assetCategories'
import WaveInput from './WaveInput'

const EMPTY = {
  name: '', category: 'vehicle', make: '', model: '', year_made: '',
  condition: 'Good', initial_value: '', purchase_year: '', location: '', details: '',
}

// The questions every item gets asked, in order. These three are what Penny
// actually needs to price something, so they're the only required ones. A
// question written as a function takes the category, so the wording names the
// thing the user picked rather than saying "it" over and over.
const CORE_STEPS = [
  {
    key: 'name', kind: 'field', type: 'text', label: 'Name', required: true,
    question: 'What is it?',
    hint: ( c ) => `Whatever you’d call it yourself. Something like “${ c.examples.name }” works well.`,
    placeholder: ( c ) => `e.g. ${ c.examples.name }`,
  },
  {
    key: 'initial_value', kind: 'field', type: 'number', label: 'What you paid', required: true,
    question: ( c ) => `What did you pay for the ${ c.noun }?`,
    hint: ( c ) => `Roughly is fine. Penny compares it against what the ${ c.noun } is worth now.`,
    placeholder: '14000', prefix: '$',
  },
  {
    key: 'purchase_year', kind: 'field', type: 'number', label: 'Year bought', required: true,
    question: ( c ) => `What year did you buy the ${ c.noun }?`,
    hint: 'Age is most of what decides how much something has held its value.',
    placeholder: '2021', min: '1900',
  },
]

// Asked last, after the category's own questions, because they apply to
// anything and neither one is worth leading with.
const TAIL_STEPS = [
  {
    key: 'location', kind: 'field', type: 'text', label: 'Location',
    question: ( c ) => `Where is the ${ c.noun }?`,
    hint: 'Worth answering for property and land, where the market is local.',
    placeholder: 'Boston, MA',
  },
  {
    key: 'details', kind: 'field', type: 'text', label: 'Notes',
    question: ( c ) => `Anything else Penny should know about the ${ c.noun }?`,
    hint: 'Damage, upgrades, anything unusual about it.',
    placeholder: ( c ) => `Anything unusual about the ${ c.noun }`,
  },
]

function PhysicalAssetForm( { onSubmit, onCancel } )
{
  const [form, setForm] = useState( EMPTY )
  const [specs, setSpecs] = useState( {} )
  const [stepIndex, setStepIndex] = useState( 0 )
  const info = categoryInfo( form.category )

  // One question per entry. Rebuilt when the category changes because the
  // answer to the first question is what decides which questions come after
  // it, a plot of land is never asked for its mileage.
  const steps = useMemo( () => {
    // A question can be written as a function of the category so it can name
    // the thing being added. Resolving it here, as the steps are built, means
    // the rest of the component still only ever sees plain strings.
    const fill = ( def ) => ( {
      ...def,
      question: typeof def.question === 'function' ? def.question( info ) : def.question,
      hint: typeof def.hint === 'function' ? def.hint( info ) : def.hint,
      placeholder: typeof def.placeholder === 'function' ? def.placeholder( info ) : def.placeholder,
    } )

    const basics = info.basics
      .map( ( key ) => [ key, BASIC_FIELDS[ key ] ] )
      .filter( ( [ , def ] ) => def )
      .map( ( [ key, def ] ) => fill( { ...def, key, kind: 'field' } ) )

    const specSteps = info.specs.map( ( spec ) => fill( { ...spec, kind: 'spec' } ) )

    return [
      {
        key: 'category', kind: 'category', label: 'Kind',
        question: 'What kind of item is it?',
        hint: 'Pick one and Penny will only ask what matters for that kind of thing.',
      },
      ...CORE_STEPS.map( fill ),
      ...basics,
      ...specSteps,
      ...TAIL_STEPS.map( fill ),
      {
        key: 'review', kind: 'review', label: 'Review',
        question: 'Here’s what you told Penny',
        hint: `Add it and Penny will estimate what the ${ info.noun } is worth today.`,
      },
    ]
  }, [ info ] )

  const step = steps[ stepIndex ]
  const isReview = step.kind === 'review'

  // Specs live in their own object because they're stored as a free-form blob
  // on the item rather than as columns, so reading and writing a step's answer
  // depends on which half it belongs to.
  // A 'multi' step's answer is the list of boxes ticked, so an untouched one
  // starts as an empty array rather than an empty string.
  const blank = step.type === 'multi' ? [] : ''
  const answer = step.kind === 'spec' ? ( specs[ step.key ] || blank ) : form[ step.key ]

  function setAnswer( value )
  {
    if ( step.kind === 'spec' ) setSpecs( ( prev ) => ( { ...prev, [ step.key ]: value } ) )
    else setForm( ( prev ) => ( { ...prev, [ step.key ]: value } ) )
  }

  // Ticking adds, unticking removes. Rebuilt rather than mutated so React sees
  // a new array and re-renders.
  function toggleOption( option )
  {
    setAnswer( answer.includes( option )
      ? answer.filter( ( o ) => o !== option )
      : [ ...answer, option ] )
  }

  function pickCategory( key )
  {
    setForm( ( prev ) => ( { ...prev, category: key } ) )
    setSpecs( {} )   // the extra questions are different per category, so start fresh
    setStepIndex( 1 )   // answering this one is the whole interaction, so move on
  }

  // Enter and the Next button both land here: the form only really submits on
  // the last step, and until then a submit means "next question". Going
  // through the form's own submit rather than a plain click handler is what
  // makes the browser check `required` on the field currently showing.
  function handleSubmit( e )
  {
    e.preventDefault()

    if ( !isReview )
    {
      setStepIndex( ( i ) => i + 1 )
      return
    }

    // drop any spec the user left blank so we don't send empty strings to
    // Penny, or an empty list from a multi-select nobody ticked
    const cleaned = Object.fromEntries(
      Object.entries( specs ).filter( ( [ , v ] ) =>
        v !== '' && v != null && !( Array.isArray( v ) && v.length === 0 ) )
    )

    // Only send the built-in fields this category actually asked for. A value
    // left over from a different category, say a car's make, before the user
    // switched the item to Land. Shouldn't ride along on the submission.
    const asks = ( key ) => info.basics.includes( key )

    onSubmit( {
      name: form.name,
      category: form.category,
      make: asks( 'make' ) && form.make ? form.make : null,
      model: asks( 'model' ) && form.model ? form.model : null,
      year_made: asks( 'year_made' ) && form.year_made ? parseInt( form.year_made ) : null,
      condition: asks( 'condition' ) ? ( form.condition || null ) : null,
      specs: cleaned,
      initial_value: parseFloat( form.initial_value ),
      purchase_year: parseInt( form.purchase_year ),
      location: form.location || null,
      details: form.details || null,
    } )
    setForm( EMPTY )
    setSpecs( {} )
    setStepIndex( 0 )
  }

  // .field carries the look, in index.css alongside the other shared controls.
  // The focus ring on top of it is the global :focus-visible rule there.
  const inputClass = "field w-full text-sm"

  // One field, sized to its answer rather than stretched across the card: a
  // year in a full-width box invites a paragraph. A grid of checkboxes is the
  // one thing here that wants the room.
  const fieldWidth = step.type === 'multi' ? 'max-w-xl'
    : step.type === 'text' ? 'max-w-md'
    : 'max-w-40'

  // What the primary button says. "Skip" rather than "Next" on an untouched
  // optional question, so it's clear that moving on without answering is a
  // real option and not something being lost.
  // An empty array is truthy, so a multi-select with nothing ticked has to be
  // tested by length or it would read as answered.
  const unanswered = Array.isArray( answer ) ? answer.length === 0 : !answer
  const nextLabel = !step.required && unanswered ? 'Skip' : 'Next'

  // Read-back on the last step: the category, then only the questions that got
  // an answer. Listing the blanks too would bury the handful of things
  // actually filled in. index is kept so a row can send you back to its own
  // question rather than making you step backwards through the rest.
  // A list of ticked boxes is flattened to text here, which also turns an
  // empty one into '' so the filter below drops it like any other blank.
  const answered = steps
    .map( ( s, index ) => {
      const value = s.kind === 'spec' ? specs[ s.key ] : form[ s.key ]
      return { ...s, index, value: Array.isArray( value ) ? value.join( ', ' ) : value }
    } )
    .filter( ( row ) => ( row.kind === 'field' || row.kind === 'spec' ) && row.value !== '' && row.value != null )

  const CategoryIcon = info.icon

  const summary = [
    {
      key: 'category', label: 'Kind', index: 0,
      value: (
        <span className="inline-flex items-center gap-1.5">
          <CategoryIcon className="h-4 w-4" /> { info.label }
        </span>
      ),
    },
    ...answered,
  ]

  return (
    <form onSubmit={ handleSubmit } className="animate-rise bg-sand-200/50 rounded-2xl border border-sand-100 p-5 mb-5">

      {/* Progress. A wizard with no sense of length reads as an endless form,
          and the count is honest here because every remaining step is already
          decided once the category is picked. */}
      <div className="flex items-center gap-3 mb-4">
        <p className="text-sm font-medium text-ink-900">Add an item</p>
        <div className="h-1 flex-1 rounded-full bg-sand-300 overflow-hidden">
          <div
            className="h-full bg-clay-700 rounded-full transition-[width] duration-300 ease-out"
            style={ { width: `${ ( stepIndex / ( steps.length - 1 ) ) * 100 }%` } }
          />
        </div>
        <p className="text-xs text-ink-500 tabular-nums shrink-0">
          { stepIndex + 1 } of { steps.length }
        </p>
      </div>

      {/* Keyed on the step so each question animates in as its own thing, and
          so the input below remounts and takes focus rather than carrying the
          previous question's cursor position. */}
      <div key={ step.key } className="animate-rise">

        <h4 className="text-base font-medium text-ink-900">{ step.question || step.label }</h4>
        <p className="text-xs text-ink-500 mt-0.5 mb-3">
          { step.hint || ( step.required ? 'Penny needs this one.' : 'Optional, but it sharpens the estimate.' ) }
        </p>

        { step.kind === 'category' && (
          <div className="flex flex-wrap gap-2">
            { Object.entries( CATEGORIES ).map( ( [ key, cat ] ) => {
              const Icon = cat.icon
              return (
                <button
                  key={ key }
                  type="button"
                  onClick={ () => pickCategory( key ) }
                  aria-pressed={ form.category === key }
                  className={ `flex items-center gap-1.5 text-sm rounded-full px-3 py-1.5 ring-1 transition-colors ${
                    form.category === key
                      ? 'bg-clay-700 text-sand-50 ring-clay-700'
                      : 'bg-sand-50 text-ink-700 ring-sand-300 hover:bg-sand-200 hover:ring-sand-400'
                  }` }
                >
                  <Icon className="h-4 w-4" /> { cat.label }
                </button>
              )
            } ) }
          </div>
        ) }

        { ( step.kind === 'field' || step.kind === 'spec' ) && (
          <div className={ fieldWidth }>
            { step.type === 'multi' ? (
              // Boxes rather than chips: several of these are normally ticked
              // at once, and a checkbox says "as many as apply" where a chip
              // row reads as pick-one. .check / .check-tile live in index.css.
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                { step.options.map( ( option ) => (
                  <label key={ option } className="flex items-center gap-2.5 text-sm text-ink-700 cursor-pointer w-fit">
                    <span className="check shrink-0">
                      <input
                        type="checkbox"
                        checked={ answer.includes( option ) }
                        onChange={ () => toggleOption( option ) }
                      />
                      <span className="check-tile" />
                    </span>
                    { option }
                  </label>
                ) ) }
              </div>
            ) : step.type === 'select' ? (
              <select
                value={ answer || '' }
                onChange={ (e) => setAnswer( e.target.value ) }
                className={ inputClass }
                autoFocus
              >
                {/* A basic like Condition always has an answer, a category spec
                    is opt-in and so needs an empty choice to sit on. */}
                { step.kind === 'spec' && <option value="">—</option> }
                { step.options.map( (o) => <option key={o} value={o}>{o}</option> ) }
              </select>
            ) : (
              // The step's short label ("Year bought") rather than its
              // question, which is already the heading above. A prefixed field
              // is indented so the $ that fades in has somewhere to sit.
              <WaveInput
                label={ step.label }
                prefix={ step.prefix }
                type={ step.type }
                placeholder={ step.placeholder || '' }
                value={ answer || '' }
                onChange={ (e) => setAnswer( e.target.value ) }
                className={ step.prefix ? 'pl-4 text-sm' : 'text-sm' }
                required={ step.required }
                { ...( step.type === 'number' ? { min: step.min || '0', step: 'any' } : {} ) }
                autoFocus
              />
            ) }
          </div>
        ) }

        { isReview && (
          <>
            {/* Rows are buttons rather than a description list: dt and dd have
                to be direct children of the dl, so they can't sit inside the
                button that makes the row clickable. */}
            <div className="rounded-xl border border-sand-300 bg-sand-50 divide-y divide-sand-200 overflow-hidden">
              { summary.map( ( row ) => (
                <button
                  key={ row.key }
                  type="button"
                  onClick={ () => setStepIndex( row.index ) }
                  className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-sand-200"
                >
                  <span className="text-xs text-ink-500 shrink-0">{ row.label }</span>
                  <span className="text-sm text-ink-900 truncate">{ row.value }</span>
                </button>
              ) ) }
            </div>
            <p className="text-xs text-ink-500 mt-2">Tap any line to change it.</p>
          </>
        ) }

      </div>

      <div className="flex gap-2 items-center mt-5">
        {/* The category step has no Next: picking a chip is the answer and
            moves you on, so a Next button there would either do nothing or
            silently accept a default nobody chose. */}
        { step.kind !== 'category' && (
          <button
            type="submit"
            className="bg-clay-700 text-sand-50 font-medium px-4 py-2 rounded-lg text-sm hover:bg-clay-800 transition-colors"
          >
            { isReview ? 'Add item' : nextLabel }
          </button>
        ) }
        { stepIndex > 0 && (
          <button
            type="button"
            onClick={ () => setStepIndex( ( i ) => i - 1 ) }
            className="text-ink-500 text-sm hover:text-ink-900 px-2 py-2 transition-colors"
          >Back
          </button>
        ) }
        <button type="button" onClick={ onCancel } className="text-ink-500 text-sm hover:text-ink-900 px-2 py-2 transition-colors">Cancel</button>
      </div>

    </form>
  )
}
export default PhysicalAssetForm
