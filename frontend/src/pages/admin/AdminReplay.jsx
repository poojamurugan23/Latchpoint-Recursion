import { useEffect, useState, useRef } from "react";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../api/client";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export default function AdminReplay() {
  const [events, setEvents] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [verified, setVerified] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/admin/replay/S-DEMO-001");
        setEvents(res);
      } catch {
        // best effort
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2200);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, events.length]);

  const activeEvent = events[currentStep] || {
    time: "10:00:15",
    label: "Initialized",
    description: "Ready",
    risk_score: 12,
    decision: "ALLOW",
    contributions: { behavior: 10, sequence: 10, transaction: 10, historical: 10, context: 10, network: 10 },
    reasons: ["Session initialized"],
    gate_triggered: false,
  };

  const isGateTriggered = activeEvent.gate_triggered && !verified;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white tracking-tight">
              INTERACTIVE SESSION REPLAY ENGINE
            </h1>
            <p className="text-secondary text-[#8E96A8] text-xs mt-0.5">
              Live step-by-step playback re-evaluating risk signals across event sequence transitions
            </p>
          </div>

          {/* Player Controls (§27) */}
          <div className="flex items-center gap-2 bg-[#141722] border border-[#222738] p-1.5 rounded-md">
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(0);
                setVerified(false);
              }}
              className="p-1.5 rounded text-[#8E96A8] hover:text-white hover:bg-[#1E2334]"
              title="Reset Replay"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep((s) => Math.max(0, s - 1));
              }}
              disabled={currentStep === 0}
              className="p-1.5 rounded text-[#8E96A8] hover:text-white hover:bg-[#1E2334] disabled:opacity-40"
              title="Previous Event"
            >
              <SkipBack size={15} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded bg-[#23265C] hover:bg-[#2E3378] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? "Pause" : "Play Replay"}</span>
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep((s) => Math.min(events.length - 1, s + 1));
              }}
              disabled={currentStep === events.length - 1}
              className="p-1.5 rounded text-[#8E96A8] hover:text-white hover:bg-[#1E2334] disabled:opacity-40"
              title="Next Event"
            >
              <SkipForward size={15} />
            </button>
          </div>
        </div>

        {/* Live Replay Hero Status Banner */}
        <div className="bg-[#141722] border border-[#222738] rounded-md p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#6E7891]">
              <span>Event {currentStep + 1} of {events.length}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{activeEvent.time}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{activeEvent.label}</h2>
            <p className="text-xs text-[#8E96A8] mt-0.5">{activeEvent.description}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#6E7891] block">Pre-Commitment Score</span>
              <span
                className={`font-mono text-2xl font-bold ${
                  activeEvent.risk_score >= 70
                    ? "text-rose-400"
                    : activeEvent.risk_score >= 50
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {activeEvent.risk_score}/100
              </span>
            </div>

            <div className="pl-5 border-l border-[#222738] text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#6E7891] block">Engine Policy Verdict</span>
              <span
                className={`text-xs font-semibold uppercase px-2.5 py-1 rounded inline-block mt-0.5 ${
                  activeEvent.decision === "ALLOW"
                    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                    : activeEvent.decision === "MONITOR"
                    ? "bg-blue-950/60 text-blue-400 border border-blue-800/60"
                    : "bg-amber-950/60 text-amber-400 border border-amber-800/60"
                }`}
              >
                {activeEvent.decision}
              </span>
            </div>
          </div>
        </div>

        {/* Gate Interception Banner if triggered */}
        {isGateTriggered && (
          <div className="p-5 bg-[#2B1B15] border border-[#7C3A27] rounded-md animate-in fade-in duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <ShieldAlert size={24} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-300 text-sm">
                    LATCHPOINT PRE-COMMITMENT GATE INTERCEPTED
                  </h3>
                  <p className="text-xs text-[#E6C2B4] mt-1">
                    Multi-signal risk score hit <strong>78/100 (HIGH)</strong>. Financial commitment is suspended. Funds have <strong>NOT</strong> been debited from sender's ledger.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => setVerified(true)}
                      className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-ink-900 font-bold text-xs shadow-md transition-colors"
                    >
                      Simulate Step-Up OTP Verification
                    </button>
                  </div>
                </div>
              </div>

              <span className="font-mono text-xs font-bold text-amber-300 px-2.5 py-1 rounded bg-black/40 border border-amber-700/60">
                ACTION REQUIRED: STEP-UP
              </span>
            </div>
          </div>
        )}

        {verified && (
          <div className="p-4 bg-emerald-950/50 border border-emerald-800/60 rounded-md text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Step-Up Verification Successful. Financial commitment approved and executed to ledger.</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase">EXECUTION COMPLETE</span>
          </div>
        )}

        {/* Replay Details Grid: Timeline Progression & Live Signal Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Step Sequence Timeline (2 cols) */}
          <div className="lg:col-span-2 bg-[#141722] border border-[#222738] rounded-md p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-2 border-b border-[#222738]">
              Sequential Event Timeline
            </h3>

            <div className="space-y-2">
              {events.map((ev, idx) => {
                const isCurrent = currentStep === idx;
                const isPassed = currentStep > idx;
                return (
                  <div
                    key={ev.step}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStep(idx);
                    }}
                    className={`p-3 rounded border cursor-pointer transition-colors flex items-center justify-between text-xs ${
                      isCurrent
                        ? "bg-[#1E253A] border-[#8E9BFF] ring-1 ring-[#8E9BFF]"
                        : isPassed
                        ? "bg-[#141722] border-[#252C40] opacity-85"
                        : "bg-[#10121A] border-[#1C202E] opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[#6E7891] text-[11px] w-14">{ev.time}</span>
                      <div>
                        <div className="font-semibold text-white">{ev.label}</div>
                        <div className="text-[10px] text-[#8E96A8]">{ev.event_type}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                          ev.risk_score >= 70
                            ? "bg-rose-950/60 text-rose-400"
                            : ev.risk_score >= 50
                            ? "bg-amber-950/60 text-amber-400"
                            : "bg-emerald-950/60 text-emerald-400"
                        }`}
                      >
                        {ev.risk_score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Contributing Factors for Current Step */}
          <div className="bg-[#141722] border border-[#222738] rounded-md p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-2 border-b border-[#222738]">
              Active Signal Contributions
            </h3>

            <div className="space-y-2 text-xs">
              {Object.entries(activeEvent.contributions || {}).map(([dim, score]) => (
                <div key={dim} className="p-2 bg-[#171B26] border border-[#242A3D] rounded">
                  <div className="flex items-center justify-between capitalize">
                    <span className="text-[#8E96A8] text-[11px]">{dim}</span>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        score >= 70 ? "text-rose-400" : score >= 50 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {score}/100
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#222738] rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full ${score >= 70 ? "bg-rose-500" : score >= 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.max(5, score)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-[#6E7891]">Plain-English Reasons:</span>
              <ul className="mt-1 space-y-1">
                {(activeEvent.reasons || []).map((r, i) => (
                  <li key={i} className="text-[#B0B8C8] flex items-start gap-1.5 text-[11px]">
                    <span className="text-amber-400">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
