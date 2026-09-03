import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../api/client";
import { Users, ArrowUpRight, Search, ShieldCheck, RefreshCw } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res);
    } catch {
      // best effort
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase()) ||
    u.display_id.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white tracking-tight">
              USERS & BEHAVIORAL BASELINES
            </h1>
            <p className="text-secondary text-[#8E96A8] text-xs mt-0.5">
              Personal transaction baselines, rolling window calibrations, and user risk scores
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E7891]" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#141722] border border-[#222738] rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#6E7891] focus:outline-none focus:border-[#8E9BFF]"
              />
            </div>
            <button
              onClick={loadUsers}
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
              <Users size={14} className="text-blue-400" />
              <span>Registered Accounts ({filtered.length})</span>
            </div>
            <span className="text-[11px] text-[#8E96A8]">Click user row to inspect personal baseline & deviation</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#222738] bg-[#11131C] text-[#6E7891] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3">Name & Email</th>
                  <th className="py-2.5 px-3">Calibration Status</th>
                  <th className="py-2.5 px-3">Personal Baseline Range</th>
                  <th className="py-2.5 px-3 text-right">Transactions</th>
                  <th className="py-2.5 px-3 text-center">Current Risk</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D2130]">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-[#1C202E] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#8E9BFF] font-semibold">{u.display_id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-white">{u.name}</div>
                      <div className="text-[10px] text-[#6E7891] font-mono">{u.email}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          u.calibration_status === "active"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                            : "bg-blue-950/60 text-blue-400 border border-blue-800/60"
                        }`}
                      >
                        {u.calibration_status === "active" ? "Active (Calibrated)" : `Calibrating (${u.calibrated_count}/10)`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#B0B8C8]">{u.typical_amount_range}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-white">{u.total_transactions}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                          u.current_risk_score >= 70
                            ? "text-rose-400 bg-rose-950/50"
                            : u.current_risk_score >= 50
                            ? "text-amber-400 bg-amber-950/50"
                            : "text-emerald-400 bg-emerald-950/50"
                        }`}
                      >
                        {u.current_risk_score} {u.risk_level}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="inline-flex items-center gap-1 text-[#8E9BFF] hover:underline font-medium"
                      >
                        <span>Profile</span>
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
