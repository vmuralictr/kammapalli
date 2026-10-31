import { useRef } from 'react'
import { useDialogs } from './Dialogs'

export default function DataTools({ exportData, importData, clearMarks }) {
  const fileRef = useRef()
  const { ask, tell, toast } = useDialogs()

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'sarpanch-marks.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const doImport = async (e) => {
    const f = e.target.files[0]
    e.target.value = ''
    if (!f) return
    try {
      importData(JSON.parse(await f.text()))
      toast('Marks imported.')
    } catch {
      tell('Import failed', 'That file could not be read.')
    }
  }

  const doClear = async () => {
    const ok = await ask({
      title: 'Clear all marks?',
      body: "This clears every voter's mark and all submitted groups. Moves are kept.",
      yes: 'Clear',
    })
    if (ok) clearMarks()
  }

  return (
    <section className="card">
      <h2>Save or move your work</h2>
      <div className="tools">
        <button onClick={doExport}>Export marks</button>
        <button onClick={() => fileRef.current.click()}>Import marks</button>
        <input ref={fileRef} type="file" accept=".json" hidden onChange={doImport} />
        <button onClick={doClear}>Clear all marks</button>
      </div>
    </section>
  )
}
