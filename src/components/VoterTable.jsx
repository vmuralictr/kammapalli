import { useMemo, useState } from 'react'
import { COLORS, GROUPS, SPECIAL } from '../lib/constants'
import { groupOf, tally, votersInGroup } from '../lib/tally'

export default function VoterTable({ state, onMark, onMoveRequest }) {
  const [query, setQuery] = useState('')
  const [show, setShow] = useState('all')
  const { candidates, marks, moves, current } = state

  const groupVoters = useMemo(() => votersInGroup(current, moves), [current, moves])
  const { counts } = tally(groupVoters, candidates, marks)

  const q = query.trim().toLowerCase()
  const rows = groupVoters
    .map((v, i) => ({ v, n: i + 1 }))
    .filter(({ v }) => {
      const m = marks[v.epicNo]
      if (show === 'unmarked' && m) return false
      if (show === 'marked' && !m) return false
      if (q && !`${v.name} ${v.relativeName} ${v.epicNo} ${v.houseNo}`.toLowerCase().includes(q)) return false
      return true
    })

  return (
    <section className="card" id="voterCard">
      <h2>Step 3 · Mark each voter – {current}</h2>
      <div className="row">
        <div>
          <label htmlFor="q">Search name, relative, EPIC or house no.</label>
          <input
            id="q"
            type="text"
            value={query}
            placeholder="e.g. Reddy, SQB0538001, 2-41"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div style={{ flex: '0 1 220px' }}>
          <label htmlFor="markF">Show</label>
          <select id="markF" value={show} onChange={(e) => setShow(e.target.value)}>
            <option value="all">All voters in group</option>
            <option value="unmarked">Not yet marked</option>
            <option value="marked">Marked</option>
          </select>
        </div>
      </div>

      <div className="stats">
        {candidates.map((c, i) => (
          <span className="stat" key={c.id}>
            <span className="chip" style={{ background: COLORS[i] }} />
            {c.name}: <b>{counts[c.id]}</b>
          </span>
        ))}
        {SPECIAL.map((s) => (
          <span className="stat" key={s.id}>
            {s.name}: <b>{counts[s.id]}</b>
          </span>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Voter</th>
              <th>Father / Husband name</th>
              <th>House</th>
              <th>Age / Gender</th>
              <th>Will vote for</th>
              <th>Move to group</th>
            </tr>
          </thead>
          <tbody id="tbody">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="sub">
                  No voters match.
                </td>
              </tr>
            )}
            {rows.map(({ v, n }) => {
              const m = marks[v.epicNo] || ''
              const g = groupOf(v, moves)
              return (
                <tr key={v.epicNo} className={m ? 'marked' : ''}>
                  <td className="n">
                    <b>{n}</b>
                    <div className="sub">Roll {v.serialNo}</div>
                  </td>
                  <td>
                    <b>{v.name}</b>
                    <div className="sub">{v.epicNo}</div>
                    {moves[v.epicNo] && <div className="sub moved">Moved from {v.homeGroup}</div>}
                  </td>
                  <td>
                    {v.relativeName}
                    <div className="sub">{v.relation}</div>
                  </td>
                  <td>{v.houseNo}</td>
                  <td>
                    {v.age} / {v.gender[0]}
                  </td>
                  <td className="vote">
                    <select
                      className="vt"
                      value={m}
                      disabled={!candidates.length}
                      onChange={(e) => onMark(v.epicNo, e.target.value)}
                    >
                      {candidates.length ? (
                        <>
                          <option value="">— Not marked —</option>
                          {candidates.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                          {SPECIAL.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </>
                      ) : (
                        <option value="">Add candidates first</option>
                      )}
                    </select>
                  </td>
                  <td>
                    <select className="mv" value={g} onChange={(e) => onMoveRequest(v, e.target.value)}>
                      {GROUPS.map((x) => (
                        <option key={x} value={x}>
                          {x === g ? `Stay in ${x}` : x}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
