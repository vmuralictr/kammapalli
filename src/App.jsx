import { useEffect, useRef, useState } from 'react'
import CandidateSetup from './components/CandidateSetup'
import DataTools from './components/DataTools'
import { useDialogs } from './components/Dialogs'
import FinalResult from './components/FinalResult'
import GroupPicker from './components/GroupPicker'
import GroupResult from './components/GroupResult'
import MovedVoters from './components/MovedVoters'
import VoterTable from './components/VoterTable'
import { GROUPS, ROLL, VOTERS } from './lib/constants'
import { groupOf, votersInGroup } from './lib/tally'
import { useTracker } from './lib/useTracker'

const scrollTo = (ref) => setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 50)

export default function App() {
  const t = useTracker()
  const { state } = t
  const { ask, tell, toast } = useDialogs()

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

  const requestMove = async (voter, to) => {
    const from = groupOf(voter, state.moves)
    if (to === from) return
    const ok = await ask({
      title: 'Move voter?',
      body: `Move ${voter.name} (Roll ${voter.serialNo}) from ${from} to ${to}?`,
      yes: 'Move',
    })
    if (!ok) return
    t.moveVoter(voter.epicNo, to)
    toast(`${voter.name} moved to ${to}.`, () => {
      t.moveVoter(voter.epicNo, from)
      toast(`Move undone. ${voter.name} is back in ${from}.`)
    })
  }

  const revertOne = async (voter) => {
    const ok = await ask({ title: 'Revert move?', body: `Send ${voter.name} back to ${voter.homeGroup}?`, yes: 'Revert' })
    if (!ok) return
    t.moveVoter(voter.epicNo, voter.homeGroup)
    toast(`${voter.name} is back in ${voter.homeGroup}.`)
  }

  const revertAll = async () => {
    const n = Object.keys(state.moves).length
    const ok = await ask({
      title: 'Revert all moves?',
      body: `Send all ${n} moved voter(s) back to their original groups?`,
      yes: 'Revert all',
    })
    if (!ok) return
    t.revertAllMoves()
    toast('All moves reverted.')
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
          <VoterTable state={state} onMark={t.markVoter} onMoveRequest={requestMove} />
        </div>

        {showFinal && allDone && <FinalResult ref={finalRef} state={state} />}

        <MovedVoters moves={state.moves} onRevert={revertOne} onRevertAll={revertAll} />
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
  )
}
