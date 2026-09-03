import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../api/client";
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Clock,
  CheckCircle2,
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

export default function AdminTimeline() {
  const [timeline, setTimeline] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/admin/timeline");
        setTimeline(res);
        if (res.length > 0) {
          setSelectedPoint(res[res.length - 1]);
        }
      } catch {
        // best effort
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white tracking-tight">
              DYNAMIC RISK ACCUMULATION TIMELINE
            </h1>
            <p className="text-secondary text-[#8E96A8] text-xs mt-0.5">
              Live trajectory plotting session risk escalation across sequential
              micro-actions
            </p>
          </div>
        </div>

        {/* Dynamic Chart Container */}
        <div className="bg-[#141722] border border-[#222738] rounded-md p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222738]">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-[#8E9BFF]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
                Risk Score Trajectory (0–100)
              </h2>
            </div>
            <span className="text-[10px] text-[#6E7891] font-mono">
              Click point to inspect signal deltas
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeline}
                onClick={(e) =>
                  e &&
                  e.activePayload &&
                  setSelectedPoint(e.activePayload[0].payload)
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#222738" />
                <XAxis dataKey="time" stroke="#6E7891" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#6E7891" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141722",
                    borderColor: "#2B334C",
                    fontSize: "11px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="risk_score"
                  stroke="#FF6B6B"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#FF6B6B" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Selected Event Details & Event Sequence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selected Event Inspector */}
          <div className="bg-[#141722] border border-[#222738] rounded-md p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-[#222738]">
              Inspected Step Details
            </h3>

            {selectedPoint ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6E7891] font-mono">
                    {selectedPoint.time}
                  </span>
                  <span className="font-semibold text-white font-mono text-base">
                    {selectedPoint.event}
                  </span>
                </div>

                <div className="p-3 bg-[#1A1E2B] rounded border border-[#262C3E]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E96A8]">Cumulative Risk:</span>
                    <span className="font-mono text-sm font-semibold text-rose-400">
                      {selectedPoint.risk_score}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-[#6E7891]">Step Delta:</span>
                    <span className="font-mono text-amber-400 font-semibold">
                      {selectedPoint.delta} points
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#6E7891]">
                    Triggered Reasons:
                  </span>
                  <ul className="mt-1 space-y-1">
                    {(selectedPoint.reasons || []).map((r, i) => (
                      <li
                        key={i}
                        className="text-[#B0B8C8] flex items-start gap-1.5 text-[11px]"
                      >
                        <span className="text-amber-400">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#8E96A8]">
                Click any event on the chart to inspect signals.
              </div>
            )}
          </div>

          {/* Sequential Event Cards (2 cols) */}
          <div className="lg:col-span-2 bg-[#141722] border border-[#222738] rounded-md p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-[#222738]">
              Chronological Journey Steps
            </h3>

            <div className="space-y-2">
              {timeline.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPoint(step)}
                  className={`p-2.5 rounded border cursor-pointer transition-colors flex items-center justify-between text-xs ${
                    selectedPoint?.time === step.time
                      ? "bg-[#1F2538] border-[#8E9BFF]"
                      : "bg-[#161924] border-[#222738] hover:bg-[#1C202E]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[#6E7891] text-[11px] w-14">
                      {step.time}
                    </span>
                    <div className="font-semibold text-white">{step.event}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-amber-400 font-medium">
                      {step.delta}
                    </span>
                    <span
                      className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                        step.risk_score >= 70
                          ? "bg-rose-950/60 text-rose-400"
                          : step.risk_score >= 50
                            ? "bg-amber-950/60 text-amber-400"
                            : "bg-emerald-950/60 text-emerald-400"
                      }`}
                    >
                      {step.risk_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
