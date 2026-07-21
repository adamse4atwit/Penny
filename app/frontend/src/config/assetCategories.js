// Category definitions. These drive the icon, the badge color, and which
// extra fields show up on the add-item form for that kind of thing.
//
// `icon` is a component, not a glyph, so a call site renders it as <Icon />
// rather than printing it. That's what lets an icon take the chip's text color
// when the chip is the selected one.
//
// `basics` lists which of the built-in item fields (make / model / model year /
// condition) are worth asking for this category, beyond the three essentials
// every item needs (name, what you paid, the year you bought it). A plot of
// land has no make or model, so it simply doesn't list them and the form never
// shows them. `specs` holds the extra, category-only fields.
//
// `noun` is what the form calls this kind of thing mid-sentence ("What did you
// pay for the boat?"), and `examples` supplies the placeholder text, so a
// question never shows a car as the example for a painting.
//
// The badge hues are kept to the warm half of the wheel (plus a
// couple of muted cools) so a grid of mixed categories still reads as one
// palette against the tan card, rather than a bag of unrelated colors. Every
// badge carries its label as text, so the color is never the only thing
// telling you which category you're looking at.

import {
  CarIcon, HomeIcon, LandIcon, BoatIcon, GemIcon, LaptopIcon,
  CardsIcon, FrameIcon, NoteIcon, WrenchIcon, BoxIcon,
} from '../components/icons'

