import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../api/client";
import {
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  HelpCircle,
  Activity,
  ArrowRight,
} from "lucide-react";

export default function AdminCommitmentDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/admin/commitments/${id}`);
      setData(res);
    } catch {
      // best effort
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleAction(actionName) {
    setActionStatus("Executing...");
    try {
      await api.post(`/admin/commitments/${id}/action`, { action: actionName });
      setActionStatus(`Action ${actionName} successfully executed.`);
      load();
    } catch {
      setActionStatus("Failed to apply action.");
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-xs text-[#8E96A8]">
          Loading pre-commitment gate context...
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-xs text-rose-400">
          Commitment not found.
        </div>
      </AdminLayout>
    );
  }

  const {
    commitment,
    risk_signals,
    pre_commitment_risk,
    risk_level,
    recommendation,
    reasons,
    timeline,
  } = data;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222738]">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/commitments"
              className="p-1.5 rounded bg-[#1A1E2B] text-[#8E96A8] hover:text-white border border-[#262C3E] transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-semibold text-white tracking-tight">
                  PRE-COMMITMENT GATE INSPECTION
                </h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
                  Status: {commitment.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-[#8E96A8] font-mono mt-0.5">
                Commitment #{commitment.id} • Balance Unexecuted
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8E96A8]">Pre-Commitment Risk:</span>
            <span
              className={`font-mono text-sm font-semibold px-2.5 py-1 rounded ${
                pre_commitment_risk >= 70
                  ? "text-rose-400 bg-rose-950/60 border border-rose-800/60"
                  : pre_commitment_risk >= 50
                    ? "text-amber-400 bg-amber-950/60 border border-amber-800/60"
                    : "text-emerald-400 bg-emerald-950/60 border border-emerald-800/60"
              }`}
            >
              {pre_commitment_risk}/100 ({risk_level})
            </span>
          </div>
        </div>

        {/* Commitment Summary Banner */}
        <div className="bg-[#141722] border border-[#222738] rounded-md p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-[#6E7891] font-semibold">
              Pending Commitment
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              ₹{commitment.amount.toLocaleString()}
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-[#6E7891] text-[10px] uppercase">
                From (Originator)
              </span>
              <div className="font-semibold text-white mt-0.5">
                {commitment.user_name}
              </div>
              <div className="text-[10px] text-[#8E96A8] font-mono">
                {commitment.user_id}
              </div>
            </div>

            <ArrowRight size={16} className="text-[#6E7891]" />

            <div>
              <span className="text-[#6E7891] text-[10px] uppercase">
                To (Recipient)
              </span>
              <div className="font-semibold text-white mt-0.5">
                {commitment.recipient_name}
              </div>
              <div className="text-[10px] text-[#8E96A8] font-mono">
                {commitment.recipient_id}
              </div>
            </div>

            <div className="pl-4 border-l border-[#222738]">
              <span className="text-[#6E7891] text-[10px] uppercase">
                Gate Recommendation
              </span>
              <div className="font-semibold text-amber-400 mt-0.5">
                {recommendation}
              </div>
            </div>
          </div>
        </div>

        {/* Action Status Toast */}
        {actionStatus && (
          <div className="p-3 bg-[#1C2030] border border-[#2E364F] rounded text-xs text-white flex items-center justify-between">
            <span>{actionStatus}</span>
            <button
              onClick={() => setActionStatus("")}
              className="text-[#8E96A8] hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Two-Column Detail View: Why Flagged (Left) & Risk Signals + Actions (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Why Flagged & Session Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Why This Action Is Flagged */}
            <div className="bg-[#141722] border border-[#222738] rounded-md p-4 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
                Why This Action Is Being Flagged
              </h2>
              <ul className="space-y-2 text-xs">
                {reasons.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[#B0B8C8] bg-[#1A1E2B] p-2.5 rounded border border-[#262C3E]"
                  >
                    <span className="text-amber-400 mt-0.5 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Intercepted Session Timeline */}
            <div className="bg-[#141722] border border-[#222738] rounded-md p-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222738]">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Session Sequence Leading to Interception
                </h3>
                <span className="text-[10px] font-mono text-[#6E7891]">
                  {timeline.length} events
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {timeline.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <span className="font-mono text-[#8E96A8] text-[11px] shrink-0 w-14">
                      {item.time}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-[#8E9BFF] mt-1.5 shrink-0" />
                    <div className="flex-1 bg-[#171A26] border border-[#222738] p-2 rounded">
                      <div className="font-semibold text-white">
                        {item.action}
                      </div>
                      {Object.keys(item.details || {}).length > 0 && (
                        <div className="text-[10px] text-[#8E96A8] font-mono mt-0.5">
                          {JSON.stringify(item.details)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Risk Signals & Analyst Actions */}
          <div className="space-y-6">
            {/* 6 Risk Signals Panel */}
            <div className="bg-[#141722] border border-[#222738] rounded-md p-4 space-y-3">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-[#222738]">
                Fused Risk Signal Breakdown
              </h3>

              <div className="space-y-2 text-xs">
                {[
                  {
                    label: "Behavioral Biometrics",
                    score: risk_signals.behavior,
                  },
                  { label: "Sequence Journey", score: risk_signals.sequence },
                  {
                    label: "Transaction Amount",
                    score: risk_signals.transaction,
                  },
                  {
                    label: "Historical Outcome",
                    score: risk_signals.historical || 20,
                  },
                  { label: "Contextual Timing", score: risk_signals.context },
                  {
                    label: "Network Relationships",
                    score: risk_signals.network,
                  },
                ].map(({ label, score }) => (
                  <div
                    key={label}
                    className="p-2 bg-[#171B26] border border-[#242A3D] rounded"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E96A8] text-[11px]">
                        {label}
                      </span>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          score >= 70
                            ? "text-rose-400"
                            : score >= 50
                              ? "text-amber-400"
                              : "text-emerald-400"
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
            </div>

            {/* Analyst Intervention Controls */}
            <div className="bg-[#141722] border border-[#222738] rounded-md p-4 space-y-3">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-[#222738]">
                Pre-Commitment Analyst Action
              </h3>
              <p className="text-[11px] text-[#8E96A8] leading-tight">
                Intervene before funds are debited from the sender's account:
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleAction("VERIFY")}
                  className="py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded transition-colors"
                >
                  Step-Up Verify
                </button>
                <button
                  onClick={() => handleAction("HOLD")}
                  className="py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded transition-colors"
                >
                  Hold for Review
                </button>
                <button
                  onClick={() => handleAction("RELEASE")}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded transition-colors"
                >
                  Release / Allow
                </button>
                <button
                  onClick={() => handleAction("BLOCK")}
                  className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded transition-colors"
                >
                  Block Action
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
