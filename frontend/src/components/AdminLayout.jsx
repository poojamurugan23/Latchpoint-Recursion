import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  Activity,
  Users,
  Clock,
  TrendingUp,
  Share2,
  Bell,
  FileSearch,
  PlayCircle,
  Cpu,
  Server,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import PrivacyModal from "./PrivacyModal";
import { api } from "../api/client";

const ADMIN_NAV = [
  { to: "/admin", label: "Command Center", icon: ShieldAlert, end: true },
  { to: "/admin/live", label: "Live Sessions", icon: Activity },
  { to: "/admin/users", label: "Users & Baselines", icon: Users },
  { to: "/admin/commitments", label: "Commitments", icon: Clock },
  { to: "/admin/timeline", label: "Risk Timeline", icon: TrendingUp },
  { to: "/admin/network", label: "Network Intelligence", icon: Share2 },
  { to: "/admin/alerts", label: "Alert Center", icon: Bell },
  { to: "/admin/investigations", label: "Investigations", icon: FileSearch },
  { to: "/admin/replay", label: "Session Replay", icon: PlayCircle },
  { to: "/admin/models", label: "Model Intelligence", icon: Cpu },
  { to: "/admin/system", label: "System Health", icon: Server },
];

export default function AdminLayout({
  children,
  activeScenario,
  onScenarioChange,
}) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("signature");
  const [loadingScenario, setLoadingScenario] = useState(false);
  const navigate = useNavigate();

  async function handleLoadScenario(e) {
    const scen = e.target.value;
    setSelectedScenario(scen);
    setLoadingScenario(true);
    try {
      await api.post("/admin/demo/scenario", { scenario: scen });
      if (onScenarioChange) onScenarioChange(scen);
      if (scen === "signature") {
        navigate("/admin/replay");
      }
    } catch {
      // best effort
    } finally {
      setLoadingScenario(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-[#E1E4EA] flex flex-col font-sans">
      {/* Top Operations Header */}
      <header className="h-14 border-b border-[#222738] bg-[#141722] px-5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="flex items-center gap-2.5">
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              Latchpoint
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-[#23265C] text-[#8E9BFF] border border-[#393E80]">
              Risk Console
            </span>
          </Link>
          <div className="h-4 w-px bg-[#262C3E]" />
          <div className="flex items-center gap-2 text-caption text-[#8E96A8]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs">
              TELEMETRY STREAM: CONNECTED
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Demo Scenario Selector (§56) */}
          <div className="flex items-center gap-1.5 bg-[#1B2030] border border-[#2B334C] rounded-md px-2.5 py-1">
            <Zap size={14} className="text-amber-400 shrink-0" />
            <span className="text-xs font-medium text-amber-300 mr-1 uppercase tracking-wider text-[10px]">
              Demo Mode:
            </span>
            <select
              value={selectedScenario}
              onChange={handleLoadScenario}
              disabled={loadingScenario}
              className="bg-transparent text-xs text-white border-0 focus:outline-none cursor-pointer pr-1"
            >
              <option value="signature" className="bg-[#141722] text-white">
                Signature Showcase (Multi-Signal ₹25k)
              </option>
              <option value="normal" className="bg-[#141722] text-white">
                Normal Baseline (Routine ₹2.1k)
              </option>
              <option value="unusual" className="bg-[#141722] text-white">
                Unusual Time/Amount (Monitor ₹8.5k)
              </option>
              <option value="escalating" className="bg-[#141722] text-white">
                Escalating Velocity (Hold ₹2.7k 4th)
              </option>
              <option value="network" className="bg-[#141722] text-white">
                Network Risk / Shared Device (Verify ₹3.5k)
              </option>
              <option value="context" className="bg-[#141722] text-white">
                Context Risk / Repeat Loss (Block ₹12k)
              </option>
            </select>
          </div>

          <button
            onClick={() => setPrivacyOpen(true)}
            className="flex items-center gap-1.5 text-xs text-[#9DA6B8] hover:text-white px-2.5 py-1.5 rounded bg-[#1B2030] hover:bg-[#23293D] border border-[#2B334C] transition-colors"
            title="Privacy & Data Governance"
          >
            <ShieldCheck size={14} />
            <span>Privacy</span>
          </button>

          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded bg-[#23265C] hover:bg-[#2E3378] border border-[#3E4595] transition-colors"
          >
            <span>Customer App</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </header>

      {/* Main Console Workspace */}
      <div className="flex flex-1 min-h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-[#222738] bg-[#12151E] p-3 flex flex-col justify-between">
          <div>
            <div className="px-2.5 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-[#5B657E]">
              Operational Console
            </div>
            <nav className="mt-1 space-y-0.5">
              {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-2 rounded text-xs transition-colors ${
                      isActive
                        ? "bg-[#1E2438] text-white font-medium border-l-2 border-[#8E9BFF]"
                        : "text-[#8E96A8] hover:text-white hover:bg-[#181C2A]"
                    }`
                  }
                >
                  <Icon size={15} className="shrink-0 text-[#8E96A8]" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="p-2.5 border-t border-[#222738] text-[11px] text-[#5B657E]">
            <div className="flex items-center justify-between text-[10px]">
              <span>Latchpoint Engine</span>
              <span className="text-emerald-400">v2.4.0-ml</span>
            </div>
            <p className="mt-1 text-[10px] leading-tight text-[#6E7891]">
              Aggregated kinematic features only. Zero raw secrets.
            </p>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 p-6 overflow-x-auto min-w-0 max-w-full">
          {children}
        </main>
      </div>

      <PrivacyModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />
    </div>
  );
}
