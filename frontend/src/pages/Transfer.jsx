import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import Toast from '../components/Toast'
import PreCommitmentGate from '../components/PreCommitmentGate'
import StepUpModal from '../components/StepUpModal'
import StagedAnalysis from '../components/StagedAnalysis'
import CalibrationBanner from '../components/CalibrationBanner'
import PatternReady from '../components/PatternReady'
import LocationConsent from '../components/LocationConsent'
import { useEventTracker } from '../context/EventTrackerContext'
import { useAuth } from '../context/AuthContext'
import { api, geoConsentAsked, markGeoConsentAsked } from '../api/client'
import BehavioralTracker from '../telemetry/BehavioralTracker'

export default function Transfer() {
  const navigate = useNavigate()
  const { trackEvent, captureGeolocation } = useEventTracker()
  const { user, refreshUser } = useAuth()

  const [step, setStep] = useState('form') // form | review
  const [payees, setPayees] = useState([])
  const [amount, setAmount] = useState('')
  const [payeeId, setPayeeId] = useState('')
  const [newPayeeName, setNewPayeeName] = useState('')
  const [addingPayee, setAddingPayee] = useState(false)

  const [transactionId, setTransactionId] = useState(null)
  const [evaluation, setEvaluation] = useState(null) // { decision, reasons, risk_score }
  const [showToast, setShowToast] = useState(false)
  const [showStepUp, setShowStepUp] = useState(false)
  const [showStagedAnalysis, setShowStagedAnalysis] = useState(false)
  const [calibrationProgress, setCalibrationProgress] = useState(null)
  const [showPatternReady, setShowPatternReady] = useState(false)
  const [showLocationConsent, setShowLocationConsent] = useState(!geoConsentAsked)
  const [submitting, setSubmitting] = useState(false)

  const trackerRef = useRef(null)
  const amountInputRef = useRef(null)
  const confirmBtnRef = useRef(null)

  if (!trackerRef.current) trackerRef.current = new BehavioralTracker(trackEvent)

  useEffect(() => {
    trackEvent('page_view', { path: '/transfer' })
    api.get('/payees').then(setPayees)
    trackerRef.current.mount()
    return () => trackerRef.current.unmount('leave')
  }, [])

  useEffect(() => {
    trackerRef.current.attachKeystrokeTiming(amountInputRef.current, 'amount')
  }, [])

  function handleAllowLocation() {
    markGeoConsentAsked()
    setShowLocationConsent(false)
    captureGeolocation()
  }

  function handleDismissLocation() {
    markGeoConsentAsked()
    setShowLocationConsent(false)
  }

  function handleAmountChange(e) {
    const value = e.target.value
    setAmount(value)
    trackEvent('amount_change', { new_amount: value })
  }

  function handlePayeeSelect(e) {
    const id = e.target.value
    setPayeeId(id)
    trackEvent('payee_selected', { payee_id: id, is_new_payee: false })
  }

  async function handleAddPayee() {
    if (!newPayeeName.trim()) return
    const payee = await api.post('/payees', {
      name: newPayeeName,
      masked_account_number: `****${Math.floor(1000 + Math.random() * 9000)}`,
    })
    setPayees((p) => [...p, payee])
    setPayeeId(String(payee.id))
    trackEvent('payee_selected', { payee_id: payee.id, is_new_payee: true })
    setNewPayeeName('')
    setAddingPayee(false)
  }

  function handleReview(e) {
    e.preventDefault()
    trackerRef.current.flush('form')
    setStep('review')
    trackEvent('review_reached')
  }

  function handleBackToEdit() {
    trackEvent('back_navigation', { from_path: 'review', to_path: 'form' })
    setStep('form')
  }

  async function handleConfirm() {
    setSubmitting(true)
    trackerRef.current.flush('review')
    try {
      const prep = await api.post('/transactions/prepare', {
        type: 'transfer',
        amount: parseFloat(amount),
        payee_id: parseInt(payeeId, 10),
      })
      setTransactionId(prep.transaction_id)

      if (user.calibration_status === 'calibrating') {
        const result = await api.post(`/risk/evaluate/${prep.transaction_id}`)
        setCalibrationProgress(result.calibration_progress)
        await api.post(`/transactions/${prep.transaction_id}/confirm`)
        await refreshUser()
        if (result.will_complete_calibration) {
          setShowPatternReady(true)
        } else {
          setTimeout(() => navigate('/activity'), 1600)
        }
      } else {
        setShowStagedAnalysis(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerdict(result) {
    setShowStagedAnalysis(false)
    setEvaluation(result)
    trackEvent('gate_shown', { decision: result.decision }, transactionId)

    if (result.decision === 'ALLOW') {
      await api.post(`/transactions/${transactionId}/confirm`)
      setShowToast(true)
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

  const selectedPayee = payees.find((p) => String(p.id) === String(payeeId))

  return (
    <Layout>
      <div className="max-w-md">
        <h1 className="text-xl font-semibold text-text-primary mb-6">Transfer money</h1>

        {step === 'form' && (
          <Card>
            <form onSubmit={handleReview} className="flex flex-col gap-5">
              <Input
                ref={amountInputRef}
                label="Amount (₹)"
                type="number"
                min="1"
                value={amount}
                onFocus={() => trackEvent('field_focus', { field_name: 'amount' })}
                onChange={handleAmountChange}
                onBlur={() => trackEvent('field_edit', { field_name: 'amount', value_length: amount.length })}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-text-secondary">Payee</label>
                <select
                  value={payeeId}
                  onFocus={() => trackEvent('field_focus', { field_name: 'payee' })}
                  onChange={handlePayeeSelect}
                  className="w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-base text-text-primary outline-none focus:border-accent transition-colors duration-150 ease-out"
                  required
                >
                  <option value="" disabled>
                    Select a payee
                  </option>
                  {payees.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.masked_account_number})
                    </option>
                  ))}
                </select>
              </div>

              {addingPayee ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="New payee name"
                    value={newPayeeName}
                    onChange={(e) => setNewPayeeName(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" onClick={handleAddPayee}>
                    Add
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingPayee(true)}
                  className="text-sm text-accent hover:text-accent-hover text-left transition-colors duration-150 ease-out"
                >
                  + Add a new payee
                </button>
              )}

              <Button type="submit" disabled={!amount || !payeeId} className="w-full mt-2">
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
                <span className="text-text-secondary">Amount</span>
                <span className="text-text-primary font-medium">
                  ₹{parseFloat(amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">To</span>
                <span className="text-text-primary font-medium">{selectedPayee?.name}</span>
              </div>
            </div>

            <Button
              ref={(el) => {
                confirmBtnRef.current = el
                trackerRef.current.attachConfirmHover(el)
              }}
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Checking…' : 'Confirm'}
            </Button>
          </Card>
        )}
      </div>

      {showLocationConsent && (
        <LocationConsent onAllow={handleAllowLocation} onDismiss={handleDismissLocation} />
      )}

      {calibrationProgress && !showPatternReady && (
        <CalibrationBanner current={calibrationProgress.current} total={calibrationProgress.total} />
      )}

      {showPatternReady && (
        <PatternReady
          onContinue={() => {
            setShowPatternReady(false)
            navigate('/')
          }}
        />
      )}

      {showStagedAnalysis && (
        <StagedAnalysis
          transactionId={transactionId}
          onVerdict={handleVerdict}
          onError={() => setShowStagedAnalysis(false)}
        />
      )}

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
        message="Looks good — transfer completed."
        onDone={() => navigate('/activity')}
      />
    </Layout>
  )
}
