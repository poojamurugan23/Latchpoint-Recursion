import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Button from '../components/Button'
import { api } from '../api/client'

export default function HoldReview() {
  const { id } = useParams()
  const [txn, setTxn] = useState(null)

  useEffect(() => {
    api.get(`/transactions/${id}`).then(setTxn)
  }, [id])

  return (
    <Layout>
      <div className="max-w-md mx-auto text-center pt-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-hold-bg mb-6">
          <Clock size={26} className="text-hold" />
        </div>
        <h1 className="font-display text-title font-semibold text-ink-900 mb-3">
          Under review
        </h1>
        <p className="font-sans text-body text-ink-600 mb-8 max-w-sm mx-auto">
          We've paused this transaction for a closer look. This usually takes less than 2 hours — you'll be notified as soon as it's resolved.
        </p>

        {txn && (
          <Card className="text-left mb-8">
            <p className="text-secondary font-medium text-ink-600 mb-3">Why this was held:</p>
            <ul className="flex flex-col gap-2.5">
              {(txn.reasons || []).map((r, i) => (
                <li key={i} className="text-secondary text-ink-900 flex items-start gap-2.5">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-hold flex-shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Link to="/activity">
          <Button variant="secondary">Check status in Activity</Button>
        </Link>
      </div>
    </Layout>
  )
}
