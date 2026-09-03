import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftRight, LineChart } from 'lucide-react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Button from '../components/Button'
import RiskBadge from '../components/RiskBadge'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function Dashboard() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    api.get('/transactions?limit=5').then(setTransactions)
  }, [])

  // Backend timestamps are naive UTC ("no Z" suffix); comparing raw date
  // prefixes avoids the browser reinterpreting them as local time.
  const todayUtc = new Date().toISOString().slice(0, 10)
  const exposureToday = transactions
    .filter((t) => t.status === 'completed' && t.created_at.slice(0, 10) === todayUtc)
    .reduce((sum, t) => sum + t.amount, 0)

  const baseline = 5000
  const exposureRatio = Math.min(exposureToday / baseline, 1)
  const isElevated = exposureToday > baseline * 2

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-1">
          <p className="text-sm text-text-secondary mb-1">Balance</p>
          <p className="text-2xl font-semibold text-text-primary">
            ₹{(user?.balance ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </Card>

        <Card className="md:col-span-2">
          <p className="text-sm text-text-secondary mb-2">Exposure today</p>
          <div className="w-full h-2 rounded-full bg-surface-alt overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-200 ease-out ${
                isElevated ? 'bg-hold' : 'bg-accent'
              }`}
              style={{ width: `${exposureRatio * 100}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary">
            ₹{exposureToday.toLocaleString('en-IN')} committed today
          </p>
        </Card>
      </div>

      <div className="flex gap-3 mb-8">
        <Link to="/transfer">
          <Button variant="primary">
            <ArrowLeftRight size={16} /> Transfer
          </Button>
        </Link>
        <Link to="/trade">
          <Button variant="ghost">
            <LineChart size={16} /> Trade
          </Button>
        </Link>
      </div>

      <h2 className="text-sm font-medium text-text-primary mb-3">Recent activity</h2>
      <Card>
        {transactions.length === 0 ? (
          <p className="text-sm text-text-secondary">No transactions yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm text-text-primary capitalize">{t.type}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    ₹{t.amount.toLocaleString('en-IN')}
                  </p>
                </div>
                <RiskBadge decision={t.decision} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Layout>
  )
}
