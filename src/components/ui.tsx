import type { ReactNode } from 'react'

export function Spinner({ full, label }: { full?: boolean; label?: string }) {
  const el = (
    <div className="flex flex-col items-center gap-3 py-10 text-slate-500" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent opacity-60" />
      <span className="text-sm">{label || 'Đang tải...'}</span>
    </div>
  )
  return full ? <div className="flex min-h-[60vh] items-center justify-center">{el}</div> : el
}

export function Alert({ kind = 'error', children }: { kind?: 'error' | 'success' | 'info' | 'warn'; children: ReactNode }) {
  const cls = {
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
  }[kind]
  return <div className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>{children}</div>
}

export function Stars({ value, size = 16, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = value >= i - 0.25
        const half = !filled && value >= i - 0.75
        const star = (
          <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id={`half-${i}`}>
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#d1d5db" />
              </linearGradient>
            </defs>
            <path
              d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"
              fill={filled ? '#f59e0b' : half ? `url(#half-${i})` : '#d1d5db'}
            />
          </svg>
        )
        return onChange ? (
          <button key={i} type="button" onClick={() => onChange(i)} aria-label={`${i} sao`} className="p-0.5">
            {star}
          </button>
        ) : (
          <span key={i}>{star}</span>
        )
      })}
    </span>
  )
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 text-slate-900 shadow-xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-2xl leading-none text-slate-500 hover:bg-slate-100" aria-label="Đóng">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
