import { useEffect, useState } from 'react'
import { ShieldCheck, Plus, Users } from 'lucide-react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import { SkeletonTable } from '../components/Skeleton'
import { api } from '../api/client'

export default function Payees() {
  const [payees, setPayees] = useState([])
  const [name, setName] = useState('')
  const [account, setAccount] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  function load() {
    api
      .get('/payees')
      .then(setPayees)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!name || !account) return
    setSubmitting(true)
    try {
      await api.post('/payees', { name, masked_account_number: account })
      setName('')
      setAccount('')
      load()
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleTrusted(payee) {
    await api.patch(`/payees/${payee.id}`, { is_trusted: !payee.is_trusted })
    load()
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-title font-semibold text-ink-900">
          Payees
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {loading ? (
            <SkeletonTable rows={4} />
          ) : payees.length === 0 ? (
            <Card>
              <EmptyState
                icon={Users}
                message="No saved payees yet. Add your regular recipients to establish baseline trust."
              />
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              <ul className="flex flex-col divide-y divide-border">
                {payees.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-bg-subtle transition-colors duration-[120ms] ease-out"
                  >
                    <div>
                      <p className="text-secondary font-medium text-ink-900">{p.name}</p>
                      <p className="text-caption text-ink-600 mt-0.5">{p.masked_account_number}</p>
                    </div>
                    <button
                      onClick={() => toggleTrusted(p)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold transition-colors duration-[120ms] ease-out ${
                        p.is_trusted
                          ? 'bg-allow-bg text-allow'
                          : 'border border-border bg-transparent text-ink-600 hover:text-ink-900 hover:bg-bg-subtle'
                      }`}
                    >
                      <ShieldCheck size={14} />
                      {p.is_trusted ? 'Trusted' : 'Mark trusted'}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <h2 className="text-secondary font-semibold text-ink-900 mb-4">Add a payee</h2>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <Input
                label="Name"
                placeholder="e.g. Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Account number"
                placeholder="****1234"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                required
              />
              <Button type="submit" disabled={submitting || !name || !account} className="w-full mt-2">
                <Plus size={16} /> {submitting ? 'Adding…' : 'Add payee'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
