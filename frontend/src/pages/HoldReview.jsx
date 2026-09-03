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
      <div className="max-w-md mx-auto text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-hold-bg mb-5">
          <Clock size={26} className="text-hold" />
        </div>
        <h1 className="text-xl font-semibold text-text-primary mb-2">Under review</h1>
        <p className="text-sm text-text-secondary mb-6">
          We've paused this transaction for a closer look. This usually takes less than 2 hours —
          you'll be notified as soon as it's resolved.
        </p>

        {txn && (
          <Card className="text-left mb-6">
            <p className="text-sm text-text-secondary mb-3">Why this was held:</p>
            <ul className="flex flex-col gap-2">
              {(txn.reasons || []).map((r, i) => (
                <li key={i} className="text-sm text-text-primary flex gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-hold flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Link to="/activity">
          <Button variant="ghost">Check status in Activity</Button>
        </Link>
      </div>
    </Layout>
  )
}
