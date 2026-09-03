import { useState } from "react";
import { ShieldCheck, Lock, EyeOff, CheckCircle2, X } from "lucide-react";

export default function PrivacyModal({ isOpen, onClose }) {
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-border rounded-lg shadow-md max-w-lg w-full p-6 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent-tint flex items-center justify-center text-accent">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-body text-ink-900">
                Privacy & Data Governance
              </h3>
              <p className="text-caption text-ink-400">
                Institutional pre-commitment telemetry controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-900 p-1 rounded-sm hover:bg-bg-subtle"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div className="p-3.5 bg-bg-subtle rounded-md border border-border text-secondary">
            <div className="flex items-start gap-2.5">
              <Lock size={16} className="text-allow shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-ink-900 text-caption uppercase tracking-wider">
                  Zero-Secret Guarantee
                </p>
                <p className="text-ink-600 text-caption mt-1">
                  Latchpoint strictly analyzes{" "}
                  <strong>anonymized interaction aggregates</strong> (mouse
                  velocities, pause intervals, and transition ordering). We{" "}
                  <strong>never</strong> capture, store, or inspect:
                </p>
                <ul className="mt-2 space-y-1 text-caption text-ink-600 list-disc list-inside">
                  <li>Passwords, PINs, or credentials</li>
                  <li>One-Time Passwords (OTPs)</li>
                  <li>Clipboard contents or keystroke characters</li>
                  <li>Sensitive message or financial text field contents</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3 rounded-md border border-border">
              <div>
                <div className="text-secondary font-medium text-ink-900">
                  Behavioral Biometrics Telemetry
                </div>
                <div className="text-caption text-ink-400">
                  Aggregated movement velocity & dwell hesitation metrics
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTelemetryEnabled(!telemetryEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-out focus:outline-none ${
                  telemetryEnabled ? "bg-accent" : "bg-ink-400"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-150 ease-out ${
                    telemetryEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md border border-border">
              <div>
                <div className="text-secondary font-medium text-ink-900">
                  Location Verification
                </div>
                <div className="text-caption text-ink-400">
                  Anonymized geographic distance checks for account takeover
                  detection
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLocationEnabled(!locationEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-out focus:outline-none ${
                  locationEnabled ? "bg-accent" : "bg-ink-400"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-150 ease-out ${
                    locationEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-button rounded-sm bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
