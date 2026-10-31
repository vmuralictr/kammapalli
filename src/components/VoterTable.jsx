import { useMemo, useState } from 'react'
import { GROUPS, SPECIAL, SPECIAL_COLORS } from '../lib/constants'
import { groupOf, tally, votersInGroup } from '../lib/tally'

/** Clickable column header that shows the current sort direction. */
function SortHeader({ label, col, sort, onSort, className }) {
  const active = sort.key === col
  const arrow = active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'
  return (
    <th className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button className={`sort-btn ${active ? 'active' : ''}`} data-sort={col} onClick={() => onSort(col)}>
        {label} <span className="arrow">{arrow}</span>
      </button>
    </th>
  )
}

export default function VoterTable({ state, onMark, onMoveRequest }) {
  const [query, setQuery] = useState('')
  const [show, setShow] = useState('all')
  const [sort, setSort] = useState({ key: 'n', dir: 'asc' })
  const { candidates, marks, moves, current } = state

  const groupVoters = useMemo(() => votersInGroup(current, moves), [current, moves])
  const { counts } = tally(groupVoters, candidates, marks)

  const colorOf = (id) => candidates.find((c) => c.id === id)?.color || SPECIAL_COLORS[id]

  // "Will vote for" order: candidates as listed, then Undecided, Won't vote, then not marked.
  const voteRank = useMemo(() => {
    const r = {}
    candidates.forEach((c, i) => (r[c.id] = i))
    SPECIAL.forEach((s, i) => (r[s.id] = candidates.length + i))
    return r
  }, [candidates])
  const UNMARKED_RANK = candidates.length + SPECIAL.length

  const cycleSort = (key) =>
    setSort((s) => (s.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : { key: 'n', dir: 'asc' }))

  const q = query.trim().toLowerCase()
  const rows = useMemo(() => {
    const list = groupVoters
      .map((v, i) => ({ v, n: i + 1 }))
      .filter(({ v }) => {
        const m = marks[v.epicNo]
        if (show === 'unmarked' && m) return false
        if (show === 'marked' && !m) return false
        if (q && !`${v.name} ${v.relativeName} ${v.epicNo} ${v.houseNo}`.toLowerCase().includes(q)) return false
        return true
      })
    const key = {
      n: ({ n }) => n,
      name: ({ v }) => v.name.toLowerCase(),
      relative: ({ v }) => v.relativeName.toLowerCase(),
      age: ({ v }) => v.age,
      vote: ({ v }) => voteRank[marks[v.epicNo]] ?? UNMARKED_RANK,
    }[sort.key]
    const dir = sort.dir === 'asc' ? 1 : -1
    // Stable sort: ties keep group order (#).
    return list.sort((a, b) => {
      const ka = key(a)
      const kb = key(b)
      if (ka < kb) return -dir
      if (ka > kb) return dir
      return a.n - b.n
    })
  }, [groupVoters, marks, show, q, sort, voteRank, UNMARKED_RANK])

  const headerProps = { sort, onSort: cycleSort }

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
        {candidates.map((c) => (
          <span className="stat cand-stat" key={c.id} style={{ '--cand': c.color }}>
            <span className="chip" style={{ background: c.color }} />
            {c.name}: <b>{counts[c.id]}</b>
          </span>
        ))}
        {SPECIAL.map((s) => (
          <span className="stat" key={s.id}>
            {s.name}: <b>{counts[s.id]}</b>
          </span>
        ))}
        {sort.key !== 'n' && (
          <button className="link-btn" onClick={() => setSort({ key: 'n', dir: 'asc' })}>
            Clear sort
          </button>
        )}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <SortHeader label="#" col="n" {...headerProps} />
              <SortHeader label="Voter" col="name" {...headerProps} />
              <SortHeader label="Father / Husband name" col="relative" {...headerProps} />
              <th>House</th>
              <SortHeader label="Age / Gender" col="age" {...headerProps} />
              <SortHeader label="Will vote for" col="vote" {...headerProps} />
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
              const color = m ? colorOf(m) : null
              return (
                <tr key={v.epicNo} className={m ? 'marked' : ''} style={color ? { '--cand': color } : undefined}>
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
                      className={`vt ${m ? 'has-vote' : ''}`}
                      value={m}
                      disabled={!candidates.length}
                      onChange={(e) => onMark(v.epicNo, e.target.value)}
                    >
                      {candidates.length ? (
                        <>
                          <option value="">— Not marked —</option>
                          {candidates.map((c) => (
                            <option key={c.id} value={c.id}>
                              ● {c.name}
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
