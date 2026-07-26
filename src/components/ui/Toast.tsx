import { useEffect, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

let toastSetters: Set<React.Dispatch<React.SetStateAction<Toast[]>>> = new Set()

export function showToast(message: string, type: ToastType = 'info', duration = 3000) {
  const id = Date.now().toString()
  const toast: Toast = { id, message, type }
  
  toastSetters.forEach(setter => {
    setter(prev => [...prev, toast])
  })
  
  setTimeout(() => {
    toastSetters.forEach(setter => {
      setter(prev => prev.filter(t => t.id !== id))
    })
  }, duration)
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    toastSetters.add(setToasts)
    return () => {
      toastSetters.delete(setToasts)
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all transform animate-in slide-in-from-right fade-in duration-300 ${
            toast.type === 'success' ? 'bg-green-600' :
            toast.type === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
