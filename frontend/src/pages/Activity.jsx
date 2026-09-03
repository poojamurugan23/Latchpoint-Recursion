import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/Card'
import RiskBadge from '../components/RiskBadge'
import { api } from '../api/client'

const FILTERS = ['ALL', 'ALLOW', 'VERIFY', 'HOLD', 'BLOCK']

export default function Activity() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    api.get('/transactions?limit=100').then(setTransactions)
  }, [])

  const filtered =
    filter === 'ALL' ? transactions : transactions.filter((t) => t.decision === filter)

  return (
    <Layout>
      <h1 className="text-xl font-semibold text-text-primary mb-6">Activity</h1>

      <div className="flex gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-out ${
              filter === f
                ? 'bg-surface-alt text-text-primary'
                : 'text-text-secondary hover:bg-surface-alt'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <p className="text-sm text-text-secondary">No transactions.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {filtered.map((t) => (
              <li
                key={t.id}
                onClick={() => navigate(`/transactions/${t.id}`)}
                className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 cursor-pointer hover:bg-surface-alt -mx-2 px-2 rounded-sm transition-colors duration-150 ease-out"
              >
                <div>
                  <p className="text-sm text-text-primary capitalize">
                    {t.type}
                    {t.symbol ? ` · ${t.symbol}` : ''}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    ₹{t.amount.toLocaleString('en-IN')} ·{' '}
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-tertiary capitalize">{t.status}</span>
                  <RiskBadge decision={t.decision} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Layout>
  )
}
