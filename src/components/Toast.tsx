import { CheckCircle2, AlertCircle } from 'lucide-react'

export interface ToastData { id: number; kind: 'ok' | 'error'; text: string }

export default function Toast({ toast }: { toast: ToastData | null }) {
  if (!toast) return null
  const ok = toast.kind === 'ok'
  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className="animate-toast fixed bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-sm items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 text-sm font-semibold text-white shadow-2xl shadow-ink/30"
    >
      {ok ? <CheckCircle2 size={20} className="shrink-0 text-[#7ddc6a]" /> : <AlertCircle size={20} className="shrink-0 text-[#ff6b81]" />}
      <span>{toast.text}</span>
    </div>
  )
}
