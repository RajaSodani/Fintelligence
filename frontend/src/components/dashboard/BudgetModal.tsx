import { useState } from 'react'
import { X, Target } from 'lucide-react'
import { useBudget, BUDGET_CATEGORIES } from '@/hooks/useBudget'
import { formatCompact } from '@/lib/utils'

interface Props {
  onClose: () => void
}

export function BudgetModal({ onClose }: Props) {
  const { budgets, save } = useBudget()
  const [draft, setDraft] = useState<Record<string, string>>(
    () => Object.fromEntries(BUDGET_CATEGORIES.map((c) => [c, String(budgets[c] ?? 0)]))
  )

  const total = BUDGET_CATEGORIES.reduce((s, c) => s + (parseFloat(draft[c]) || 0), 0)

  const handleSave = () => {
    const next: Record<string, number> = {}
    for (const cat of BUDGET_CATEGORIES) {
      next[cat] = parseFloat(draft[cat]) || 0
    }
    save(next)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(7,9,15,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl shadow-card flex flex-col w-full max-w-md max-h-[85vh]">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(0,232,122,0.1)] flex items-center justify-center">
              <Target size={15} className="text-[var(--green)]" />
            </div>
            <div>
              <p className="font-syne font-bold text-[15px] text-[var(--text)]">Monthly Budget</p>
              <p className="font-mono text-2xs text-[var(--text3)]">Total: {formatCompact(total)}/mo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-3">
          {BUDGET_CATEGORIES.map((cat) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="font-dm text-[14px] text-[var(--text2)] flex-1 min-w-0 truncate">{cat}</span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="font-mono text-xs text-[var(--text3)]">₹</span>
                <input
                  type="number"
                  min={0}
                  value={draft[cat]}
                  onChange={(e) => setDraft((d) => ({ ...d, [cat]: e.target.value }))}
                  className="w-24 bg-[var(--bg3)] border border-[var(--border2)] rounded-lg px-3 py-1.5 font-mono text-sm text-[var(--text)] text-right outline-none focus:border-[rgba(0,232,122,0.4)] transition-colors"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-[var(--border)] flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--border2)] font-syne font-semibold text-sm text-[var(--text2)] hover:bg-[var(--bg3)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl font-syne font-semibold text-sm transition-colors"
            style={{ background: 'var(--green)', color: '#07090f' }}
          >
            Save Budget
          </button>
        </div>
      </div>
    </div>
  )
}
