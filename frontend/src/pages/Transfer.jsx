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
import BehavioralTracker from '../telemetry/BehavioralTracker'
import { useEventTracker } from '../context/EventTrackerContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function Transfer() {
  const navigate = useNavigate()
  const { trackEvent } = useEventTracker()
  const { refreshUser } = useAuth()

  const [step, setStep] = useState('form') // form | review
  const [payees, setPayees] = useState([])
  const [amount, setAmount] = useState('')
  const [payeeId, setPayeeId] = useState('')
  const [newPayeeName, setNewPayeeName] = useState('')
  const [addingPayee, setAddingPayee] = useState(false)

  const [transactionId, setTransactionId] = useState(null)
  const [evaluation, setEvaluation] = useState(null) // { decision, reasons, risk_score }
  const [analyzing, setAnalyzing] = useState(false)
  const [calibratingInfo, setCalibratingInfo] = useState(null)
  const [patternReady, setPatternReady] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [showStepUp, setShowStepUp] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showGeoConsent, setShowGeoConsent] = useState(() => {
    return !sessionStorage.getItem('latchpoint_geo_prompted') && 'geolocation' in navigator
  })

  const trackerRef = useRef(null)
  const amountInputRef = useRef(null)
  const confirmBtnRef = useRef(null)

  useEffect(() => {
    trackEvent('page_view', { path: '/transfer' })
    api.get('/payees').then(setPayees)

    const tracker = new BehavioralTracker(trackEvent)
    tracker.mount()
    trackerRef.current = tracker

    return () => {
      tracker.unmount()
    }
  }, [trackEvent])

  useEffect(() => {
    if (step === 'form' && amountInputRef.current) {
      trackerRef.current?.attachKeystrokeTiming(amountInputRef.current, 'amount')
    }
    if (step === 'review' && confirmBtnRef.current) {
      trackerRef.current?.attachConfirmHover(confirmBtnRef.current)
    }
  }, [step])

  function handleAllowGeo() {
    sessionStorage.setItem('latchpoint_geo_prompted', 'true')
    setShowGeoConsent(false)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        trackEvent('geolocation_captured', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'gps',
        })
      },
      () => {
        // Fallback silently if position could not be determined
      },
      { timeout: 8000 }
    )
  }

  function handleDismissGeo() {
    sessionStorage.setItem('latchpoint_geo_prompted', 'true')
    setShowGeoConsent(false)
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
    trackerRef.current?.flush('review')
    setStep('review')
    trackEvent('review_reached')
  }

  function handleBackToEdit() {
    trackerRef.current?.flush('edit')
    trackEvent('back_navigation', { from_path: 'review', to_path: 'form' })
    setStep('form')
  }

  async function handleConfirm() {
    setSubmitting(true)
    trackerRef.current?.flush('confirm')
    try {
      const prep = await api.post('/transactions/prepare', {
        type: 'transfer',
        amount: parseFloat(amount),
        payee_id: parseInt(payeeId, 10),
      })
      setTransactionId(prep.transaction_id)
      setAnalyzing(true)
    } catch (err) {
      setSubmitting(false)
    }
  }

  async function handleVerdict(result) {
    setAnalyzing(false)
    setSubmitting(false)

    // 1. User is still calibrating: show calibration banner & auto-confirm
    if (result.calibrating) {
      setCalibratingInfo(result.calibration_progress || { current: 1, total: 10 })
      const confirmRes = await api.post(`/transactions/${result.transaction_id}/confirm`)
      await refreshUser()

      if (confirmRes?.completed_calibration || result.will_complete_calibration) {
        setCalibratingInfo(null)
        setPatternReady(true)
      } else {
        setTimeout(() => {
          setCalibratingInfo(null)
          navigate('/activity')
        }, 1800)
      }
      return
    }

    // 2. Calibrated user: evaluated against personal baseline
    setEvaluation(result)
    trackEvent('gate_shown', { decision: result.decision }, result.transaction_id)

    if (result.decision === 'ALLOW') {
      await api.post(`/transactions/${result.transaction_id}/confirm`)
      await refreshUser()
      setShowToast(true)
    }
  }

  async function handleVerifySubmit(code) {
    const res = await api.post(`/transactions/${transactionId}/step-up/verify`, { otp_code: code })
    if (res.status === 'completed') {
      await refreshUser()
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
        <h1 className="font-display text-title font-semibold text-ink-900 mb-8">
          Transfer money
        </h1>

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
                <label className="text-secondary font-medium text-ink-600">Payee</label>
                <select
                  value={payeeId}
                  onFocus={() => trackEvent('field_focus', { field_name: 'payee' })}
                  onChange={handlePayeeSelect}
                  className="w-full rounded-[10px] border border-border bg-white px-3 py-3 text-body text-ink-900 outline-none transition-all duration-[120ms] ease-out focus:border-accent focus:shadow-[0_0_0_3px_rgba(35,38,92,0.08)]"
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
                  <Button type="button" variant="secondary" onClick={handleAddPayee}>
                    Add
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingPayee(true)}
                  className="text-secondary font-medium text-accent hover:text-accent-hover text-left transition-colors duration-[120ms] ease-out"
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
              className="flex items-center gap-1 text-secondary text-ink-600 hover:text-ink-900 mb-6 transition-colors duration-[120ms] ease-out"
            >
              <ChevronLeft size={16} /> Back to details
            </button>

            <div className="flex flex-col gap-4 mb-8">
              <div className="flex justify-between items-center text-secondary border-b border-border pb-3">
                <span className="text-ink-600">Amount</span>
                <span className="text-ink-900 font-semibold">
                  ₹{parseFloat(amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center text-secondary border-b border-border pb-3">
                <span className="text-ink-600">Recipient</span>
                <span className="text-ink-900 font-semibold">{selectedPayee?.name}</span>
              </div>
              <div className="flex justify-between items-center text-secondary">
                <span className="text-ink-600">Account</span>
                <span className="text-ink-600 font-mono text-caption">
                  {selectedPayee?.masked_account_number}
                </span>
              </div>
            </div>

            <Button
              ref={confirmBtnRef}
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Initiating…' : 'Confirm commitment'}
            </Button>
          </Card>
        )}
      </div>

      {/* §4.2 Staged Real-Time Risk Analysis Checklist (SSE stream) */}
      {analyzing && transactionId && (
        <StagedAnalysis
          transactionId={transactionId}
          onVerdict={handleVerdict}
          onError={() => setAnalyzing(false)}
        />
      )}

      {/* §1.2 Calibration Banner while user is building their first 10 transactions */}
      {calibratingInfo && (
        <CalibrationBanner
          current={calibratingInfo.current}
          total={calibratingInfo.total}
        />
      )}

      {/* §1.3 Dedicated "Pattern Ready" milestone on 10th transaction */}
      {patternReady && (
        <PatternReady onContinue={() => navigate('/dashboard')} />
      )}

      {/* §4 Pre-Commitment Gate for active / evaluated users */}
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

      {/* §2.1 Custom non-blocking geolocation permission prompt */}
      {showGeoConsent && (
        <LocationConsent
          onAllow={handleAllowGeo}
          onDismiss={handleDismissGeo}
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
