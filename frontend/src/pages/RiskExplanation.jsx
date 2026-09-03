import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, FileQuestion } from 'lucide-react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import RiskBadge from '../components/RiskBadge'
import EmptyState from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { api } from '../api/client'

export default function RiskExplanation() {
  const { id } = useParams()
  const [txn, setTxn] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get(`/transactions/${id}`)
      .then(setTxn)
      .catch(() => setTxn(null))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <Layout>
      <div className="max-w-xl">
        <Link
          to="/activity"
          className="inline-flex items-center gap-1 text-caption text-ink-600 hover:text-ink-900 mb-6 transition-colors duration-[120ms] ease-out"
        >
          <ChevronLeft size={16} /> Back to Activity
        </Link>

        {loading ? (
          <div className="flex flex-col gap-6">
            <div className="skeleton h-8 w-48" />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : !txn ? (
          <Card>
            <EmptyState
              icon={FileQuestion}
              message="Transaction not found or could not be loaded."
              action={{ label: 'View Activity', to: '/activity' }}
            />
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-title font-semibold text-ink-900 capitalize">
                {txn.type} {txn.symbol ? `· ${txn.symbol}` : ''}
              </h1>
              <RiskBadge decision={txn.decision} />
            </div>
            <p className="text-caption text-ink-600 mb-8">
              ₹{txn.amount.toLocaleString('en-IN')} ·{' '}
              {new Date(txn.created_at).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <Card>
                <p className="text-caption font-medium text-ink-600 mb-1">Risk score</p>
                <p className="font-sans text-[26px] leading-[32px] font-semibold text-ink-900">
                  {txn.risk_score != null ? `${Math.round(txn.risk_score * 100)}%` : '—'}
                </p>
              </Card>

              <Card>
                <p className="text-caption font-medium text-ink-600 mb-1">Status</p>
                <p className="font-sans text-[26px] leading-[32px] font-semibold text-ink-900 capitalize">
                  {txn.status}
                </p>
              </Card>
            </div>

            <section>
              <h2 className="font-sans text-secondary font-semibold text-ink-900 uppercase text-eyebrow mb-3">
                Identified Signals
              </h2>
              <Card>
                <ul className="flex flex-col gap-4">
                  {(txn.reasons || []).map((reason, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                      <p className="text-secondary text-ink-900">{reason}</p>
                    </li>
                  ))}
                  {(!txn.reasons || txn.reasons.length === 0) && (
                    <p className="text-secondary text-ink-600">
                      Standard transaction — no anomalous signals detected.
                    </p>
                  )}
                </ul>
              </Card>
            </section>
          </>
        )}
      </div>
    </Layout>
  )
}
