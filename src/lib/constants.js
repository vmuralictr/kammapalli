import rollData from '../data/voters.json'

export const ROLL = rollData.roll

// Default candidate colours: distinct hues, readable on light and dark backgrounds.
export const COLORS = ['#2563eb', '#ea580c', '#16a34a', '#9333ea', '#dc2626', '#0891b2', '#ca8a04', '#db2777']

// Colours for the non-candidate choices.
export const SPECIAL_COLORS = { undecided: '#64748b', novote: '#94a3b8' }

// Non-candidate choices a voter can be marked with.
export const SPECIAL = [
  { id: 'undecided', name: 'Undecided' },
  { id: 'novote', name: "Won't vote / away" },
]

// The three working groups, in the order they are canvassed.
export const GROUPS = ['1-Guttakindavooru', '2-Kammapalle HW', '155 Kammapalle 1 & 2']

function homeGroupFor(section) {
  if (section.startsWith('1-')) return GROUPS[0]
  if (section.startsWith('2-')) return GROUPS[1]
  return GROUPS[2] // sections 3 and 4 (155 Kammapalle 1 & 2)
}

export const VOTERS = rollData.voters.map((v) => ({ ...v, homeGroup: homeGroupFor(v.section) }))

export const MIN_CANDIDATES = 2
export const MAX_CANDIDATES = 8
