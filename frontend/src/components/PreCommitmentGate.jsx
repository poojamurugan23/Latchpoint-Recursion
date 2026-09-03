import { useState } from "react";
import {
  ChevronDown,
  ShieldQuestion,
  Clock,
  ShieldX,
  AlertTriangle,
} from "lucide-react";
import Button from "./Button";
import { useEventTracker } from "../context/EventTrackerContext";

const CONFIG = {
  "STEP-UP": {
    icon: ShieldQuestion,
    color: "text-verify",
    bg: "bg-verify-bg",
    dot: "bg-verify",
    primaryLabel: "Verify with OTP & Continue",
  },
  VERIFY: {
    icon: ShieldQuestion,
    color: "text-verify",
    bg: "bg-verify-bg",
    dot: "bg-verify",
    primaryLabel: "Verify & Continue",
  },
  HOLD: {
    icon: Clock,
    color: "text-hold",
    bg: "bg-hold-bg",
    dot: "bg-hold",
    primaryLabel: "Submit for Compliance Review",
  },
  BLOCK: {
    icon: ShieldX,
    color: "text-block",
    bg: "bg-block-bg",
    dot: "bg-block",
    primaryLabel: null,
  },
  MONITOR: {
    icon: AlertTriangle,
    color: "text-verify",
    bg: "bg-verify-bg",
    dot: "bg-verify",
    primaryLabel: "Confirm & Continue",
  },
};

export default function PreCommitmentGate({
  decision,
  reasons = [],
  onVerify,
  onHold,
  onCancel,
}) {
  const [expanded, setExpanded] = useState(false);
  const { trackEvent } = useEventTracker();
  const cfg = CONFIG[decision] || CONFIG["STEP-UP"];
  const Icon = cfg.icon;

  function toggleExpanded() {
    if (!expanded) trackEvent("gate_reason_expanded");
    setExpanded((e) => !e);
  }

  function handlePrimary() {
    trackEvent("confirm_clicked");
    if (decision === "HOLD") onHold?.();
    else onVerify?.();
  }

  function handleCancel() {
    trackEvent("cancel_clicked");
    onCancel?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-[20px] shadow-xl p-7 border border-border transition-all duration-200 ease-out">
        <div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${cfg.bg} mb-4`}
        >
          <Icon size={24} className={cfg.color} />
        </div>

        <h2 className="font-display text-verdict text-ink-900 mb-1">
          Before you continue
        </h2>
        <p className="text-secondary text-ink-600 mb-4">
          This payment differs significantly from your usual financial activity.
        </p>

        {/* Reassuring institutional notice (§22) */}
        <div className="p-3 bg-bg-subtle rounded-md border border-border mb-4 text-caption text-ink-600">
          <strong className="text-ink-900 font-medium">
            Your payment has NOT been sent.
          </strong>{" "}
          Your balance remains safe and untouched while you verify.
        </div>

        <div className="mb-4">
          <span className="text-caption font-medium uppercase tracking-wider text-ink-400 block mb-2">
            Detected Signals:
          </span>
          <ul className="flex flex-col gap-2">
            {reasons.slice(0, 3).map((reason, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-secondary text-ink-900 text-xs"
              >
                <span
                  className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`}
                />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {reasons.length > 3 && (
          <button
            onClick={toggleExpanded}
            className="flex items-center gap-1 text-caption text-ink-400 hover:text-ink-900 mb-4 cursor-pointer"
          >
            <span>
              {expanded ? "Less detail" : `${reasons.length - 3} more signals`}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}

        {expanded && reasons.length > 3 && (
          <ul className="flex flex-col gap-2 mb-4 pl-4 border-l-2 border-border text-caption text-ink-600">
            {reasons.slice(3).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          {cfg.primaryLabel && (
            <Button variant="primary" onClick={handlePrimary}>
              {cfg.primaryLabel}
            </Button>
          )}
          <Button variant="ghost" onClick={handleCancel}>
            Cancel Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
