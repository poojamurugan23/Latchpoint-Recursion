import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../api/client";
import { Clock, ArrowUpRight, Search, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

export default function AdminCommitments() {
  const [commitments, setCommitments] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadCommitments() {
    setLoading(true);
    try {
      const res = await api.get("/admin/commitments");
      setCommitments(res);
    } catch {
      // best effort
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommitments();
  }, []);

  const filtered = commitments.filter(
    (c) =>
      c.user_name.toLowerCase().includes(query.toLowerCase()) ||
      c.user_id.toLowerCase().includes(query.toLowerCase()) ||
      c.recipient.toLowerCase().includes(query.toLowerCase())
  );

  function getDecisionBadge(decision) {
    switch (decision) {
      case "ALLOW":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"><CheckCircle2 size={12} /> ALLOW</span>;
      case "MONITOR":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/60">MONITOR</span>;
      case "STEP-UP":
      case "VERIFY":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60"><AlertTriangle size={12} /> STEP-UP</span>;
      case "HOLD":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-orange-950/60 text-orange-400 border border-orange-800/60"><Clock size={12} /> HOLD</span>;
      case "BLOCK":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/60"><XCircle size={12} /> BLOCK</span>;
      default:
        return <span className="text-[11px] text-[#8E96A8]">{decision}</span>;
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white tracking-tight">
              PRE-COMMITMENT GATE QUEUE
            </h1>
            <p className="text-secondary text-[#8E96A8] text-xs mt-0.5">
              Financial commitments intercepted at the final confirmation gate prior to ledger execution
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E7891]" />
              <input
                type="text"
                placeholder="Search user or recipient..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#141722] border border-[#222738] rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#6E7891] focus:outline-none focus:border-[#8E9BFF]"
              />
            </div>
            <button
              onClick={loadCommitments}
              className="flex items-center gap-1.5 text-xs text-[#8E96A8] hover:text-white px-3 py-1.5 rounded bg-[#1A1E2B] border border-[#262C3E] transition-colors"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="bg-[#141722] border border-[#222738] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-[#222738] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-white tracking-wider">
              <Clock size={14} className="text-amber-400" />
              <span>Intercepted Commitments ({filtered.length})</span>
            </div>
            <span className="text-[11px] text-[#8E96A8]">Click commitment to inspect signals & intervene</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#222738] bg-[#11131C] text-[#6E7891] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Sender</th>
                  <th className="py-2.5 px-3">Recipient Payee</th>
                  <th className="py-2.5 px-3 text-right">Commitment Amount</th>
                  <th className="py-2.5 px-3 text-center">Risk Score</th>
                  <th className="py-2.5 px-3">Verdict / Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D2130]">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#1C202E] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#8E96A8] text-[11px]">{c.time}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-white">{c.user_name}</div>
                      <div className="text-[10px] text-[#6E7891] font-mono">{c.user_id}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#B0B8C8]">{c.recipient}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">
                      ₹{c.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                          c.risk_score >= 70
                            ? "text-rose-400 bg-rose-950/50"
                            : c.risk_score >= 50
                            ? "text-amber-400 bg-amber-950/50"
                            : "text-emerald-400 bg-emerald-950/50"
                        }`}
                      >
                        {c.risk_score}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{getDecisionBadge(c.decision)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/admin/commitments/${c.id}`}
                        className="inline-flex items-center gap-1 text-[#8E9BFF] hover:underline font-medium"
                      >
                        <span>Inspect Gate</span>
                        <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
