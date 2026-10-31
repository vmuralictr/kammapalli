import { useCallback, useEffect, useState } from 'react'
import { COLORS, GROUPS, SPECIAL, VOTERS } from './constants'
import { groupOf } from './tally'

const STORAGE_KEY = 'sarpanch-tracker-274'

const EMPTY = {
  candidates: [], // [{ id: 'c1', name }]
  marks: {}, // epicNo -> candidate id | 'undecided' | 'novote'
  submitted: {}, // group -> 'done' | 'stale'
  moves: {}, // epicNo -> group (only when different from home group)
  current: GROUPS[0],
}

/** Give every candidate a colour (older saves and imports may not have one). */
function withColors(candidates) {
  const used = new Set(candidates.map((c) => c.color).filter(Boolean))
  return candidates.map((c) => {
    if (c.color) return c
    const color = COLORS.find((x) => !used.has(x)) || COLORS[0]
    used.add(color)
    return { ...c, color }
  })
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved && Array.isArray(saved.candidates)) {
      const s = { ...EMPTY, ...saved, candidates: withColors(saved.candidates) }
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

  /**
   * Save candidates from the setup form: names[i] and optional colors[i].
   * Returns how many marks were cleared for removed candidates.
   */
  const setCandidates = useCallback(
    (names, colors = []) => {
      const s = state
      // Keep existing ids by position so marks stay with the right candidate; new rows get fresh ids.
      const used = new Set(s.candidates.map((c) => c.id))
      let next = 1
      const freshId = () => {
        while (used.has(`c${next}`)) next++
        used.add(`c${next}`)
        return `c${next}`
      }
      const candidates = withColors(
        names.map((name, i) => ({
          id: s.candidates[i]?.id || freshId(),
          name,
          color: colors[i] || s.candidates[i]?.color,
        })),
      )
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

  /** Remove one candidate, clear the marks given to them and flag affected groups for re-submission. */
  const deleteCandidate = useCallback((id) => {
    setState((s) => {
      const marks = { ...s.marks }
      const touched = new Set()
      for (const v of VOTERS) {
        if (marks[v.epicNo] === id) {
          delete marks[v.epicNo]
          touched.add(groupOf(v, s.moves))
        }
      }
      return {
        ...s,
        candidates: s.candidates.filter((c) => c.id !== id),
        marks,
        submitted: staleIfDone(s.submitted, [...touched]),
      }
    })
  }, [])

  /**
   * Remove every candidate. Marks for candidates are cleared (Undecided / Won't vote
   * marks and voter moves are kept) and all groups go back to "Not submitted".
   */
  const deleteAllCandidates = useCallback(() => {
    setState((s) => {
      const specialIds = new Set(SPECIAL.map((x) => x.id))
      const marks = {}
      for (const [k, v] of Object.entries(s.marks)) if (specialIds.has(v)) marks[k] = v
      return { ...s, candidates: [], marks, submitted: {} }
    })
  }, [])

  /** Change a saved candidate's colour straight away. */
  const setCandidateColor = useCallback((id, color) => {
    setState((s) => ({ ...s, candidates: s.candidates.map((c) => (c.id === id ? { ...c, color } : c)) }))
  }, [])

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

  /** Move several voters at once: pairs = [{ epicNo, to }]. Affected submitted groups become stale. */
  const moveVoters = useCallback((pairs) => {
    setState((s) => {
      const moves = { ...s.moves }
      const touched = new Set()
      for (const { epicNo, to } of pairs) {
        const voter = VOTERS.find((v) => v.epicNo === epicNo)
        const from = groupOf(voter, moves)
        if (from === to) continue
        if (to === voter.homeGroup) delete moves[epicNo]
        else moves[epicNo] = to
        touched.add(from)
        touched.add(to)
      }
      if (!touched.size) return s
      return { ...s, moves, submitted: staleIfDone(s.submitted, [...touched]) }
    })
  }, [])

  const moveVoter = useCallback((epicNo, to) => moveVoters([{ epicNo, to }]), [moveVoters])

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
      candidates: withColors(o.candidates || []),
      submitted: o.submitted || {},
      moves: o.moves || {},
      marks,
    }))
  }, [])

  return {
    state,
    setCandidates,
    deleteCandidate,
    deleteAllCandidates,
    setCandidateColor,
    setCurrent,
    markVoter,
    moveVoter,
    moveVoters,
    revertAllMoves,
    submitGroup,
    clearMarks,
    exportData,
    importData,
  }
}
