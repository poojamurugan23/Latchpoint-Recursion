import { useEffect, useState } from 'react'
import { ShieldCheck, Plus } from 'lucide-react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { api } from '../api/client'

export default function Payees() {
  const [payees, setPayees] = useState([])
  const [name, setName] = useState('')
  const [account, setAccount] = useState('')
  const [loading, setLoading] = useState(true)

  function load() {
    api.get('/payees').then(setPayees).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!name || !account) return
    await api.post('/payees', { name, masked_account_number: account })
    setName('')
    setAccount('')
    load()
  }

  async function toggleTrusted(payee) {
    await api.patch(`/payees/${payee.id}`, { is_trusted: !payee.is_trusted })
    load()
  }

  return (
    <Layout>
      <h1 className="text-xl font-semibold text-text-primary mb-6">Payees</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          {loading ? (
            <p className="text-sm text-text-secondary">Loading…</p>
          ) : payees.length === 0 ? (
            <p className="text-sm text-text-secondary">No payees yet. Add one to get started.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {payees.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{p.name}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{p.masked_account_number}</p>
                  </div>
                  <button
                    onClick={() => toggleTrusted(p)}
                    className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-out ${
                      p.is_trusted
                        ? 'bg-allow-bg text-allow'
                        : 'bg-surface-alt text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <ShieldCheck size={14} />
                    {p.is_trusted ? 'Trusted' : 'Mark trusted'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-medium text-text-primary mb-4">Add a payee</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="Account number"
              placeholder="****1234"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
            <Button type="submit" className="w-full">
              <Plus size={16} /> Add payee
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