export const CATEGORIES = {
  vehicle : {
    label : 'Vehicle',
    noun  : 'vehicle',
    examples : { name: '2015 Toyota Camry', make: 'Toyota', model: 'Camry' },
    icon  : CarIcon,
    badge : 'bg-stone-100 text-stone-700',
    basics : [ 'make', 'model', 'year_made', 'condition' ],
    specs : [
      { key: 'mileage',    label: 'Mileage',    type: 'number', placeholder: '68000' },
      { key: 'trim',       label: 'Trim',       type: 'text',   placeholder: 'SE, Limited…' },
      { key: 'drivetrain', label: 'Drivetrain', type: 'select', options: [ 'FWD', 'RWD', 'AWD', '4WD' ] },
      { key: 'accidents',  label: 'Accidents',  type: 'select', options: [ 'None', 'Minor', 'Major' ] },
    ],
  },
  real_estate : {
    label : 'Real Estate',
    noun  : 'property',
    examples : { name: '3-bed colonial on Maple St' },
    icon  : HomeIcon,
    badge : 'bg-emerald-50 text-emerald-800',
    basics : [ 'condition' ],
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
    noun  : 'plot of land',
    examples : { name: '2 acres off Route 3' },
    icon  : LandIcon,
    badge : 'bg-lime-50 text-lime-800',
    basics : [],
    specs : [
      { key: 'acres',   label: 'Acres',   type: 'number', placeholder: '2.5' },
      { key: 'zoning',  label: 'Zoning',  type: 'text',   placeholder: 'Residential' },
      { key: 'utilities', label: 'Utilities', type: 'select', options: [ 'Yes', 'No' ] },
    ],
  },
  boat : {
    label : 'Boat',
    noun  : 'boat',
    examples : { name: '2018 Sea Ray SPX 190', make: 'Sea Ray', model: 'SPX 190' },
    icon  : BoatIcon,
    badge : 'bg-violet-50 text-violet-800',
    basics : [ 'make', 'model', 'year_made', 'condition' ],
    specs : [
      { key: 'length_ft',    label: 'Length (ft)',  type: 'number', placeholder: '22' },
      { key: 'engine_hours', label: 'Engine hours', type: 'number', placeholder: '350' },
      { key: 'hull',         label: 'Hull',         type: 'select', options: [ 'Fiberglass', 'Aluminum', 'Wood' ] },
    ],
  },
  jewelry : {
    label : 'Jewelry',
    noun  : 'jewelry',
    examples : { name: 'Gold engagement ring', make: 'Tiffany & Co.' },
    icon  : GemIcon,
    badge : 'bg-rose-50 text-rose-800',
    basics : [ 'make', 'condition' ],
    specs : [
      { key: 'metal',    label: 'Metal',    type: 'select', options: [ 'Gold', 'White gold', 'Silver', 'Platinum', 'Steel' ] },
      { key: 'gemstone', label: 'Gemstone', type: 'text',   placeholder: 'Diamond' },
      { key: 'carat',    label: 'Carat',    type: 'number', placeholder: '1.2' },
      { key: 'papers',   label: 'Papers / cert', type: 'select', options: [ 'Yes', 'No' ] },
    ],
  },
  electronics : {
    label : 'Electronics',
    noun  : 'device',
    examples : { name: 'MacBook Pro 14"', make: 'Apple', model: 'MacBook Pro' },
    icon  : LaptopIcon,
    badge : 'bg-slate-100 text-slate-700',
    basics : [ 'make', 'model', 'condition' ],
    specs : [
      { key: 'storage',  label: 'Storage / specs', type: 'text', placeholder: '512GB, M2 Pro' },
      { key: 'box',      label: 'Original box',    type: 'select', options: [ 'Yes', 'No' ] },
      { key: 'warranty', label: 'Warranty left',   type: 'select', options: [ 'Yes', 'No' ] },
    ],
  },
  collectible : {
    label : 'Collectible',
    noun  : 'collectible',
    examples : { name: '1999 Charizard holo' },
    icon  : CardsIcon,
    badge : 'bg-amber-50 text-amber-800',
    basics : [ 'condition' ],
    specs : [
      { key: 'grade',    label: 'Grade',        type: 'text', placeholder: 'PSA 9' },
      { key: 'edition',  label: 'Edition / #',  type: 'text', placeholder: '1st ed, 42/500' },
      { key: 'graded_by', label: 'Graded by',   type: 'text', placeholder: 'PSA, BGS…' },
    ],
  },
  art : {
    label : 'Art',
    noun  : 'artwork',
    examples : { name: 'Untitled oil landscape' },
    icon  : FrameIcon,
    badge : 'bg-orange-50 text-orange-800',
    basics : [ 'condition' ],
    specs : [
      { key: 'artist',     label: 'Artist',     type: 'text', placeholder: 'Artist name' },
      { key: 'medium',     label: 'Medium',     type: 'text', placeholder: 'Oil on canvas' },
      { key: 'dimensions', label: 'Dimensions', type: 'text', placeholder: '24 x 36 in' },
      { key: 'signed',     label: 'Signed',     type: 'select', options: [ 'Yes', 'No' ] },
    ],
  },
  instrument : {
    label : 'Instrument',
    noun  : 'instrument',
    examples : { name: 'Fender Stratocaster', make: 'Fender', model: 'Stratocaster' },
    icon  : NoteIcon,
    badge : 'bg-yellow-50 text-yellow-800',
    basics : [ 'make', 'model', 'condition' ],
    specs : [
      { key: 'serial', label: 'Serial number', type: 'text', placeholder: 'US20…' },
      { key: 'case',   label: 'Hard case',     type: 'select', options: [ 'Yes', 'No' ] },
    ],
  },
  equipment : {
    label : 'Equipment',
    noun  : 'equipment',
    examples : { name: 'DeWalt table saw', make: 'DeWalt', model: 'Table saw' },
    icon  : WrenchIcon,
    badge : 'bg-zinc-100 text-zinc-700',
    basics : [ 'make', 'model', 'condition' ],
    specs : [
      { key: 'hours_used', label: 'Hours used', type: 'number', placeholder: '120' },
      { key: 'serial',     label: 'Serial number', type: 'text', placeholder: 'Optional' },
    ],
  },
  other : {
    label : 'Other',
    noun  : 'item',
    examples : { name: 'Whatever you’d call it' },
    icon  : BoxIcon,
    badge : 'bg-sand-200 text-ink-700',
    basics : [ 'condition' ],
    specs : [],
  },
}

export const CONDITIONS = [ 'Excellent', 'Good', 'Fair', 'Poor' ]

// The built-in item fields the form can optionally ask for, keyed by the name
// each category lists in its `basics`. Kept here next to the categories so the
// form stays a thin renderer over this config.
// The wording takes the category so each question names the thing being added,
// and the placeholder shows an example that belongs to it.
export const BASIC_FIELDS = {
  make      : { label: 'Make / brand', type: 'text',
                question: ( c ) => `What make or brand is the ${ c.noun }?`,
                placeholder: ( c ) => `e.g. ${ c.examples.make }` },
  model     : { label: 'Model', type: 'text',
                question: ( c ) => `What model is the ${ c.noun }?`,
                placeholder: ( c ) => `e.g. ${ c.examples.model }` },
  year_made : { label: 'Year made', type: 'number',
                question: ( c ) => `What year was the ${ c.noun } made?`,
                placeholder: 'e.g. 2015' },
  condition : { label: 'Condition', type: 'select', options: CONDITIONS,
                question: ( c ) => `What condition is the ${ c.noun } in?` },
}

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
