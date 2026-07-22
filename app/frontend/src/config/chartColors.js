// Colors every chart draws from, kept in one place so the allocation bar, the
// per-portfolio pie and the dashboard pie all match.

// One hue, dark to light. Slices are sorted biggest first, so the ramp also
// ends up shading each chart from largest to smallest. Assigned in order and
// never cycled: a long tail folds into "Other" instead, so a holding keeps its
// color when the list changes.
//
// The lighter end falls under 3:1 against the card, which is why every chart
// direct-labels its slices in the legend rather than letting the swatch carry
// identity alone.
export const CHART_PALETTE = [ '#15291d', '#274b35', '#305c41', '#396d4d', '#427e59', '#4b8f65', '#54a071', '#61ac7e' ]

// The card color the charts are drawn on (--color-sand-50). Recharts needs a
// literal, so it can't read the CSS variable directly.
export const SURFACE = '#FDFBF7'
