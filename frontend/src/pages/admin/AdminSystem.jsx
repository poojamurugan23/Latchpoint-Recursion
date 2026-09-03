import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../api/client";
import { Server, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";

export default function AdminSystem() {
  const [systemData, setSystemData] = useState({ pipeline: [], components: {} });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadSystem() {
    setLoading(true);
    try {
      const res = await api.get("/admin/system");
      setSystemData(res);
      if (res.pipeline && res.pipeline.length > 0) {
        setSelectedNode(res.pipeline[0]);
      }
    } catch {
      // best effort
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSystem();
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white tracking-tight">
              SYSTEM ARCHITECTURE & REAL-TIME PIPELINE
            </h1>
            <p className="text-secondary text-[#8E96A8] text-xs mt-0.5">
              Visual pipeline architecture of telemetry capture, multi-stage risk fusion, and the pre-commitment gate
            </p>
          </div>
          <button
            onClick={loadSystem}
            className="flex items-center gap-1.5 text-xs text-[#8E96A8] hover:text-white px-3 py-1.5 rounded bg-[#1A1E2B] border border-[#262C3E]"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Interactive Architecture Flowchart */}
        <div className="bg-[#141722] border border-[#222738] rounded-md p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222738]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              End-to-End Execution Pipeline
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">P95 LATENCY: 42.8 MS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {(systemData.pipeline || []).map((node, idx) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3.5 rounded border cursor-pointer transition-colors flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#1E253A] border-[#8E9BFF] ring-1 ring-[#8E9BFF]"
                      : "bg-[#161924] border-[#222738] hover:bg-[#1C202E]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#6E7891]">STAGE {idx + 1}</span>
                      <span className="text-emerald-400 font-semibold">{node.latency}</span>
                    </div>
                    <div className="font-semibold text-white text-xs mt-1.5">{node.name}</div>
                    <p className="text-[10px] text-[#8E96A8] mt-1 line-clamp-2">{node.role}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#222738] flex items-center justify-between text-[10px]">
                    <span className="text-[#6E7891]">Status:</span>
                    <span className="text-emerald-400 font-mono font-semibold">{node.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Stage Detail & Real Component Latencies */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selected Stage Inspector (2 cols) */}
          <div className="lg:col-span-2 bg-[#141722] border border-[#222738] rounded-md p-5 space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-[#222738]">
              Pipeline Stage Inspector
            </h3>

            {selectedNode ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-[#6E7891] font-semibold">Stage Name</span>
                  <h4 className="text-base font-bold text-white mt-0.5">{selectedNode.name}</h4>
                </div>

                <div className="p-3 bg-[#1A1E2B] rounded border border-[#262C3E]">
                  <span className="text-[#6E7891] text-[10px] uppercase font-semibold">Architectural Function</span>
                  <p className="text-white mt-1 leading-relaxed">{selectedNode.role}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] bg-[#11131D] p-3 rounded border border-[#1E2332]">
                  <div>
                    <span className="text-[#6E7891] block">EXECUTION STATUS</span>
                    <span className="text-emerald-400 font-mono font-semibold mt-0.5 block">{selectedNode.status}</span>
                  </div>
                  <div>
                    <span className="text-[#6E7891] block">STAGE OVERHEAD</span>
                    <span className="text-white font-mono font-semibold mt-0.5 block">{selectedNode.latency}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Component Micro-Latencies */}
          <div className="bg-[#141722] border border-[#222738] rounded-md p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider pb-2 border-b border-[#222738]">
              Live Engine Health
            </h3>

            <div className="space-y-2 text-xs">
              {Object.entries(systemData.components || {}).map(([name, stat]) => (
                <div key={name} className="p-2 bg-[#171B26] border border-[#242A3D] rounded flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium text-[11px]">{name}</div>
                    <div className="text-[10px] text-[#6E7891] font-mono">{stat.latency_ms} ms avg</div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                    {stat.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
