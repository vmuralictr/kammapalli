import { forwardRef } from 'react'
import { GROUPS } from '../lib/constants'
import { analyse, votersInGroup } from '../lib/tally'
import ResultSummary from './ResultSummary'

const GroupResult = forwardRef(function GroupResult({ state, group, onNext, onFinal }, ref) {
  const voters = votersInGroup(group, state.moves)
  const result = analyse(voters, state.candidates, state.marks)
  const done = GROUPS.filter((g) => state.submitted[g] === 'done').length
  const next = GROUPS.find((g) => state.submitted[g] !== 'done')

  return (
    <section ref={ref} id="groupResult" className={`card ${result.hasVotes && !result.isTie ? 'winner' : ''}`}>
      <ResultSummary result={result} total={voters.length} label={`Result · ${group}`} />
      <p className="sub" style={{ marginTop: 12 }}>
        {done} of {GROUPS.length} groups submitted.{' '}
        {next ? (
          <>
            Next: <b>{next}</b>.
          </>
        ) : (
          'All groups done – see the final result.'
        )}
      </p>
      {next ? (
        <button id="goNext" onClick={() => onNext(next)}>
          Go to {next}
        </button>
      ) : (
        <button id="goFinal" className="primary win-btn" onClick={onFinal}>
          See final result
        </button>
      )}
    </section>
  )
})

export default GroupResult
