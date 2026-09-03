import { useEffect, useState } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { api } from '../api/client'

const COLORS = {
  ALLOW: '#3A8A4A',
  VERIFY: '#C98A2E',
  HOLD: '#C9622E',
  BLOCK: '#B3402F',
}

function StatCard({ label, value }) {
  return (
    <Card>
      <p className="text-sm text-text-secondary mb-1">{label}</p>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
    </Card>
  )
}

export default function KpiDashboard() {
  const [kpi, setKpi] = useState(null)

  useEffect(() => {
    api.get('/kpi/summary').then(setKpi)
  }, [])

  if (!kpi) {
    return (
      <Layout>
        <p className="text-sm text-text-secondary">Loading…</p>
      </Layout>
    )
  }

  const chartData = Object.entries(kpi.decisions_by_type).map(([decision, count]) => ({
    decision,
    count,
  }))

  return (
    <Layout>
      <h1 className="text-xl font-semibold text-text-primary mb-6">Insights</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <StatCard label="Avg. detection lead time" value={`${kpi.detection_lead_time_avg_sec.toFixed(1)}s`} />
        <StatCard label="False challenge rate" value={`${Math.round(kpi.false_challenge_rate * 100)}%`} />
        <StatCard label="Intervention accuracy" value={`${Math.round(kpi.intervention_accuracy * 100)}%`} />
        <StatCard
          label="Prevented exposure"
          value={`₹${kpi.total_prevented_exposure.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
        />
      </div>

      <h2 className="text-sm font-medium text-text-primary mb-3">Decisions by type</h2>
      <Card>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E1" vertical={false} />
              <XAxis dataKey="decision" stroke="#6B6963" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B6963" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#FFFFFF',
                  border: '1px solid #E8E6E1',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.decision} fill={COLORS[entry.decision]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </Layout>
  )
}
