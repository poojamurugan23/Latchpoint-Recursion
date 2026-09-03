import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../api/client";
import {
  FileSearch,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Send,
} from "lucide-react";

export default function AdminInvestigations() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [analystNote, setAnalystNote] = useState("");
  const [decisionFeedback, setDecisionFeedback] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadCases() {
    setLoading(true);
    try {
      const res = await api.get("/admin/investigations");
      setCases(res);
      if (res.length > 0) {
        setSelectedCase(res[0]);
      }
    } catch {
      // best effort
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  async function handleCaseAction(action) {
    if (!selectedCase) return;
    setDecisionFeedback(`Case updated: action '${action}' applied.`);
    try {
      await api.post(
        `/admin/commitments/${selectedCase.commitment_id}/action`,
        { action },
      );
      loadCases();
    } catch {
      // best effort
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white tracking-tight">
              ANALYST INVESTIGATION WORKSPACE
            </h1>
            <p className="text-secondary text-[#8E96A8] text-xs mt-0.5">
              Deep forensic review of high-consequence pre-commitment holds and
              evidence packages
            </p>
          </div>
        </div>

        {decisionFeedback && (
          <div className="p-3 bg-[#1B2538] border border-[#2B3958] rounded text-xs text-white flex items-center justify-between">
            <span>{decisionFeedback}</span>
            <button
              onClick={() => setDecisionFeedback("")}
              className="text-[#8E96A8] hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Case Queue (1 col) */}
          <div className="bg-[#141722] border border-[#222738] rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#222738]">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Held Cases Queue ({cases.length})
              </h3>
              <span className="text-[10px] text-amber-400 font-mono">
                PRIORITY 1
              </span>
            </div>

            <div className="space-y-2">
              {cases.map((c) => {
                const isSelected = selectedCase?.case_id === c.case_id;
                return (
                  <div
                    key={c.case_id}
                    onClick={() => {
                      setSelectedCase(c);
                      setAnalystNote("");
                    }}
                    className={`p-3 rounded border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#1E2436] border-[#8E9BFF]"
                        : "bg-[#171A26] border-[#222738] hover:bg-[#1C202E]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-[#8E9BFF]">
                        {c.case_id}
                      </span>
                      <span className="font-mono text-rose-400 font-semibold">
                        {c.risk_score}/100
                      </span>
                    </div>
                    <div className="font-medium text-white text-xs mt-1">
                      {c.user_name}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#8E96A8] mt-1">
                      <span>Amount: ₹{c.amount.toLocaleString()}</span>
                      <span className="font-mono uppercase text-amber-400 font-semibold">
                        {c.decision}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Case Dossier & Evidence (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCase ? (
              <>
                {/* Dossier Header */}
                <div className="bg-[#141722] border border-[#222738] rounded-md p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#6E7891] font-semibold">
                      Active Investigation
                    </span>
                    <h2 className="text-lg font-bold text-white font-mono mt-0.5">
                      {selectedCase.case_id}
                    </h2>
                    <p className="text-xs text-[#8E96A8]">
                      {selectedCase.user_name} ({selectedCase.user_id})
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-[#6E7891] text-[10px] uppercase">
                        Commitment Hold
                      </span>
                      <div className="text-base font-bold font-mono text-white mt-0.5">
                        ₹{selectedCase.amount.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <span className="text-[#6E7891] text-[10px] uppercase">
                        Risk Score
                      </span>
                      <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
                        {selectedCase.risk_score}/100
                      </div>
                    </div>

                    <Link
                      to={`/admin/commitments/${selectedCase.commitment_id}`}
                      className="px-3 py-1.5 rounded bg-[#1F2538] hover:bg-[#2B334E] text-[#8E9BFF] font-semibold text-xs border border-[#313B5C] flex items-center gap-1 transition-colors"
                    >
                      <span>Hero View</span>
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>

                {/* Evidence Artifacts */}
                <div className="bg-[#141722] border border-[#222738] rounded-md p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-[#222738]">
                    Synthesized Evidence Package
                  </h3>

                  <ul className="space-y-2 text-xs">
                    {selectedCase.evidence.map((ev, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 bg-[#1A1E2B] p-2.5 rounded border border-[#262C3E] text-[#B0B8C8]"
                      >
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Analyst Adjudication & Notes */}
                <div className="bg-[#141722] border border-[#222738] rounded-md p-4 space-y-4">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-[#222738]">
                    Analyst Adjudication
                  </h3>

                  <div>
                    <label className="text-[11px] text-[#8E96A8] block mb-1">
                      Analyst Case Notes & Rationalization
                    </label>
                    <textarea
                      rows={3}
                      value={analystNote}
                      onChange={(e) => setAnalystNote(e.target.value)}
                      placeholder="Add compliance notes or rationale for decision..."
                      className="w-full bg-[#11131D] border border-[#222738] rounded p-2.5 text-xs text-white placeholder-[#6E7891] focus:outline-none focus:border-[#8E9BFF]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCaseAction("RELEASE")}
                      className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                    >
                      Release & Allow
                    </button>
                    <button
                      onClick={() => handleCaseAction("HOLD")}
                      className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-colors"
                    >
                      Keep On Hold
                    </button>
                    <button
                      onClick={() => handleCaseAction("STEP-UP")}
                      className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors"
                    >
                      Prompt Step-Up
                    </button>
                    <button
                      onClick={() => handleCaseAction("BLOCK")}
                      className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
                    >
                      Confirm Fraud & Block
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-xs text-[#6E7891]">
                Select a case to inspect.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
