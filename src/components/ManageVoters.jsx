import { useEffect, useMemo, useState } from 'react'
import { GROUPS, VOTERS } from '../lib/constants'
import { groupOf, votersInGroup } from '../lib/tally'
import { useDialogs } from './Dialogs'
import MovedVoters from './MovedVoters'

/**
 * Separate screen for organising voters into groups: filter, select one or
 * many voters, and move them to another group (with confirmation and undo).
 */
export default function ManageVoters({ state, moveVoters, revertAllMoves }) {
  const { moves, submitted } = state
  const { ask, toast } = useDialogs()
  const [groupFilter, setGroupFilter] = useState(GROUPS[0])
  const [query, setQuery] = useState('')
  const [movedOnly, setMovedOnly] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const [target, setTarget] = useState('')

  // Voters in display order with per-group numbering.
  const list = useMemo(() => {
    const groups = groupFilter === 'all' ? GROUPS : [groupFilter]
    return groups.flatMap((g) => votersInGroup(g, moves).map((v, i) => ({ v, n: i + 1, g })))
  }, [groupFilter, moves])

  const q = query.trim().toLowerCase()
  const rows = list.filter(({ v }) => {
    if (movedOnly && !moves[v.epicNo]) return false
    if (q && !`${v.name} ${v.relativeName} ${v.epicNo} ${v.houseNo}`.toLowerCase().includes(q)) return false
    return true
  })

  const allShownSelected = rows.length > 0 && rows.every(({ v }) => selected.has(v.epicNo))
  const toggle = (epic) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(epic) ? next.delete(epic) : next.add(epic)
      return next
    })
  const toggleAllShown = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      rows.forEach(({ v }) => (allShownSelected ? next.delete(v.epicNo) : next.add(v.epicNo)))
      return next
    })

  const selectedVoters = VOTERS.filter((v) => selected.has(v.epicNo))

  // "Move to" never offers the group the voters are already in: the group being
  // viewed, or (on "All groups") the one group every selected voter is in.
  const selectedGroups = [...new Set(selectedVoters.map((v) => groupOf(v, moves)))]
  const currentGroup = groupFilter !== 'all' ? groupFilter : selectedGroups.length === 1 ? selectedGroups[0] : null
  const targetOptions = GROUPS.filter((g) => g !== currentGroup)

  // Clear the chosen target if it is no longer offered.
  useEffect(() => {
    if (target && !targetOptions.includes(target)) setTarget('')
  }, [target, targetOptions])
  // Only voters not already in the target group actually move.
  const toMove = target ? selectedVoters.filter((v) => groupOf(v, moves) !== target) : []

  const doMove = async () => {
    if (!target || !toMove.length) return
    const fromGroups = [...new Set(toMove.map((v) => groupOf(v, moves)))]
    const affectedSubmitted = [...new Set([...fromGroups, target])].filter((g) => submitted[g] === 'done')
    const who =
      toMove.length === 1 ? `${toMove[0].name} (Roll ${toMove[0].serialNo})` : `${toMove.length} voters`
    const ok = await ask({
      title: toMove.length === 1 ? 'Move voter?' : 'Move voters?',
      body:
        `Move ${who} from ${fromGroups.join(', ')} to ${target}?` +
        (affectedSubmitted.length
          ? ` ${affectedSubmitted.join(', ')} ${affectedSubmitted.length === 1 ? 'has' : 'have'} already been submitted and will need to be submitted again.`
          : ''),
      yes: 'Move',
    })
    if (!ok) return
    const undo = toMove.map((v) => ({ epicNo: v.epicNo, to: groupOf(v, moves) }))
    moveVoters(toMove.map((v) => ({ epicNo: v.epicNo, to: target })))
    setSelected(new Set())
    toast(`${toMove.length === 1 ? toMove[0].name : `${toMove.length} voters`} moved to ${target}.`, () => {
      moveVoters(undo)
      toast('Move undone.')
    })
  }

  const revertOne = async (voter) => {
    const ok = await ask({ title: 'Revert move?', body: `Send ${voter.name} back to ${voter.homeGroup}?`, yes: 'Revert' })
    if (!ok) return
    moveVoters([{ epicNo: voter.epicNo, to: voter.homeGroup }])
    toast(`${voter.name} is back in ${voter.homeGroup}.`)
  }

  const revertAll = async () => {
    const n = Object.keys(moves).length
    const ok = await ask({
      title: 'Revert all moves?',
      body: `Send all ${n} moved voter(s) back to their original groups?`,
      yes: 'Revert all',
    })
    if (!ok) return
    revertAllMoves()
    toast('All moves reverted.')
  }

  return (
    <>
      <section className="card">
        <h2>Manage voters · move between groups</h2>
        <p className="sub" style={{ marginTop: -6 }}>
          Tick one or more voters, choose the group to move them to, then press <b>Move</b>. Marks stay with the voter.
        </p>

        <div className="groups" style={{ marginBottom: 12 }}>
          {GROUPS.map((g) => {
            const n = votersInGroup(g, moves).length
            const movedIn = votersInGroup(g, moves).filter((v) => moves[v.epicNo]).length
            const movedOut = VOTERS.filter((v) => v.homeGroup === g && moves[v.epicNo]).length
            return (
              <button key={g} className={`g ${groupFilter === g ? 'active' : ''}`} data-mg={g} onClick={() => setGroupFilter(g)}>
                <div className="t">{g}</div>
                <div className="sub">{n} voters</div>
                {(movedIn > 0 || movedOut > 0) && (
                  <div className="sub">
                    {movedIn > 0 && `+${movedIn} moved in`}
                    {movedIn > 0 && movedOut > 0 && ' · '}
                    {movedOut > 0 && `−${movedOut} moved out`}
                  </div>
                )}
              </button>
            )
          })}
          <button className={`g ${groupFilter === 'all' ? 'active' : ''}`} data-mg="all" onClick={() => setGroupFilter('all')}>
            <div className="t">All groups</div>
            <div className="sub">{VOTERS.length} voters</div>
          </button>
        </div>

        <div className="row">
          <div>
            <label htmlFor="mq">Search name, relative, EPIC or house no.</label>
            <input id="mq" type="text" value={query} placeholder="e.g. Reddy, SQB0538001, 2-41" onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div style={{ flex: '0 1 220px' }}>
            <label className="check">
              <input type="checkbox" checked={movedOnly} onChange={(e) => setMovedOnly(e.target.checked)} /> Show moved voters only
            </label>
          </div>
        </div>

        <div className="move-bar">
          <span>
            <b id="selCount">{selected.size}</b> selected
            {selected.size > 0 && (
              <button className="link-btn" onClick={() => setSelected(new Set())}>
                Clear
              </button>
            )}
          </span>
          <label htmlFor="target" style={{ margin: 0 }}>
            Move to
          </label>
          <select id="target" value={target} onChange={(e) => setTarget(e.target.value)} style={{ width: 'auto', minWidth: 200 }}>
            <option value="">— choose group —</option>
            {targetOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <button className="primary" id="moveBtn" disabled={!toMove.length} onClick={doMove}>
            Move{toMove.length ? ` ${toMove.length}` : ''}
          </button>
          {target && selected.size > 0 && toMove.length < selected.size && (
            <span className="sub">{selected.size - toMove.length} already in {target}</span>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" aria-label="Select all shown" checked={allShownSelected} onChange={toggleAllShown} />
                </th>
                <th>#</th>
                <th>Voter</th>
                <th>Father / Husband name</th>
                <th>House</th>
                <th>Age / Gender</th>
                <th>Current group</th>
              </tr>
            </thead>
            <tbody id="mBody">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="sub">
                    No voters match.
                  </td>
                </tr>
              )}
              {rows.map(({ v, n, g }) => (
                <tr key={v.epicNo} className={selected.has(v.epicNo) ? 'selected' : ''} onClick={() => toggle(v.epicNo)}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" aria-label={`Select ${v.name}`} checked={selected.has(v.epicNo)} onChange={() => toggle(v.epicNo)} />
                  </td>
                  <td className="n">
                    <b>{n}</b>
                    <div className="sub">Roll {v.serialNo}</div>
                  </td>
                  <td>
                    <b>{v.name}</b>
                    <div className="sub">{v.epicNo}</div>
                  </td>
                  <td>
                    {v.relativeName}
                    <div className="sub">{v.relation}</div>
                  </td>
                  <td>{v.houseNo}</td>
                  <td>
                    {v.age} / {v.gender[0]}
                  </td>
                  <td>
                    {g}
                    {moves[v.epicNo] && <div className="sub moved">Moved from {v.homeGroup}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <MovedVoters moves={moves} onRevert={revertOne} onRevertAll={revertAll} />
    </>
  )
}
