import { useState } from 'react'
import { CATEGORIES, CONDITIONS, categoryInfo } from '../config/assetCategories'

const EMPTY = {
  name: '', category: 'vehicle', make: '', model: '', year_made: '',
  condition: 'Good', initial_value: '', purchase_year: '', location: '', details: '',
}

function PhysicalAssetForm( { onSubmit, onCancel } ) 
{
  const [form, setForm] = useState( EMPTY )
  const [specs, setSpecs] = useState( {} )
  const info = categoryInfo( form.category )

  function setField( key, value ) 
  {
    setForm( ( prev ) => ( { ...prev, [key]: value } ) )
  }

  function pickCategory( key ) 
  {
    setForm( ( prev ) => ( { ...prev, category: key } ) )
    setSpecs( {} )   // the extra fields are different per category, so start fresh
  }

  function handleSubmit( e ) 
  {
    e.preventDefault()
    // drop any spec the user left blank so we don't send empty strings to Penny
    const cleaned = Object.fromEntries(
      Object.entries( specs ).filter( ( [ , v ] ) => v !== '' && v != null )
    )
    onSubmit( {
      name: form.name,
      category: form.category,
      make: form.make || null,
      model: form.model || null,
      year_made: form.year_made ? parseInt( form.year_made ) : null,
      condition: form.condition || null,
      specs: cleaned,
      initial_value: parseFloat( form.initial_value ),
      purchase_year: parseInt( form.purchase_year ),
      location: form.location || null,
      details: form.details || null,
    } )
    setForm( EMPTY )
    setSpecs( {} )
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
  const labelClass = "block text-xs font-medium text-gray-500 mb-1"

  return (
    <form onSubmit={ handleSubmit } className="bg-gray-50 rounded-2xl border border-gray-200 p-5 mb-5">

      {/* Category chips */}
      <label className={ labelClass }>What kind of item is it?</label>
      <div className="flex flex-wrap gap-2 mb-5">
        { Object.entries( CATEGORIES ).map( ( [ key, cat ] ) => (
          <button
            key={ key }
            type="button"
            onClick={ () => pickCategory( key ) }
            className={ `flex items-center gap-1.5 text-sm rounded-full px-3 py-1.5 ring-1 transition-colors ${
              form.category === key
                ? 'bg-blue-900 text-white ring-blue-900'
                : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-100'
            }` }
          >
            <span>{ cat.icon }</span> { cat.label }
          </button>
        ) ) }
      </div>

      {/* The fields every item has */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div className="col-span-2">
          <label className={ labelClass }>Name</label>
          <input type="text" placeholder="2015 Toyota Camry" value={ form.name }
            onChange={ (e) => setField( 'name', e.target.value ) } className={ inputClass } required />
        </div>
        <div>
          <label className={ labelClass }>Make / brand</label>
          <input type="text" placeholder="Toyota" value={ form.make }
            onChange={ (e) => setField( 'make', e.target.value ) } className={ inputClass } />
        </div>
        <div>
          <label className={ labelClass }>Model</label>
          <input type="text" placeholder="Camry" value={ form.model }
            onChange={ (e) => setField( 'model', e.target.value ) } className={ inputClass } />
        </div>
        <div>
          <label className={ labelClass }>Model year</label>
          <input type="number" placeholder="2015" value={ form.year_made }
            onChange={ (e) => setField( 'year_made', e.target.value ) } className={ inputClass } min="1800" />
        </div>
        <div>
          <label className={ labelClass }>Condition</label>
          <select value={ form.condition } onChange={ (e) => setField( 'condition', e.target.value ) } className={ inputClass }>
            { CONDITIONS.map( (c) => <option key={c} value={c}>{c}</option> ) }
          </select>
        </div>
        <div>
          <label className={ labelClass }>Paid ($)</label>
          <input type="number" placeholder="14000" value={ form.initial_value }
            onChange={ (e) => setField( 'initial_value', e.target.value ) } className={ inputClass } step="any" min="0" required />
        </div>
        <div>
          <label className={ labelClass }>Year bought</label>
          <input type="number" placeholder="2021" value={ form.purchase_year }
            onChange={ (e) => setField( 'purchase_year', e.target.value ) } className={ inputClass } min="1900" required />
        </div>
      </div>

      {/* The fields that only apply to this category */}
      { info.specs.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mb-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">{ info.label } details</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            { info.specs.map( (spec) => (
              <div key={ spec.key }>
                <label className={ labelClass }>{ spec.label }</label>
                { spec.type === 'select' ? (
                  <select
                    value={ specs[ spec.key ] || '' }
                    onChange={ (e) => setSpecs( { ...specs, [spec.key]: e.target.value } ) }
                    className={ inputClass }
                  >
                    <option value="">—</option>
                    { spec.options.map( (o) => <option key={o} value={o}>{o}</option> ) }
                  </select>
                ) : (
                  <input
                    type={ spec.type }
                    placeholder={ spec.placeholder || '' }
                    value={ specs[ spec.key ] || '' }
                    onChange={ (e) => setSpecs( { ...specs, [spec.key]: e.target.value } ) }
                    className={ inputClass }
                    step="any"
                  />
                ) }
              </div>
            ) ) }
          </div>
        </div>
      ) }

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className={ labelClass }>Location</label>
          <input type="text" placeholder="Boston, MA" value={ form.location }
            onChange={ (e) => setField( 'location', e.target.value ) } className={ inputClass } />
        </div>
        <div>
          <label className={ labelClass }>Notes</label>
          <input type="text" placeholder="Anything else Penny should know" value={ form.details }
            onChange={ (e) => setField( 'details', e.target.value ) } className={ inputClass } />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition-colors">Add item</button>
        <button type="button" onClick={ onCancel } className="text-gray-400 text-sm hover:text-gray-600 px-2">Cancel</button>
      </div>

    </form>
  )
}
export default PhysicalAssetForm
