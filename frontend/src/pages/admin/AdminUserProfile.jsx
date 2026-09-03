import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../api/client";
import {
  Users,
  TrendingUp,
  Activity,
  Laptop,
  Share2,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function AdminUserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/admin/users/${id}`);
        setProfile(res);
      } catch {
        // best effort
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-xs text-[#8E96A8]">Loading user risk profile...</div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-xs text-rose-400">User not found.</div>
      </AdminLayout>
    );
  }

  const { user, baseline, activity_chart, signals, fused_risk } = profile;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with back nav */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222738]">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/users"
              className="p-1.5 rounded bg-[#1A1E2B] text-[#8E96A8] hover:text-white border border-[#262C3E] transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-semibold text-white tracking-tight">
                  USER {user.display_id}: {user.name}
                </h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#23265C] text-[#8E9BFF] border border-[#393E80]">
                  Risk Profile
                </span>
              </div>
              <p className="text-[11px] text-[#8E96A8] font-mono mt-0.5">{user.email} • Calibration: {user.calibration_status}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8E96A8]">Overall Risk:</span>
            <span
              className={`font-mono text-sm font-semibold px-2.5 py-1 rounded ${
                fused_risk.pre_commitment_risk_score >= 70
                  ? "text-rose-400 bg-rose-950/60 border border-rose-800/60"
                  : fused_risk.pre_commitment_risk_score >= 50
                  ? "text-amber-400 bg-amber-950/60 border border-amber-800/60"
                  : "text-emerald-400 bg-emerald-950/60 border border-emerald-800/60"
              }`}
            >
              {fused_risk.pre_commitment_risk_score} {fused_risk.risk_level}
            </span>
          </div>
        </div>

        {/* Top Metric Cards: Personal Baseline vs Current Commitment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#141722] border border-[#222738] rounded-md p-4">
            <span className="text-[10px] font-semibold text-[#6E7891] uppercase tracking-wider">
              Personal Baseline Window
            </span>
            <div className="text-xl font-semibold font-mono text-white mt-1">
              {baseline.typical_range}
            </div>
            <p className="text-[11px] text-[#8E96A8] mt-1">
              Rolling mean: ₹{baseline.mean_amount.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#141722] border border-[#222738] rounded-md p-4">
            <span className="text-[10px] font-semibold text-[#6E7891] uppercase tracking-wider">
              Current Financial Commitment
            </span>
            <div className="text-xl font-semibold font-mono text-white mt-1">
              ₹{baseline.current_amount.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#8E96A8] mt-1">
              Active pre-commitment evaluation
            </p>
          </div>

          <div className="bg-[#141722] border border-[#222738] rounded-md p-4">
            <span className="text-[10px] font-semibold text-[#6E7891] uppercase tracking-wider">
              Statistical Deviation
            </span>
            <div
              className={`text-xl font-semibold font-mono mt-1 ${
                baseline.deviation_level === "HIGH" ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {baseline.deviation_sigma} ({baseline.deviation_level})
            </div>
            <p className="text-[11px] text-[#8E96A8] mt-1">
              Z-score against personal transaction distribution
            </p>
          </div>
        </div>

        {/* Middle Section: Transaction History & Risk Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Historical Activity Chart (2 cols) */}
          <div className="lg:col-span-2 bg-[#141722] border border-[#222738] rounded-md p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222738]">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-[#8E9BFF]" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Historical Transaction Timeline
                </h3>
              </div>
              <span className="text-[10px] text-[#6E7891] font-mono">Completed Transactions</span>
            </div>

            <div className="h-56 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activity_chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222738" />
                  <XAxis dataKey="date" stroke="#6E7891" fontSize={10} />
                  <YAxis stroke="#6E7891" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#141722", borderColor: "#2B334C", fontSize: "11px" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#8E9BFF" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6-Factor Current Risk Signals */}
          <div className="bg-[#141722] border border-[#222738] rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#222738]">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Risk Signal Vectors
              </h3>
              <span className="text-[10px] text-amber-400 font-mono">Active Gate</span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { label: "Behavioral Biometrics", score: signals.behavior, weight: "20%" },
                { label: "Sequence Journey", score: signals.sequence, weight: "20%" },
                { label: "Transaction Amount", score: signals.transaction, weight: "20%" },
                { label: "Historical Outcome", score: signals.historical, weight: "15%" },
                { label: "Contextual Timing", score: signals.context, weight: "15%" },
                { label: "Network Relationships", score: signals.network, weight: "10%" },
              ].map(({ label, score, weight }) => (
                <div key={label} className="p-2 bg-[#171B26] border border-[#242A3D] rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E96A8] text-[11px]">{label} ({weight})</span>
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

            <div className="pt-2 border-t border-[#222738] flex items-center justify-between text-[11px]">
              <span className="text-[#6E7891]">Pre-Commitment Decision:</span>
              <span className="font-semibold text-white uppercase tracking-wider font-mono">
                {fused_risk.decision}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
