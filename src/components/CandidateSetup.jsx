import { useEffect, useState } from 'react'
import { COLORS, MAX_CANDIDATES, MIN_CANDIDATES } from '../lib/constants'
import { useDialogs } from './Dialogs'

/** First palette colour not already taken by another row. */
const nextFreeColor = (taken) => COLORS.find((c) => !taken.includes(c)) || COLORS[taken.length % COLORS.length]

export default function CandidateSetup({ candidates, marks, onSave, onDelete, onDeleteAll, onColor }) {
  const fromSaved = () =>
    candidates.length
      ? candidates.map((c) => ({ name: c.name, color: c.color }))
      : [0, 1, 2].map((i) => ({ name: '', color: COLORS[i] }))
  const [rows, setRows] = useState(fromSaved)
  const [msg, setMsg] = useState('')
  const { ask, tell, toast } = useDialogs()

  // Re-sync inputs after a save, import or delete. Colour-only changes don't reset
  // the form, so unsaved name edits survive picking a colour.
  const savedKey = candidates.map((c) => `${c.id}|${c.name}`).join(',')
  useEffect(() => {
    if (candidates.length) setRows(candidates.map((c) => ({ name: c.name, color: c.color })))
    else setRows([0, 1, 2].map((i) => ({ name: '', color: COLORS[i] })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey])

  const addRow = () =>
    setRows((prev) => (prev.length >= MAX_CANDIDATES ? prev : [...prev, { name: '', color: nextFreeColor(prev.map((r) => r.color)) }]))

  const setCount = (value) => {
    const n = Math.max(MIN_CANDIDATES, Math.min(MAX_CANDIDATES, Number(value) || MIN_CANDIDATES))
    setRows((prev) => {
      const next = prev.slice(0, n)
      while (next.length < n) next.push({ name: '', color: nextFreeColor(next.map((r) => r.color)) })
      return next
    })
  }

  const update = (i, patch) => setRows((prev) => prev.map((r, k) => (k === i ? { ...r, ...patch } : r)))

  const changeColor = (i, color) => {
    update(i, { color })
    // Saved candidates change colour immediately; new rows pick it up when saved.
    if (candidates[i]) onColor(candidates[i].id, color)
  }

  const save = () => {
    const names = rows.map((r) => r.name.trim())
    if (names.some((x) => !x)) return setMsg('Please enter a name for every candidate.')
    if (new Set(names.map((x) => x.toLowerCase())).size !== names.length)
      return setMsg('Candidate names must be different.')
    const dropped = onSave(
      names,
      rows.map((r) => r.color),
    )
    setMsg('Saved.' + (dropped ? ` ${dropped} mark(s) for removed candidates were cleared.` : ''))
  }

  const remove = async (i) => {
    if (rows.length <= MIN_CANDIDATES) {
      tell('Cannot delete', `You need at least ${MIN_CANDIDATES} candidates. Add another candidate first, then delete this one.`)
      return
    }
    const saved = candidates[i]
    if (!saved) {
      setRows((prev) => prev.filter((_, k) => k !== i))
      return
    }
    const votes = Object.values(marks).filter((m) => m === saved.id).length
    const ok = await ask({
      title: 'Delete candidate?',
      body: votes
        ? `Delete ${saved.name}? The ${votes} voter(s) marked for ${saved.name} will become "Not marked", and any submitted group that had those voters will need to be submitted again.`
        : `Delete ${saved.name}? No voters are marked for this candidate.`,
      yes: 'Delete',
    })
    if (!ok) return
    onDelete(saved.id)
    setMsg('')
    toast(`${saved.name} deleted.${votes ? ` ${votes} mark(s) cleared.` : ''}`)
  }

  const removeAll = async () => {
    const ids = new Set(candidates.map((c) => c.id))
    const votes = Object.values(marks).filter((m) => ids.has(m)).length
    const ok = await ask({
      title: 'Delete all candidates?',
      body:
        `This deletes all ${candidates.length} candidates` +
        (votes ? ` and clears the ${votes} voter mark(s) given to them` : '') +
        '. All groups will go back to "Not submitted". Undecided / Won\'t vote marks and voter moves are kept. This cannot be undone.',
      yes: 'Delete all',
    })
    if (!ok) return
    onDeleteAll()
    setMsg('')
    toast(`All candidates deleted.${votes ? ` ${votes} mark(s) cleared.` : ''}`)
  }

  const unsaved =
    rows.length !== candidates.length || rows.some((r, i) => r.name.trim() !== (candidates[i]?.name || ''))

  return (
    <section className="card" id="setup">
      <h2>Step 1 · Candidates</h2>
      <div className="row">
        <div style={{ flex: '0 1 200px' }}>
          <label htmlFor="ncand">Number of candidates</label>
          <input
            id="ncand"
            type="number"
            min={MIN_CANDIDATES}
            max={MAX_CANDIDATES}
            value={rows.length}
            onChange={(e) => setCount(e.target.value)}
          />
        </div>
      </div>
      <div className="cands">
        {rows.map((r, i) => (
          <div key={i}>
            <label>
              Candidate {i + 1}
              {!candidates[i] && <span className="sub"> · not saved</span>}
            </label>
            <div className="cand-row" style={{ '--cand': r.color }}>
              <label className="swatch" title="Change colour">
                <input
                  type="color"
                  data-color={i}
                  value={r.color}
                  aria-label={`Colour for candidate ${i + 1}`}
                  onChange={(e) => changeColor(i, e.target.value)}
                />
              </label>
              <input
                type="text"
                data-i={i}
                className="cand-name"
                value={r.name}
                placeholder={`Name of candidate ${i + 1}`}
                onChange={(e) => update(i, { name: e.target.value })}
              />
              <button
                className="icon-btn"
                data-del={i}
                title={`Delete candidate ${i + 1}`}
                aria-label={`Delete candidate ${i + 1}`}
                onClick={() => remove(i)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="spread" style={{ justifyContent: 'flex-start' }}>
        <button className="primary" id="saveCands" onClick={save}>
          Save candidates
        </button>
        {rows.length < MAX_CANDIDATES && <button onClick={addRow}>+ Add candidate</button>}
        {candidates.length > 0 && (
          <button id="deleteAll" className="danger-btn" onClick={removeAll}>
            Delete all candidates
          </button>
        )}
        <span className="sub">{msg || (unsaved && candidates.length ? 'You have unsaved changes.' : '')}</span>
      </div>
      <p className="sub" style={{ margin: '10px 0 0' }}>Tap the coloured square to change a candidate's colour.</p>
    </section>
  )
}
