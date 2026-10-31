import { VOTERS } from '../lib/constants'
import { groupOf } from '../lib/tally'

export default function MovedVoters({ moves, onRevert, onRevertAll }) {
  const moved = VOTERS.filter((v) => moves[v.epicNo])
  if (!moved.length) return null

  return (
    <section className="card" id="movesCard">
      <div className="spread">
        <h2 style={{ margin: 0 }}>Moved voters ({moved.length})</h2>
        <button id="revertAll" onClick={onRevertAll}>
          Revert all moves
        </button>
      </div>
      <div className="table-wrap">
        <table className="mvlist">
          <thead>
            <tr>
              <th>Voter</th>
              <th>Roll</th>
              <th>Original group</th>
              <th>Now in</th>
              <th />
            </tr>
          </thead>
          <tbody id="mvBody">
            {moved.map((v) => (
              <tr key={v.epicNo}>
                <td>
                  <b>{v.name}</b>
                  <div className="sub">{v.epicNo}</div>
                </td>
                <td>{v.serialNo}</td>
                <td>{v.homeGroup}</td>
                <td>{groupOf(v, moves)}</td>
                <td>
                  <button onClick={() => onRevert(v)}>Revert</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
