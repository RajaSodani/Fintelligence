import { useState } from 'react'
import { X, Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { coreApi } from '@/lib/axios'

const CATEGORIES = ['Food & Dining', 'Shopping', 'Transport', 'Subscriptions', 'Utilities', 'Housing & Finance', 'Health', 'Income', 'Other']

interface Props {
  onClose: () => void
  onSuccess: () => void
}

type Tab = 'transaction' | 'account'

export function CashEntryModal({ onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<Tab>('transaction')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Transaction form
  const [txName, setTxName] = useState('')
  const [txAmount, setTxAmount] = useState('')
  const [txType, setTxType] = useState<'debit' | 'credit'>('debit')
  const [txCategory, setTxCategory] = useState('Other')
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10))

  // Account form
  const [accName, setAccName] = useState('')
  const [accBalance, setAccBalance] = useState('')
  const [accType, setAccType] = useState('depository')

  const handleSaveTx = async () => {
    if (!txName.trim() || !txAmount || !txDate) return
    setSaving(true)
    setError(null)
    try {
      await coreApi.post('/api/v1/transactions/manual', {
        name: txName.trim(),
        amount: parseFloat(txAmount),
        isCredit: txType === 'credit',
        category: txCategory,
        date: txDate,
      })
      window.dispatchEvent(new CustomEvent('finmind:sync'))
      onSuccess()
      onClose()
    } catch {
      setError('Failed to save transaction')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAccount = async () => {
    if (!accName.trim() || !accBalance) return
    setSaving(true)
    setError(null)
    try {
      await coreApi.post('/api/v1/transactions/manual-account', {
        name: accName.trim(),
        type: accType,
        balance: parseFloat(accBalance),
      })
      window.dispatchEvent(new CustomEvent('finmind:sync'))
      onSuccess()
      onClose()
    } catch {
      setError('Failed to save account')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(7,9,15,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl shadow-card flex flex-col w-full max-w-sm">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(0,232,122,0.1)] flex items-center justify-center">
              <Wallet size={15} className="text-[var(--green)]" />
            </div>
            <p className="font-syne font-bold text-[15px] text-[var(--text)]">Add Cash Entry</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-4 gap-2">
          {(['transaction', 'account'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl font-syne font-semibold text-sm transition-all"
              style={{
                background: tab === t ? 'var(--green)' : 'var(--bg3)',
                color: tab === t ? '#07090f' : 'var(--text2)',
                border: tab === t ? 'none' : '1px solid var(--border2)',
              }}
            >
              {t === 'transaction' ? 'Transaction' : 'Account'}
            </button>
          ))}
        </div>

        <div className="px-5 pb-5 flex flex-col gap-4">
          {tab === 'transaction' ? (
            <>
              {/* Type toggle */}
              <div className="flex gap-2">
                {(['debit', 'credit'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTxType(type)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-syne font-semibold text-xs transition-all border"
                    style={{
                      background: txType === type ? (type === 'debit' ? 'rgba(255,77,106,0.1)' : 'rgba(0,232,122,0.1)') : 'var(--bg3)',
                      borderColor: txType === type ? (type === 'debit' ? 'rgba(255,77,106,0.3)' : 'rgba(0,232,122,0.3)') : 'var(--border2)',
                      color: txType === type ? (type === 'debit' ? 'var(--red)' : 'var(--green)') : 'var(--text3)',
                    }}
                  >
                    {type === 'debit' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                    {type === 'debit' ? 'Expense' : 'Income'}
                  </button>
                ))}
              </div>

              <Field label="Description">
                <input
                  type="text"
                  value={txName}
                  onChange={(e) => setTxName(e.target.value)}
                  placeholder="e.g. Grocery, Salary"
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (₹)">
                  <input
                    type="number"
                    min={0}
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0"
                    className={inputCls}
                  />
                </Field>
                <Field label="Date">
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Category">
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className={inputCls}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              {error && <p className="text-xs text-[var(--red)]">{error}</p>}

              <button
                onClick={handleSaveTx}
                disabled={!txName.trim() || !txAmount || saving}
                className="py-3 rounded-xl font-syne font-semibold text-sm transition-all disabled:opacity-50"
                style={{ background: 'var(--green)', color: '#07090f' }}
              >
                {saving ? 'Saving…' : 'Add Transaction'}
              </button>
            </>
          ) : (
            <>
              <Field label="Account Name">
                <input
                  type="text"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="e.g. Cash Wallet, Savings Jar"
                  className={inputCls}
                />
              </Field>

              <Field label="Current Balance (₹)">
                <input
                  type="number"
                  min={0}
                  value={accBalance}
                  onChange={(e) => setAccBalance(e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
              </Field>

              <Field label="Account Type">
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value)}
                  className={inputCls}
                >
                  <option value="depository">Cash / Savings</option>
                  <option value="credit">Credit Card</option>
                  <option value="loan">Loan</option>
                </select>
              </Field>

              {error && <p className="text-xs text-[var(--red)]">{error}</p>}

              <button
                onClick={handleSaveAccount}
                disabled={!accName.trim() || !accBalance || saving}
                className="py-3 rounded-xl font-syne font-semibold text-sm transition-all disabled:opacity-50"
                style={{ background: 'var(--green)', color: '#07090f' }}
              >
                {saving ? 'Saving…' : 'Add Account'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full bg-[var(--bg3)] border border-[var(--border2)] rounded-xl px-3 py-2.5 font-dm text-[14px] text-[var(--text)] outline-none focus:border-[rgba(0,232,122,0.4)] transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1.5">{label}</p>
      {children}
    </div>
  )
}
