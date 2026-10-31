import { forwardRef } from 'react'
import { GROUPS, VOTERS } from '../lib/constants'
import { analyse, tally, votersInGroup } from '../lib/tally'
import ResultSummary from './ResultSummary'

function leader(counts, candidates) {
  const rk = candidates.map((c) => ({ n: c.name, v: counts[c.id] })).sort((a, b) => b.v - a.v)
  if (!rk.length || rk[0].v === 0) return '—'
  if (rk[1] && rk[1].v === rk[0].v) return 'Tie'
  return `${rk[0].n} (+${rk[0].v - (rk[1] ? rk[1].v : 0)})`
}

const FinalResult = forwardRef(function FinalResult({ state }, ref) {
  const { candidates, marks, moves } = state
  const result = analyse(VOTERS, candidates, marks)

  return (
    <section ref={ref} id="finalResult" className={`card ${result.hasVotes && !result.isTie ? 'winner' : ''}`}>
      <ResultSummary result={result} total={VOTERS.length} label="Final result · all 3 groups" isFinal />
      <h2 style={{ marginTop: 18 }}>Group-wise votes</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Group</th>
              {candidates.map((c) => (
                <th key={c.id}>{c.name}</th>
              ))}
              <th>Undecided</th>
              <th>Won't vote</th>
              <th>Not marked</th>
              <th>Leading</th>
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((g) => {
              const list = votersInGroup(g, moves)
              const t = tally(list, candidates, marks)
              return (
                <tr key={g}>
                  <td>
                    <b>{g}</b>
                    <div className="sub">{list.length} voters</div>
                  </td>
                  {candidates.map((c) => (
                    <td key={c.id}>{t.counts[c.id]}</td>
                  ))}
                  <td>{t.counts.undecided}</td>
                  <td>{t.counts.novote}</td>
                  <td>{t.unmarked}</td>
                  <td>
                    <b>{leader(t.counts, candidates)}</b>
                  </td>
                </tr>
              )
            })}
            <tr>
              <td>
                <b>Total</b>
                <div className="sub">{VOTERS.length} voters</div>
              </td>
              {candidates.map((c) => (
                <td key={c.id}>
                  <b>{result.counts[c.id]}</b>
                </td>
              ))}
              <td>
                <b>{result.counts.undecided}</b>
              </td>
              <td>
                <b>{result.counts.novote}</b>
              </td>
              <td>
                <b>{result.unmarked}</b>
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <p className="sub">This is a projection from your own markings, not an official count.</p>
    </section>
  )
})

export default FinalResult
