import { useCallback, useEffect, useState } from 'react'
import { GROUPS, SPECIAL, VOTERS } from './constants'
import { groupOf } from './tally'

const STORAGE_KEY = 'sarpanch-tracker-274'

const EMPTY = {
  candidates: [], // [{ id: 'c1', name }]
  marks: {}, // epicNo -> candidate id | 'undecided' | 'novote'
  submitted: {}, // group -> 'done' | 'stale'
  moves: {}, // epicNo -> group (only when different from home group)
  current: GROUPS[0],
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved && Array.isArray(saved.candidates)) {
      const s = { ...EMPTY, ...saved }
      if (!GROUPS.includes(s.current)) s.current = GROUPS[0]
      return s
    }
  } catch {
    /* storage blocked or corrupt – start fresh */
  }
  return EMPTY
}

/** Mark a submitted group as needing re-submission. */
const staleIfDone = (submitted, groups) => {
  const next = { ...submitted }
  groups.forEach((g) => {
    if (next[g] === 'done') next[g] = 'stale'
  })
  return next
}

export function useTracker() {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  /** Save candidate names. Returns how many marks were cleared for removed candidates. */
  const setCandidates = useCallback(
    (names) => {
      const s = state
      const candidates = names.map((name, i) => ({ id: `c${i + 1}`, name }))
      const valid = new Set([...candidates.map((c) => c.id), ...SPECIAL.map((x) => x.id)])
      const marks = {}
      let dropped = 0
      for (const [k, v] of Object.entries(s.marks)) {
        if (valid.has(v)) marks[k] = v
        else dropped++
      }
      const submitted =
        candidates.length !== s.candidates.length ? staleIfDone(s.submitted, GROUPS) : s.submitted
      setState({ ...s, candidates, marks, submitted })
      return dropped
    },
    [state],
  )

  const setCurrent = useCallback((group) => setState((s) => ({ ...s, current: group })), [])

  const markVoter = useCallback((epicNo, value) => {
    setState((s) => {
      const marks = { ...s.marks }
      if (value) marks[epicNo] = value
      else delete marks[epicNo]
      const voter = VOTERS.find((v) => v.epicNo === epicNo)
      return { ...s, marks, submitted: staleIfDone(s.submitted, [groupOf(voter, s.moves)]) }
    })
  }, [])

  const moveVoter = useCallback((epicNo, to) => {
    setState((s) => {
      const voter = VOTERS.find((v) => v.epicNo === epicNo)
      const from = groupOf(voter, s.moves)
      if (from === to) return s
      const moves = { ...s.moves }
      if (to === voter.homeGroup) delete moves[epicNo]
      else moves[epicNo] = to
      return { ...s, moves, submitted: staleIfDone(s.submitted, [from, to]) }
    })
  }, [])

  const revertAllMoves = useCallback(() => {
    setState((s) => {
      const touched = new Set()
      for (const [epic, g] of Object.entries(s.moves)) {
        touched.add(g)
        touched.add(VOTERS.find((v) => v.epicNo === epic).homeGroup)
      }
      return { ...s, moves: {}, submitted: staleIfDone(s.submitted, [...touched]) }
    })
  }, [])

  const submitGroup = useCallback(
    (group) => setState((s) => ({ ...s, submitted: { ...s.submitted, [group]: 'done' } })),
    [],
  )

  const clearMarks = useCallback(() => setState((s) => ({ ...s, marks: {}, submitted: {} })), [])

  const exportData = useCallback(
    () => ({
      candidates: state.candidates,
      submitted: state.submitted,
      moves: state.moves,
      marks: VOTERS.filter((v) => state.marks[v.epicNo]).map((v) => ({
        serialNo: v.serialNo,
        group: groupOf(v, state.moves),
        epicNo: v.epicNo,
        name: v.name,
        vote: state.marks[v.epicNo],
      })),
    }),
    [state],
  )

  const importData = useCallback((o) => {
    const marks = {}
    ;(o.marks || []).forEach((m) => (marks[m.epicNo] = m.vote))
    setState((s) => ({
      ...s,
      candidates: o.candidates || [],
      submitted: o.submitted || {},
      moves: o.moves || {},
      marks,
    }))
  }, [])

  return {
    state,
    setCandidates,
    setCurrent,
    markVoter,
    moveVoter,
    revertAllMoves,
    submitGroup,
    clearMarks,
    exportData,
    importData,
  }
}
