import { GROUPS, VOTERS } from '../lib/constants'
import { votersInGroup } from '../lib/tally'

const BADGES = {
  done: <span className="badge done">✓ Submitted</span>,
  stale: <span className="badge stale">Changed – submit again</span>,
  none: <span className="badge">Not submitted</span>,
}

export default function GroupPicker({ state, onPick }) {
  return (
    <section className="card">
      <h2>Step 2 · Choose a group</h2>
      <div className="groups" id="groups">
        {GROUPS.map((g) => {
          const list = votersInGroup(g, state.moves)
          const marked = list.filter((v) => state.marks[v.epicNo]).length
          const movedIn = list.filter((v) => state.moves[v.epicNo]).length
          const movedOut = VOTERS.filter((v) => v.homeGroup === g && state.moves[v.epicNo]).length
          return (
            <button
              key={g}
              data-g={g}
              className={`g ${g === state.current ? 'active' : ''}`}
              onClick={() => onPick(g)}
            >
              <div className="t">{g}</div>
              <div className="sub">
                {list.length} voters · {marked} marked
              </div>
              {(movedIn > 0 || movedOut > 0) && (
                <div className="sub">
                  {movedIn > 0 && `+${movedIn} moved in`}
                  {movedIn > 0 && movedOut > 0 && ' · '}
                  {movedOut > 0 && `−${movedOut} moved out`}
                </div>
              )}
              {BADGES[state.submitted[g] || 'none']}
            </button>
          )
        })}
      </div>
    </section>
  )
}
