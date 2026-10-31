import { SPECIAL, VOTERS } from './constants'

/** The group a voter currently belongs to (after any moves). */
export const groupOf = (voter, moves) => moves[voter.epicNo] || voter.homeGroup

/**
 * Voters in a group: the group's own voters in roll order first,
 * then voters moved in from other groups, so numbering stays stable.
 */
export function votersInGroup(group, moves) {
  const all = VOTERS.filter((v) => groupOf(v, moves) === group)
  return [...all.filter((v) => !moves[v.epicNo]), ...all.filter((v) => moves[v.epicNo])]
}

/** Count marks for a list of voters. Returns { counts: {id: n}, unmarked }. */
export function tally(voters, candidates, marks) {
  const counts = {}
  ;[...candidates, ...SPECIAL].forEach((c) => (counts[c.id] = 0))
  let unmarked = 0
  for (const v of voters) {
    const m = marks[v.epicNo]
    if (m && m in counts) counts[m]++
    else unmarked++
  }
  return { counts, unmarked }
}

/** Ranked candidates, winner / tie and safety analysis for a list of voters. */
export function analyse(voters, candidates, marks) {
  const { counts, unmarked } = tally(voters, candidates, marks)
  const ranked = candidates
    .map((c) => ({ ...c, votes: counts[c.id] }))
    .sort((a, b) => b.votes - a.votes)
  const counted = ranked.reduce((s, c) => s + c.votes, 0)
  const top = ranked[0]
  const second = ranked[1]
  const tied = top ? ranked.filter((c) => c.votes === top.votes) : []
  const margin = top && second ? top.votes - second.votes : 0
  const swing = counts.undecided + unmarked
  return {
    counts,
    unmarked,
    ranked,
    counted,
    top,
    second,
    tied,
    margin,
    swing,
    hasVotes: counted > 0,
    isTie: counted > 0 && tied.length > 1,
    isSafe: counted > 0 && tied.length === 1 && swing < margin,
  }
}
