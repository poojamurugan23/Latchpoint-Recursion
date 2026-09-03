import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListOrdered } from 'lucide-react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import RiskBadge from '../components/RiskBadge'
import EmptyState from '../components/EmptyState'
import { SkeletonTable } from '../components/Skeleton'
import { api } from '../api/client'

const FILTERS = ['ALL', 'ALLOW', 'VERIFY', 'HOLD', 'BLOCK']

export default function Activity() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    api
      .get('/transactions?limit=100')
      .then(setTransactions)
      .finally(() => setLoading(false))
  }, [])

  const filtered =
    filter === 'ALL' ? transactions : transactions.filter((t) => t.decision === filter)

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-title font-semibold text-ink-900">
          Activity
        </h1>
      </div>

      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-sm px-3.5 py-1.5 text-caption font-semibold transition-colors duration-[120ms] ease-out ${
              filter === f
                ? 'bg-accent-tint text-accent'
                : 'text-ink-600 hover:text-ink-900 hover:bg-bg-subtle'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable rows={6} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={ListOrdered}
            message={
              filter === 'ALL'
                ? 'No transactions yet. Complete a transfer or trade to build your risk timeline.'
                : `No transactions evaluated with '${filter}'.`
            }
            action={filter === 'ALL' ? { label: 'New Transfer', to: '/transfer' } : null}
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <ul className="flex flex-col divide-y divide-border">
            {filtered.map((t) => (
              <li
                key={t.id}
                onClick={() => navigate(`/transactions/${t.id}`)}
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-bg-subtle transition-colors duration-[120ms] ease-out"
              >
                <div>
                  <p className="text-secondary font-medium text-ink-900 capitalize">
                    {t.type}
                    {t.symbol ? ` · ${t.symbol}` : ''}
                  </p>
                  <p className="text-caption text-ink-600 mt-0.5">
                    ₹{t.amount.toLocaleString('en-IN')} ·{' '}
                    {new Date(t.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-caption text-ink-400 capitalize">{t.status}</span>
                  <RiskBadge decision={t.decision} />
                  <span className="text-caption text-ink-400">→</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Layout>
  )
}
