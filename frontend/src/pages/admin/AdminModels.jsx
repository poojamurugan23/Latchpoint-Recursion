import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../api/client";
import { Cpu, CheckCircle2, RefreshCw } from "lucide-react";

export default function AdminModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadModels() {
    setLoading(true);
    try {
      const res = await api.get("/admin/models");
      setModels(res);
    } catch {
      // best effort
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadModels();
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white tracking-tight">
              MODEL INTELLIGENCE & FEATURE ATTRIBUTION
            </h1>
            <p className="text-secondary text-[#8E96A8] text-xs mt-0.5">
              Production model registry, inference latencies, and local SHAP
              feature attributions
            </p>
          </div>
          <button
            onClick={loadModels}
            className="flex items-center gap-1.5 text-xs text-[#8E96A8] hover:text-white px-3 py-1.5 rounded bg-[#1A1E2B] border border-[#262C3E]"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {models.map((m) => (
            <div
              key={m.id}
              className="bg-[#141722] border border-[#222738] rounded-md p-5 space-y-4 hover:border-[#2F3752] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-[#8E9BFF]" />
                    <h3 className="font-semibold text-white text-sm">
                      {m.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#8E96A8] mt-0.5">{m.type}</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                  {m.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] bg-[#11131C] p-2.5 rounded border border-[#1E2332] font-mono">
                <div>
                  <span className="text-[#6E7891] block text-[10px]">
                    VERSION
                  </span>
                  <span className="text-white">{m.version}</span>
                </div>
                <div>
                  <span className="text-[#6E7891] block text-[10px]">
                    INPUTS
                  </span>
                  <span className="text-white">
                    {m.input_features} features
                  </span>
                </div>
                <div>
                  <span className="text-[#6E7891] block text-[10px]">
                    LATENCY
                  </span>
                  <span className="text-emerald-400">
                    {m.last_inference_ms} ms
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-[#6E7891] uppercase tracking-wider block mb-1.5">
                  Top Feature Attributions:
                </span>
                <div className="space-y-1.5 text-xs">
                  {(m.feature_importance || []).map((f) => (
                    <div
                      key={f.feature}
                      className="flex items-center justify-between"
                    >
                      <span className="text-[#8E96A8] text-[11px] font-mono">
                        {f.feature}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-[#1C202E] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#8E9BFF]"
                            style={{ width: `${Math.round(f.weight * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-white w-8 text-right">
                          {Math.round(f.weight * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1E2332] text-[11px] text-[#6E7891] flex items-center justify-between">
                <span>Evaluation Status:</span>
                <span className="text-white font-medium">
                  {m.evaluation_status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
