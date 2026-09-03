import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/Card'
import RiskBadge from '../components/RiskBadge'
import { api } from '../api/client'

export default function RiskExplanation() {
  const { id } = useParams()
  const [txn, setTxn] = useState(null)

  useEffect(() => {
    api.get(`/transactions/${id}`).then(setTxn)
  }, [id])

  if (!txn) {
    return (
      <Layout>
        <p className="text-sm text-text-secondary">Loading…</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-lg">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-semibold text-text-primary capitalize">{txn.type}</h1>
          <RiskBadge decision={txn.decision} />
        </div>
        <p className="text-sm text-text-secondary mb-6">
          ₹{txn.amount.toLocaleString('en-IN')} · {new Date(txn.created_at).toLocaleString()}
        </p>

        <Card className="mb-6">
          <p className="text-sm text-text-secondary mb-1">Risk score</p>
          <p className="text-2xl font-semibold text-text-primary">
            {txn.risk_score != null ? `${Math.round(txn.risk_score * 100)}%` : '—'}
          </p>
        </Card>

        <h2 className="text-sm font-medium text-text-primary mb-3">What we noticed</h2>
        <Card>
          <ul className="flex flex-col gap-4">
            {(txn.reasons || []).map((reason, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                <p className="text-sm text-text-primary">{reason}</p>
              </li>
            ))}
            {(!txn.reasons || txn.reasons.length === 0) && (
              <p className="text-sm text-text-secondary">No reasons recorded.</p>
            )}
          </ul>
        </Card>
      </div>
    </Layout>
  )
}
