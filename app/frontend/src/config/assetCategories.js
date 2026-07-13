// Category definitions. These drive the icon, the badge color, and which
// extra fields show up on the add-item form for that kind of thing.

export const CATEGORIES = {
  vehicle : {
    label : 'Vehicle',
    icon  : '',
    badge : 'bg-sky-50 text-sky-700 ring-sky-200',
    specs : [
      { key: 'mileage',    label: 'Mileage',    type: 'number', placeholder: '68000' },
      { key: 'trim',       label: 'Trim',       type: 'text',   placeholder: 'SE, Limited…' },
      { key: 'drivetrain', label: 'Drivetrain', type: 'select', options: [ 'FWD', 'RWD', 'AWD', '4WD' ] },
      { key: 'accidents',  label: 'Accidents',  type: 'select', options: [ 'None', 'Minor', 'Major' ] },
    ],
  },
  real_estate : {
    label : 'Real Estate',
    icon  : '',
    badge : 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    specs : [
      { key: 'square_feet', label: 'Square feet', type: 'number', placeholder: '1850' },
      { key: 'bedrooms',    label: 'Bedrooms',    type: 'number', placeholder: '3' },
      { key: 'bathrooms',   label: 'Bathrooms',   type: 'number', placeholder: '2' },
      { key: 'year_built',  label: 'Year built',  type: 'number', placeholder: '1994' },
      { key: 'upgrades',    label: 'Upgrades',    type: 'text',   placeholder: 'New roof, kitchen…' },
    ],
  },
  land : {
    label : 'Land',
    icon  : '',
    badge : 'bg-lime-50 text-lime-700 ring-lime-200',
    specs : [
      { key: 'acres',   label: 'Acres',   type: 'number', placeholder: '2.5' },
      { key: 'zoning',  label: 'Zoning',  type: 'text',   placeholder: 'Residential' },
      { key: 'utilities', label: 'Utilities', type: 'select', options: [ 'Yes', 'No' ] },
    ],
  },
  boat : {
    label : 'Boat',
    icon  : '',
    badge : 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    specs : [
      { key: 'length_ft',    label: 'Length (ft)',  type: 'number', placeholder: '22' },
      { key: 'engine_hours', label: 'Engine hours', type: 'number', placeholder: '350' },
      { key: 'hull',         label: 'Hull',         type: 'select', options: [ 'Fiberglass', 'Aluminum', 'Wood' ] },
    ],
  },
  jewelry : {
    label : 'Jewelry',
    icon  : '',
    badge : 'bg-rose-50 text-rose-700 ring-rose-200',
    specs : [
      { key: 'metal',    label: 'Metal',    type: 'select', options: [ 'Gold', 'White gold', 'Silver', 'Platinum', 'Steel' ] },
      { key: 'gemstone', label: 'Gemstone', type: 'text',   placeholder: 'Diamond' },
      { key: 'carat',    label: 'Carat',    type: 'number', placeholder: '1.2' },
      { key: 'papers',   label: 'Papers / cert', type: 'select', options: [ 'Yes', 'No' ] },
    ],
  },
  electronics : {
    label : 'Electronics',
    icon  : '',
    badge : 'bg-violet-50 text-violet-700 ring-violet-200',
    specs : [
      { key: 'storage',  label: 'Storage / specs', type: 'text', placeholder: '512GB, M2 Pro' },
      { key: 'box',      label: 'Original box',    type: 'select', options: [ 'Yes', 'No' ] },
      { key: 'warranty', label: 'Warranty left',   type: 'select', options: [ 'Yes', 'No' ] },
    ],
  },
  collectible : {
    label : 'Collectible',
    icon  : '',
    badge : 'bg-amber-50 text-amber-700 ring-amber-200',
    specs : [
      { key: 'grade',    label: 'Grade',        type: 'text', placeholder: 'PSA 9' },
      { key: 'edition',  label: 'Edition / #',  type: 'text', placeholder: '1st ed, 42/500' },
      { key: 'graded_by', label: 'Graded by',   type: 'text', placeholder: 'PSA, BGS…' },
    ],
  },
  art : {
    label : 'Art',
    icon  : '',
    badge : 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
    specs : [
      { key: 'artist',     label: 'Artist',     type: 'text', placeholder: 'Artist name' },
      { key: 'medium',     label: 'Medium',     type: 'text', placeholder: 'Oil on canvas' },
      { key: 'dimensions', label: 'Dimensions', type: 'text', placeholder: '24 x 36 in' },
      { key: 'signed',     label: 'Signed',     type: 'select', options: [ 'Yes', 'No' ] },
    ],
  },
  instrument : {
    label : 'Instrument',
    icon  : '',
    badge : 'bg-orange-50 text-orange-700 ring-orange-200',
    specs : [
      { key: 'serial', label: 'Serial number', type: 'text', placeholder: 'US20…' },
      { key: 'case',   label: 'Hard case',     type: 'select', options: [ 'Yes', 'No' ] },
    ],
  },
  equipment : {
    label : 'Equipment',
    icon  : '',
    badge : 'bg-slate-100 text-slate-700 ring-slate-200',
    specs : [
      { key: 'hours_used', label: 'Hours used', type: 'number', placeholder: '120' },
      { key: 'serial',     label: 'Serial number', type: 'text', placeholder: 'Optional' },
    ],
  },
  other : {
    label : 'Other',
    icon  : '',
    badge : 'bg-gray-100 text-gray-700 ring-gray-200',
    specs : [],
  },
}

export const CONDITIONS = [ 'Excellent', 'Good', 'Fair', 'Poor' ]

export function categoryInfo( key ) 
{
  return CATEGORIES[ key ] || CATEGORIES.other
}

export function money( n ) 
{
  if ( n == null ) return '—'
  return n.toLocaleString( 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } )
}

// What an item is worth right now: the middle of Penny's range, or what you paid if not estimated yet.
export function currentValue( item ) 
{
  if ( item.est_low != null && item.est_high != null ) return ( item.est_low + item.est_high ) / 2
  return item.initial_value
}
