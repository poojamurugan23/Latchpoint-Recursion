import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../api/client";
import {
  Activity,
  Clock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  MapPin,
  Laptop,
  RefreshCw,
} from "lucide-react";

export default function AdminLiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadSessions() {
    setLoading(true);
    try {
      const res = await api.get("/admin/live-sessions");
      setSessions(res);
      if (res.length > 0 && !expandedId) {
        setExpandedId(res[0].session_id);
      }
    } catch {
      // best effort
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 6000);
    return () => clearInterval(interval);
  }, []);

  function toggleExpand(id) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white tracking-tight">
              LIVE SESSION MONITORING
            </h1>
            <p className="text-secondary text-[#8E96A8] text-xs mt-0.5">
              Real-time telemetry streams, active browser contexts, and
              micro-behavioral timelines
            </p>
          </div>
          <button
            onClick={loadSessions}
            className="flex items-center gap-1.5 text-xs text-[#8E96A8] hover:text-white px-3 py-1.5 rounded bg-[#1A1E2B] border border-[#262C3E] transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="bg-[#141722] border border-[#222738] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-[#222738] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-white tracking-wider">
              <Activity size={14} className="text-emerald-400" />
              <span>Active Telemetry Sessions ({sessions.length})</span>
            </div>
            <span className="text-[11px] text-[#8E96A8]">
              Click row to inspect live event timeline
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#222738] bg-[#11131C] text-[#6E7891] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Session</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Start Time</th>
                  <th className="py-2.5 px-3">Current Action</th>
                  <th className="py-2.5 px-3 text-center">Risk</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Device</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D2130]">
                {sessions.map((s) => {
                  const isExpanded = expandedId === s.session_id;
                  return (
                    <tr key={s.session_id} className="contents">
                      <tr
                        onClick={() => toggleExpand(s.session_id)}
                        className={`hover:bg-[#1C202E] cursor-pointer transition-colors ${
                          isExpanded ? "bg-[#181C28]" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-[#8E9BFF] font-semibold">
                          {s.session_id}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-white">
                            {s.user_name}
                          </div>
                          <div className="text-[10px] text-[#6E7891] font-mono">
                            {s.user_id}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#8E96A8]">
                          {s.start_time}
                        </td>
                        <td className="py-2.5 px-3 text-[#B0B8C8] font-medium">
                          {s.current_action}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                              s.risk_score >= 70
                                ? "text-rose-400 bg-rose-950/50"
                                : s.risk_score >= 50
                                  ? "text-amber-400 bg-amber-950/50"
                                  : "text-emerald-400 bg-emerald-950/50"
                            }`}
                          >
                            {s.risk_score} {s.risk_level}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#8E96A8] flex items-center gap-1">
                          <MapPin
                            size={11}
                            className="shrink-0 text-[#6E7891]"
                          />
                          <span>{s.location}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#8E96A8]">
                          {s.ip_address}
                        </td>
                        <td className="py-2.5 px-3 text-[#8E96A8]">
                          <div className="flex items-center gap-1">
                            <Laptop
                              size={11}
                              className="shrink-0 text-[#6E7891]"
                            />
                            <span>{s.device}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                              s.status === "PRE-COMMITMENT"
                                ? "bg-amber-950/60 text-amber-400 border border-amber-800/60 animate-pulse"
                                : "bg-[#1B2030] text-[#8E96A8] border border-[#2A3146]"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right text-[#6E7891]">
                          {isExpanded ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </td>
                      </tr>

                      {/* Expanded Session Timeline Drawer */}
                      {isExpanded && (
                        <tr className="bg-[#11131D] border-b border-[#222738]">
                          <td colSpan={10} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-[#1E2332]">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
                                  Current Session Event Sequence (
                                  {s.timeline.length} events logged)
                                </span>
                                <span className="text-[10px] font-mono text-[#6E7891]">
                                  Throttled 10Hz Client Telemetry Stream
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                {s.timeline.map((ev, idx) => (
                                  <div
                                    key={ev.id || idx}
                                    className="p-2.5 bg-[#171A26] border border-[#242A3D] rounded flex flex-col justify-between"
                                  >
                                    <div className="flex items-center justify-between text-[10px] font-mono">
                                      <span className="text-emerald-400">
                                        {ev.time}
                                      </span>
                                      <span className="text-[#6E7891]">
                                        STEP #{idx + 1}
                                      </span>
                                    </div>
                                    <div className="font-semibold text-white text-xs mt-1">
                                      {ev.type}
                                    </div>
                                    <div className="text-[10px] text-[#8E96A8] truncate mt-1">
                                      {Object.keys(ev.payload || {}).length > 0
                                        ? JSON.stringify(ev.payload)
                                        : "Standard linear progression"}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
