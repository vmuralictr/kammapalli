import rollData from '../data/voters.json'

export const ROLL = rollData.roll

export const COLORS = ['#2f6fb3', '#c2410c', '#15803d', '#7e22ce', '#b91c1c', '#0e7490', '#a16207', '#be185d']

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
