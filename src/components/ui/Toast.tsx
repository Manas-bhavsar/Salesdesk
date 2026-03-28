import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { CheckCircle2, AlertCircle, X } from "lucide-react"

export type ToastType = "success" | "error"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2800)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-[68px] right-[16px] z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 bg-card border border-border/40 p-4 pr-10 rounded-xl shadow-2xl shadow-black/30 min-w-[300px] max-w-[400px] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto relative backdrop-blur-sm ${
              t.type === "success" ? "border-l-2 border-l-profit" : "border-l-2 border-l-loss"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-profit shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-loss shrink-0" />
            )}
            <span className="text-sm font-medium leading-snug">{t.message}</span>
            <button 
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors duration-200 rounded-lg p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}
