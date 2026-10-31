/** Winner headline, vote bars and counts for one analysed set of voters. */
export default function ResultSummary({ result, total, label, isFinal }) {
  const { ranked, counted, top, second, tied, margin, swing, counts, unmarked } = result
  const word = isFinal ? 'Projected Sarpanch' : 'Leading in this group'

  let head
  if (!result.hasVotes) {
    head = <div className="big muted">No votes marked</div>
  } else if (result.isTie) {
    head = (
      <>
        <div className="sub">{word}</div>
        <div className="big warn-text">Tie: {tied.map((c) => c.name).join(' & ')}</div>
        <div>{top.votes} votes each.</div>
      </>
    )
  } else {
    head = (
      <>
        <div className="sub">{word}</div>
        <div className="big">{top.name}</div>
        <div>
          {top.votes} votes · ahead of {second.name} by <b>{margin}</b> vote{margin === 1 ? '' : 's'}
        </div>
        {result.isSafe ? (
          <p className="sub">
            Safe: even if all {swing} undecided/unmarked voters went to {second.name}, {top.name} stays ahead.
          </p>
        ) : (
          <p className="warn">Not safe yet: {swing} voters are undecided or unmarked, enough to change this.</p>
        )}
      </>
    )
  }

  return (
    <>
      <h2>{label}</h2>
      {head}
      <div style={{ marginTop: 14 }}>
        {ranked.map((c) => {
          const pct = counted ? (c.votes / counted) * 100 : 0
          return (
            <div className="res-row" key={c.id}>
              <div>
                <span className="chip" style={{ background: c.color }} />
                {c.name}
              </div>
              <div className="track">
                <i style={{ width: `${pct}%`, background: c.color }} />
              </div>
              <div>
                <b>{c.votes}</b> <span className="sub">({pct.toFixed(1)}%)</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="stats">
        <span className="stat">
          Voters: <b>{total}</b>
        </span>
        <span className="stat">
          Votes for candidates: <b>{counted}</b>
        </span>
        <span className="stat">
          Undecided: <b>{counts.undecided}</b>
        </span>
        <span className="stat">
          Won't vote / away: <b>{counts.novote}</b>
        </span>
        <span className="stat">
          Not marked: <b>{unmarked}</b>
        </span>
      </div>
    </>
  )
}
