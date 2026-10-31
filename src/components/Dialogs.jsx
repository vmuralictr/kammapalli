import { createContext, useCallback, useContext, useRef, useState } from 'react'

/*
 * In-app confirm dialog and toast. Browser confirm()/alert() are avoided
 * because they are blocked in some embedded previews.
 */
const DialogContext = createContext(null)

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState(null)
  const timer = useRef()

  const ask = useCallback(
    ({ title, body, yes = 'Yes', no = 'Cancel' }) =>
      new Promise((resolve) => setDialog({ title, body, yes, no, resolve })),
    [],
  )
  const tell = useCallback((title, body) => ask({ title, body, yes: 'OK', no: null }), [ask])

  const showToast = useCallback((text, onUndo) => {
    clearTimeout(timer.current)
    setToast({ text, onUndo })
    timer.current = setTimeout(() => setToast(null), 8000)
  }, [])

  const close = (value) => {
    dialog?.resolve(value)
    setDialog(null)
  }

  return (
    <DialogContext.Provider value={{ ask, tell, toast: showToast }}>
      {children}
      {dialog && (
        <div className="modal-bg" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>{dialog.title}</h3>
            <p>{dialog.body}</p>
            <div className="btns">
              {dialog.no !== null && <button onClick={() => close(false)}>{dialog.no}</button>}
              <button className="primary" autoFocus onClick={() => close(true)}>
                {dialog.yes}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>{toast.text}</span>
          {toast.onUndo && (
            <button
              onClick={() => {
                setToast(null)
                toast.onUndo()
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
    </DialogContext.Provider>
  )
}

export const useDialogs = () => useContext(DialogContext)
