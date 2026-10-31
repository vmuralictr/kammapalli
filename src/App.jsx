import { useEffect, useRef, useState } from 'react'
import CandidateSetup from './components/CandidateSetup'
import DataTools from './components/DataTools'
import { useDialogs } from './components/Dialogs'
import FinalResult from './components/FinalResult'
import GroupPicker from './components/GroupPicker'
import GroupResult from './components/GroupResult'
import ManageVoters from './components/ManageVoters'
import VoterTable from './components/VoterTable'
import { GROUPS, ROLL, VOTERS } from './lib/constants'
import { votersInGroup } from './lib/tally'
import { useTracker } from './lib/useTracker'

const scrollTo = (ref) => setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 50)

export default function App() {
  const t = useTracker()
  const { state } = t
  const { ask, tell } = useDialogs()
  const [view, setView] = useState('track') // 'track' | 'manage'

  // Which result panels are open. Group result shows for the current group once submitted.
  const [showGroupResult, setShowGroupResult] = useState(() => !!state.submitted[state.current])
  const [showFinal, setShowFinal] = useState(false)
  const groupResultRef = useRef()
  const finalRef = useRef()
  const voterRef = useRef()

  const allDone = GROUPS.every((g) => state.submitted[g] === 'done')
  const current = votersInGroup(state.current, state.moves)
  const markedHere = current.filter((v) => state.marks[v.epicNo]).length

  // Any change invalidates an open final result.
  useEffect(() => {
    if (!allDone) setShowFinal(false)
  }, [allDone])

  const pickGroup = (g) => {
    t.setCurrent(g)
    setShowGroupResult(!!state.submitted[g])
    setShowFinal(false)
    scrollTo(voterRef)
  }

  const submit = async () => {
    if (!state.candidates.length) {
      tell('Add candidates first', 'Please enter the candidate names in Step 1.')
      return
    }
    const unmarked = current.length - markedHere
    if (unmarked) {
      const ok = await ask({
        title: 'Some voters not marked',
        body: `${unmarked} voter(s) in ${state.current} are not marked yet. Submit anyway?`,
        yes: 'Submit',
      })
      if (!ok) return
    }
    t.submitGroup(state.current)
    setShowGroupResult(true)
    scrollTo(groupResultRef)
  }

  const openFinal = () => {
    const pending = GROUPS.filter((g) => state.submitted[g] !== 'done')
    if (pending.length) {
      tell('Groups not submitted', `Please submit these groups first: ${pending.join(', ')}`)
      return
    }
    setShowFinal(true)
    scrollTo(finalRef)
  }

  const goTo = (v) => {
    setView(v)
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      <header>
        <h1>Sarpanch Vote Tracker</h1>
        <p>
          Part {ROLL.partNumber} · Kammapalle · {ROLL.assemblyConstituency} · Draft roll SIR 2026 · {VOTERS.length}{' '}
          voters
        </p>
      </header>

      <nav className="tabs" role="tablist">
        <button role="tab" id="tabTrack" aria-selected={view === 'track'} className={view === 'track' ? 'active' : ''} onClick={() => goTo('track')}>
          Vote tracker
        </button>
        <button role="tab" id="tabManage" aria-selected={view === 'manage'} className={view === 'manage' ? 'active' : ''} onClick={() => goTo('manage')}>
          Manage voters
          {Object.keys(state.moves).length > 0 && <span className="tab-count">{Object.keys(state.moves).length} moved</span>}
        </button>
      </nav>

      {view === 'manage' ? (
        <main>
          <ManageVoters state={state} moveVoters={t.moveVoters} revertAllMoves={t.revertAllMoves} />
        </main>
      ) : (
      <>
      <main>
        <CandidateSetup
          candidates={state.candidates}
          marks={state.marks}
          onSave={t.setCandidates}
          onDelete={t.deleteCandidate}
          onDeleteAll={t.deleteAllCandidates}
          onColor={t.setCandidateColor}
        />
        <GroupPicker state={state} onPick={pickGroup} />

        {showGroupResult && state.submitted[state.current] && (
          <GroupResult
            ref={groupResultRef}
            state={state}
            group={state.current}
            onNext={(g) => {
              t.setCurrent(g)
              setShowGroupResult(false)
              scrollTo(voterRef)
            }}
            onFinal={openFinal}
          />
        )}

        <div ref={voterRef}>
          <VoterTable state={state} onMark={t.markVoter} onManage={() => goTo('manage')} />
        </div>

        {showFinal && allDone && <FinalResult ref={finalRef} state={state} />}

        <DataTools exportData={t.exportData} importData={t.importData} clearMarks={t.clearMarks} />
      </main>

      <div className="bar">
        <div className="in">
          <div className="progress">
            <span id="progTxt">
              {state.current}: {markedHere} of {current.length} marked
            </span>
            <div className="pbar">
              <i style={{ width: `${(markedHere / current.length) * 100}%` }} />
            </div>
          </div>
          <button className="primary" id="submitBtn" onClick={submit}>
            Submit {state.current}
          </button>
          {allDone && (
            <button className="primary win-btn" id="finalBtn" onClick={openFinal}>
              See final result
            </button>
          )}
        </div>
      </div>
      </>
      )}
    </>
  )
}
