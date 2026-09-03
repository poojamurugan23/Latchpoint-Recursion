import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../api/client";
import { Bell, ArrowUpRight, Search, RefreshCw } from "lucide-react";

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  async function loadAlerts() {
    setLoading(true);
    try {
      const res = await api.get("/admin/alerts");
      setAlerts(res);
    } catch {
      // best effort
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  async function updateStatus(alertId, newStatus) {
    try {
      await api.patch(`/admin/alerts/${alertId}`, { status: newStatus });
      setAlerts((prev) =>
        prev.map((a) => (a.alert_id === alertId ? { ...a, status: newStatus } : a))
      );
    } catch {
      // best effort
    }
  }

  const filtered = alerts.filter((a) => {
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    if (riskFilter === "HIGH" && a.risk_score < 70) return false;
    if (riskFilter === "MODERATE" && (a.risk_score < 50 || a.risk_score >= 70)) return false;
    if (searchQuery && !a.user_name.toLowerCase().includes(searchQuery.toLowerCase()) && !a.alert_id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white tracking-tight">
              ALERT CENTER
            </h1>
            <p className="text-secondary text-[#8E96A8] text-xs mt-0.5">
              Triage and investigate elevated risk events intercepted at pre-commitment boundaries
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-48">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6E7891]" />
              <input
                type="text"
                placeholder="Search user or alert..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141722] border border-[#222738] rounded pl-8 pr-2.5 py-1 text-xs text-white placeholder-[#6E7891] focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#141722] border border-[#222738] text-xs text-white px-2 py-1 rounded focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="HELD">HELD</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-[#141722] border border-[#222738] text-xs text-white px-2 py-1 rounded focus:outline-none"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="HIGH">High / Critical (≥70)</option>
              <option value="MODERATE">Moderate (50–69)</option>
            </select>

            <button
              onClick={loadAlerts}
              className="p-1.5 rounded bg-[#1A1E2B] text-[#8E96A8] hover:text-white border border-[#262C3E]"
              title="Refresh Alerts"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="bg-[#141722] border border-[#222738] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-[#222738] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-white tracking-wider">
              <Bell size={14} className="text-rose-400" />
              <span>Active Risk Alerts ({filtered.length})</span>
            </div>
            <span className="text-[11px] text-[#8E96A8]">Change status inline or inspect commitment details</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#222738] bg-[#11131C] text-[#6E7891] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Alert ID</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Originator</th>
                  <th className="py-2.5 px-3">Trigger Reason</th>
                  <th className="py-2.5 px-3 text-center">Score</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D2130]">
                {filtered.map((a) => (
                  <tr key={a.alert_id} className="hover:bg-[#1C202E] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#8E9BFF] font-semibold">{a.alert_id}</td>
                    <td className="py-2.5 px-3 font-mono text-[#8E96A8] text-[11px]">{a.time}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-white">{a.user_name}</div>
                      <div className="text-[10px] text-[#6E7891] font-mono">{a.user_id}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[#B0B8C8] max-w-xs truncate">{a.trigger}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                          a.risk_score >= 70
                            ? "text-rose-400 bg-rose-950/50"
                            : "text-amber-400 bg-amber-950/50"
                        }`}
                      >
                        {a.risk_score}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={a.status}
                        onChange={(e) => updateStatus(a.alert_id, e.target.value)}
                        className="bg-[#181C2A] border border-[#2B334C] text-[10px] font-semibold uppercase text-white rounded px-2 py-1 focus:outline-none cursor-pointer"
                      >
                        <option value="NEW">NEW</option>
                        <option value="INVESTIGATING">INVESTIGATING</option>
                        <option value="VERIFIED">VERIFIED</option>
                        <option value="HELD">HELD</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/admin/commitments/${a.commitment_id}`}
                        className="inline-flex items-center gap-1 text-[#8E9BFF] hover:underline font-medium"
                      >
                        <span>Inspect</span>
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
