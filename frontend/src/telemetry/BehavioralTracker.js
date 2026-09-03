/**
 * Client-side behavioral telemetry (Phase 3 §2). Attaches passive listeners
 * for the lifetime of a Transfer flow and computes AGGREGATE features
 * in the browser — raw mouse coordinates and keystroke content never leave
 * the client, only summary statistics (distance, velocity, direction
 * changes, intervals).
 */

const MOUSE_SAMPLE_MS = 100 // ~10Hz

function throttle(fn, ms) {
  let last = 0
  return (...args) => {
    const now = performance.now()
    if (now - last >= ms) {
      last = now
      fn(...args)
    }
  }
}

export default class BehavioralTracker {
  constructor(trackEvent) {
    this.trackEvent = trackEvent
    this.mounted = false

    this._resetMouse()
    this._resetTouch()
    this.lastActionAt = performance.now()
    this._confirmHoverStart = null
    this._confirmCleanup = null
    this._keystrokeCleanups = []

    this._onMouseMove = throttle(this._onMouseMove.bind(this), MOUSE_SAMPLE_MS)
    this._onClick = this._onClick.bind(this)
    this._onTouchStart = this._onTouchStart.bind(this)
    this._onTouchEnd = this._onTouchEnd.bind(this)
  }

  _resetMouse() {
    this.lastPos = null
    this.lastMoveAt = null
    this.lastDirection = null
    this.totalDistance = 0
    this.velocities = []
    this.directionChanges = 0
  }

  _resetTouch() {
    this.touch = { taps: 0, durations: [], swipes: 0 }
    this._touchStartAt = null
    this._touchStartPos = null
  }

  mount() {
    if (this.mounted) return
    this.mounted = true
    window.addEventListener('mousemove', this._onMouseMove, { passive: true })
    window.addEventListener('click', this._onClick, { passive: true })
    if ('ontouchstart' in window) {
      window.addEventListener('touchstart', this._onTouchStart, { passive: true })
      window.addEventListener('touchend', this._onTouchEnd, { passive: true })
    }
  }

  unmount(step = 'unmount') {
    if (!this.mounted) return
    this.mounted = false
    window.removeEventListener('mousemove', this._onMouseMove)
    window.removeEventListener('click', this._onClick)
    window.removeEventListener('touchstart', this._onTouchStart)
    window.removeEventListener('touchend', this._onTouchEnd)
    this.flush(step)
    this._confirmCleanup?.()
    this._keystrokeCleanups.forEach((cleanup) => cleanup())
    this._keystrokeCleanups = []
  }

  flush(step) {
    this._flushMouse(step)
    this._flushTouch(step)
  }

  _onMouseMove(e) {
    const now = performance.now()
    const pos = { x: e.clientX, y: e.clientY }
    if (this.lastPos) {
      const dx = pos.x - this.lastPos.x
      const dy = pos.y - this.lastPos.y
      const dist = Math.hypot(dx, dy)
      this.totalDistance += dist
      const dtSec = (now - this.lastMoveAt) / 1000
      if (dtSec > 0) this.velocities.push(dist / dtSec)
      if (dist > 2) {
        const direction = Math.atan2(dy, dx)
        if (this.lastDirection != null && Math.abs(direction - this.lastDirection) > Math.PI / 4) {
          this.directionChanges += 1
        }
        this.lastDirection = direction
      }
    }
    this.lastPos = pos
    this.lastMoveAt = now
    this.lastActionAt = now
  }

  _onClick(e) {
    const target = e.target
    const isInteractive = !!target.closest?.('button, a, input, select, textarea, [role="button"]')
    this.trackEvent('click', {
      x: e.clientX,
      y: e.clientY,
      target_id: target.id || target.tagName || 'unknown',
      is_misclick: !isInteractive,
    })
    this.lastActionAt = performance.now()
  }

  _onTouchStart(e) {
    this._touchStartAt = performance.now()
    const t = e.touches[0]
    this._touchStartPos = t ? { x: t.clientX, y: t.clientY } : null
    this.touch.taps += 1
  }

  _onTouchEnd(e) {
    if (this._touchStartAt == null) return
    this.touch.durations.push(performance.now() - this._touchStartAt)
    const t = e.changedTouches[0]
    if (t && this._touchStartPos) {
      const dist = Math.hypot(t.clientX - this._touchStartPos.x, t.clientY - this._touchStartPos.y)
      if (dist > 30) this.touch.swipes += 1
    }
    this._touchStartAt = null
  }

  _flushMouse(step) {
    if (this.totalDistance === 0 && this.velocities.length === 0) return
    const avgVelocity = this.velocities.length
      ? this.velocities.reduce((a, b) => a + b, 0) / this.velocities.length
      : 0
    this.trackEvent('mouse_summary', {
      total_distance_px: Math.round(this.totalDistance),
      avg_velocity_px_per_s: Math.round(avgVelocity),
      direction_change_count: this.directionChanges,
      idle_ms_before_action: Math.round(performance.now() - this.lastActionAt),
      step,
    })
    this._resetMouse()
  }

  _flushTouch(step) {
    if (this.touch.taps === 0) return
    const avgDuration = this.touch.durations.length
      ? this.touch.durations.reduce((a, b) => a + b, 0) / this.touch.durations.length
      : 0
    this.trackEvent('touch_summary', {
      tap_count: this.touch.taps,
      avg_touch_duration_ms: Math.round(avgDuration),
      swipe_count: this.touch.swipes,
      step,
    })
    this._resetTouch()
  }

  /** Measures real hover-before-click hesitation on the Confirm button. */
  attachConfirmHover(el) {
    this._confirmCleanup?.()
    if (!el) {
      this._confirmCleanup = null
      return
    }
    const onEnter = () => {
      this._confirmHoverStart = performance.now()
    }
    const onLeave = () => {
      this._confirmHoverStart = null
    }
    const onClick = () => {
      if (this._confirmHoverStart != null) {
        this.trackEvent('confirm_hover', {
          hover_ms_before_click: Math.round(performance.now() - this._confirmHoverStart),
        })
      }
    }
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    el.addEventListener('click', onClick)
    this._confirmCleanup = () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
      el.removeEventListener('click', onClick)
    }
  }

  /** Inter-keystroke interval timing only — never logs typed content. */
  attachKeystrokeTiming(el, fieldName) {
    if (!el) return
    const state = { lastAt: null, intervals: [] }
    const onKeydown = () => {
      const now = performance.now()
      if (state.lastAt != null) state.intervals.push(now - state.lastAt)
      state.lastAt = now
    }
    const onBlur = () => {
      if (state.intervals.length >= 2) {
        const mean = state.intervals.reduce((a, b) => a + b, 0) / state.intervals.length
        const variance =
          state.intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / state.intervals.length
        this.trackEvent('keystroke_timing', {
          field: fieldName,
          mean_interval_ms: Math.round(mean),
          std_interval_ms: Math.round(Math.sqrt(variance)),
        })
      }
      state.lastAt = null
      state.intervals = []
    }
    el.addEventListener('keydown', onKeydown)
    el.addEventListener('blur', onBlur)
    const cleanup = () => {
      el.removeEventListener('keydown', onKeydown)
      el.removeEventListener('blur', onBlur)
    }
    this._keystrokeCleanups.push(cleanup)
  }
}
