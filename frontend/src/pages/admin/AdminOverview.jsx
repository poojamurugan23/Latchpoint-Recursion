import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../api/client";
import {
  ShieldAlert,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  X,
} from "lucide-react";

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get("/admin/overview");
      setData(res);
    } catch {
      // best effort
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const kpis = data?.kpis || {};
  const feed = data?.live_feed || [];
  const health = data?.system_health || {};
  const dist = data?.risk_distribution || {
    ALLOW: 70,
    MONITOR: 15,
    "STEP-UP": 10,
    HOLD: 4,
    BLOCK: 1,
  };

  function getDecisionBadge(decision) {
    switch (decision) {
      case "ALLOW":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 size={12} /> ALLOW
          </span>
        );
      case "MONITOR":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/60">
            <Activity size={12} /> MONITOR
          </span>
        );
      case "STEP-UP":
      case "VERIFY":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
            <AlertTriangle size={12} /> STEP-UP
          </span>
        );
      case "HOLD":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-orange-950/60 text-orange-400 border border-orange-800/60">
            <Clock size={12} /> HOLD
          </span>
        );
      case "BLOCK":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/60">
            <XCircle size={12} /> BLOCK
          </span>
        );
      default:
        return <span className="text-[11px] text-[#8E96A8]">{decision}</span>;
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white tracking-tight">
              LATCHPOINT COMMAND CENTER
            </h1>
            <p className="text-secondary text-[#8E96A8] text-xs mt-0.5">
              Real-time visibility into pre-commitment financial risk at the
              last reversible moment
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-xs text-[#8E96A8] hover:text-white px-3 py-1.5 rounded bg-[#1A1E2B] border border-[#262C3E] transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Top 6 KPI Cards (§4) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              label: "Active Sessions",
              key: "active_sessions",
              icon: Activity,
              color: "text-blue-400",
            },
            {
              label: "Pending Commitments",
              key: "pending_commitments",
              icon: Clock,
              color: "text-amber-400",
            },
            {
              label: "Elevated-Risk",
              key: "elevated_risk",
              icon: AlertTriangle,
              color: "text-orange-400",
            },
            {
              label: "Interventions Today",
              key: "interventions_today",
              icon: ShieldAlert,
              color: "text-purple-400",
            },
            {
              label: "Prevented Exposure",
              key: "prevented_exposure",
              icon: ShieldCheck,
              color: "text-emerald-400",
            },
            {
              label: "Decision Latency",
              key: "decision_latency",
              icon: TrendingUp,
              color: "text-cyan-400",
            },
          ].map(({ label, key, icon: Icon, color }) => {
            const item = kpis[key] || {
              value: "—",
              trend: "0",
              period: "today",
              tooltip: label,
            };
            return (
              <div
                key={key}
                title={item.tooltip}
                className="bg-[#141722] border border-[#222738] rounded-md p-3.5 flex flex-col justify-between hover:border-[#31374E] transition-colors"
              >
                <div className="flex items-center justify-between text-caption text-[#8E96A8]">
                  <span className="truncate">{label}</span>
                  <Icon size={14} className={color} />
                </div>
                <div className="mt-2">
                  <div className="text-xl font-semibold text-white font-mono">
                    {item.value}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#6E7891] mt-1">
                    <span className="text-emerald-400 font-medium">
                      {item.trend}
                    </span>
                    <span>• {item.period}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Workspace: Live Risk Feed (Left) & System Health + Distribution (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Risk Feed (2 Cols) */}
          <div className="lg:col-span-2 bg-[#141722] border border-[#222738] rounded-md flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-[#222738] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Live Risk Feed
                </h2>
              </div>
              <span className="text-[11px] text-[#8E96A8]">
                Click row for complete context
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#222738] bg-[#11131C] text-[#6E7891] uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Risk</th>
                    <th className="py-2.5 px-3">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D2130]">
                  {feed.map((ev) => (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="hover:bg-[#1C202E] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono text-[#8E96A8] text-[11px]">
                        {ev.time}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-white">
                          {ev.user_name}
                        </div>
                        <div className="text-[10px] text-[#6E7891] font-mono">
                          {ev.user_id}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[#B0B8C8] truncate max-w-[200px]">
                        {ev.action}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-white">
                        ₹{ev.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                            ev.risk_score >= 70
                              ? "text-rose-400 bg-rose-950/50"
                              : ev.risk_score >= 50
                                ? "text-amber-400 bg-amber-950/50"
                                : "text-emerald-400 bg-emerald-950/50"
                          }`}
                        >
                          {ev.risk_score}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {getDecisionBadge(ev.decision)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: System Health & Risk Distribution */}
          <div className="space-y-6">
            {/* System Health Panel */}
            <div className="bg-[#141722] border border-[#222738] rounded-md p-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222738]">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  System Health
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono">
                  ALL ENGINES NOMINAL
                </span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                {[
                  { label: "API Gateway", status: health.api || "ONLINE" },
                  {
                    label: "Event Ingestion (10Hz)",
                    status: health.event_ingestion || "ONLINE",
                  },
                  {
                    label: "Pre-Commitment Gate",
                    status: health.risk_engine || "ONLINE",
                  },
                  {
                    label: "Isolation Forest ML",
                    status: health.ml_models || "ONLINE",
                  },
                  {
                    label: "Network Topology",
                    status: health.network_intelligence || "ONLINE",
                  },
                  {
                    label: "Relational Store",
                    status: health.database || "ONLINE",
                  },
                ].map(({ label, status }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-1 border-b border-[#1C202E]"
                  >
                    <span className="text-[#8E96A8]">{label}</span>
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                      {status}
                    </span>
                  </div>
                ))}
                <div className="pt-2 flex items-center justify-between text-[11px] text-[#6E7891]">
                  <span>Last Evaluation:</span>
                  <span className="font-mono text-white">
                    {health.last_event || "10:24:31"}
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Distribution Visualizer */}
            <div className="bg-[#141722] border border-[#222738] rounded-md p-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222738]">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Risk Distribution
                </h3>
                <span className="text-[10px] text-[#6E7891] uppercase">
                  Calculated Population
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  {
                    label: "ALLOW (0–30)",
                    pct: dist.ALLOW || 70,
                    color: "bg-emerald-500",
                    text: "text-emerald-400",
                  },
                  {
                    label: "MONITOR (31–50)",
                    pct: dist.MONITOR || 15,
                    color: "bg-blue-500",
                    text: "text-blue-400",
                  },
                  {
                    label: "STEP-UP (51–70)",
                    pct: dist["STEP-UP"] || 10,
                    color: "bg-amber-500",
                    text: "text-amber-400",
                  },
                  {
                    label: "HOLD (71–85)",
                    pct: dist.HOLD || 4,
                    color: "bg-orange-500",
                    text: "text-orange-400",
                  },
                  {
                    label: "BLOCK (86–100)",
                    pct: dist.BLOCK || 1,
                    color: "bg-rose-500",
                    text: "text-rose-400",
                  },
                ].map(({ label, pct, color, text }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8E96A8]">{label}</span>
                      <span className={`font-mono font-semibold ${text}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1C202E] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color}`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Event Context Drawer / Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#141722] border border-[#2B334C] rounded-lg max-w-xl w-full p-5 text-white animate-in fade-in duration-150 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#222738]">
                <div>
                  <h3 className="font-semibold text-sm">
                    Commitment Evaluation Context
                  </h3>
                  <span className="text-[11px] text-[#8E96A8] font-mono">
                    TXN #{selectedEvent.id} • {selectedEvent.user_id}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-[#8E96A8] hover:text-white p-1 rounded hover:bg-[#202538]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#1A1E2B] rounded border border-[#262C3E]">
                  <div>
                    <span className="text-[#6E7891] text-[10px] uppercase">
                      User
                    </span>
                    <div className="font-semibold mt-0.5">
                      {selectedEvent.user_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#6E7891] text-[10px] uppercase">
                      Action
                    </span>
                    <div className="font-semibold mt-0.5">
                      {selectedEvent.action}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#6E7891] text-[10px] uppercase">
                      Amount
                    </span>
                    <div className="font-mono font-semibold mt-0.5 text-base text-white">
                      ₹{selectedEvent.amount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#6E7891] text-[10px] uppercase">
                      Verdict
                    </span>
                    <div className="mt-1">
                      {getDecisionBadge(selectedEvent.decision)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#6E7891] font-semibold mb-1.5">
                    Pre-Commitment Explanation Reasons:
                  </div>
                  <ul className="space-y-1 bg-[#10121A] p-3 rounded border border-[#1E2332]">
                    {(selectedEvent.reasons || []).map((r, i) => (
                      <li
                        key={i}
                        className="text-[#B0B8C8] flex items-start gap-1.5"
                      >
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-[#222738] flex items-center justify-between">
                <Link
                  to={`/admin/commitments/${selectedEvent.id}`}
                  className="text-xs text-[#8E9BFF] hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Open in Pre-Commitment Hero View</span>
                  <ArrowUpRight size={13} />
                </Link>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-3 py-1.5 bg-[#23265C] hover:bg-[#2E3378] text-white text-xs font-semibold rounded"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
