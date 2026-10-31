import { useEffect, useState } from 'react'
import { COLORS, MAX_CANDIDATES, MIN_CANDIDATES } from '../lib/constants'

export default function CandidateSetup({ candidates, onSave }) {
  const [count, setCount] = useState(candidates.length || 3)
  const [names, setNames] = useState(() => candidates.map((c) => c.name))
  const [msg, setMsg] = useState('')

  // Keep inputs in sync after an import.
  useEffect(() => {
    if (candidates.length) {
      setCount(candidates.length)
      setNames(candidates.map((c) => c.name))
    }
  }, [candidates])

  const n = Math.max(MIN_CANDIDATES, Math.min(MAX_CANDIDATES, Number(count) || 3))

  const save = () => {
    const list = Array.from({ length: n }, (_, i) => (names[i] || '').trim())
    if (list.some((x) => !x)) return setMsg('Please enter a name for every candidate.')
    if (new Set(list.map((x) => x.toLowerCase())).size !== list.length)
      return setMsg('Candidate names must be different.')
    const dropped = onSave(list)
    setMsg('Saved.' + (dropped ? ` ${dropped} mark(s) for removed candidates were cleared.` : ''))
  }

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
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </div>
      </div>
      <div className="cands">
        {Array.from({ length: n }, (_, i) => (
          <div key={i}>
            <label>
              <span className="chip" style={{ background: COLORS[i] }} />
              Candidate {i + 1}
            </label>
            <input
              type="text"
              data-i={i}
              value={names[i] || ''}
              placeholder={`Name of candidate ${i + 1}`}
              onChange={(e) => {
                const next = [...names]
                next[i] = e.target.value
                setNames(next)
              }}
            />
          </div>
        ))}
      </div>
      <button className="primary" id="saveCands" onClick={save}>
        Save candidates
      </button>
      <span className="sub" style={{ marginLeft: 8 }}>
        {msg}
      </span>
    </section>
  )
}
