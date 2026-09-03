import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import Toast from '../components/Toast'
import PreCommitmentGate from '../components/PreCommitmentGate'
import StepUpModal from '../components/StepUpModal'
import { useEventTracker } from '../context/EventTrackerContext'
import { api } from '../api/client'

export default function Trade() {
  const navigate = useNavigate()
  const { trackEvent } = useEventTracker()

  const [step, setStep] = useState('form')
  const [amount, setAmount] = useState('')
  const [symbol, setSymbol] = useState('')

  const [transactionId, setTransactionId] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [showStepUp, setShowStepUp] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    trackEvent('page_view', { path: '/trade' })
  }, [])

  function handleReview(e) {
    e.preventDefault()
    setStep('review')
    trackEvent('review_reached')
  }

  function handleBackToEdit() {
    trackEvent('back_navigation', { from_path: 'review', to_path: 'form' })
    setStep('form')
  }

  async function handleConfirm() {
    setSubmitting(true)
    try {
      const prep = await api.post('/transactions/prepare', {
        type: 'trade',
        amount: parseFloat(amount),
        symbol: symbol.toUpperCase(),
      })
      setTransactionId(prep.transaction_id)

      const result = await api.post(`/risk/evaluate/${prep.transaction_id}`)
      setEvaluation(result)
      trackEvent('gate_shown', { decision: result.decision }, prep.transaction_id)

      if (result.decision === 'ALLOW') {
        await api.post(`/transactions/${prep.transaction_id}/confirm`)
        setShowToast(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifySubmit(code) {
    const res = await api.post(`/transactions/${transactionId}/step-up/verify`, { otp_code: code })
    if (res.status === 'completed') {
      setShowStepUp(false)
      navigate('/activity')
    }
  }

  async function handleCancelGate() {
    if (transactionId) await api.post(`/transactions/${transactionId}/cancel`)
    setEvaluation(null)
    setStep('form')
  }

  function handleHoldSubmit() {
    navigate(`/holds/${transactionId}`)
  }

  return (
    <Layout>
      <div className="max-w-md">
        <h1 className="text-xl font-semibold text-text-primary mb-6">Place a trade</h1>

        {step === 'form' && (
          <Card>
            <form onSubmit={handleReview} className="flex flex-col gap-5">
              <Input
                label="Symbol"
                placeholder="e.g. ZYX"
                value={symbol}
                onFocus={() => trackEvent('field_focus', { field_name: 'symbol' })}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onBlur={() => trackEvent('field_edit', { field_name: 'symbol', value_length: symbol.length })}
                required
              />
              <Input
                label="Amount (₹)"
                type="number"
                min="1"
                value={amount}
                onFocus={() => trackEvent('field_focus', { field_name: 'amount' })}
                onChange={(e) => {
                  setAmount(e.target.value)
                  trackEvent('amount_change', { new_amount: e.target.value })
                }}
                onBlur={() => trackEvent('field_edit', { field_name: 'amount', value_length: amount.length })}
                required
              />

              <Button type="submit" disabled={!amount || !symbol} className="w-full mt-2">
                Review
              </Button>
            </form>
          </Card>
        )}

        {step === 'review' && (
          <Card>
            <button
              onClick={handleBackToEdit}
              className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-5 transition-colors duration-150 ease-out"
            >
              <ChevronLeft size={16} /> Edit
            </button>

            <div className="flex flex-col gap-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Symbol</span>
                <span className="text-text-primary font-medium">{symbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Amount</span>
                <span className="text-text-primary font-medium">
                  ₹{parseFloat(amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <Button onClick={handleConfirm} disabled={submitting} className="w-full">
              {submitting ? 'Checking…' : 'Confirm'}
            </Button>
          </Card>
        )}
      </div>

      {evaluation && evaluation.decision !== 'ALLOW' && !showStepUp && (
        <PreCommitmentGate
          decision={evaluation.decision}
          reasons={evaluation.reasons}
          onVerify={() => setShowStepUp(true)}
          onHold={handleHoldSubmit}
          onCancel={handleCancelGate}
        />
      )}

      {showStepUp && (
        <StepUpModal
          reasons={evaluation?.reasons}
          onSubmit={handleVerifySubmit}
          onCancel={() => {
            setShowStepUp(false)
            handleCancelGate()
          }}
        />
      )}

      <Toast
        show={showToast}
        message="Looks good — trade placed."
        onDone={() => navigate('/activity')}
      />
    </Layout>
  )
}
