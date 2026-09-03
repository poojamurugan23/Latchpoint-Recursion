import { useEffect, useState, useMemo } from "react";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../api/client";
import { Search, ZoomIn, ZoomOut, RefreshCw, X } from "lucide-react";

export default function AdminNetwork() {
  const [graph, setGraph] = useState({ nodes: [], edges: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [onlyRisky, setOnlyRisky] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);

  async function loadGraph() {
    setLoading(true);
    try {
      const res = await api.get("/admin/network");
      setGraph(res);
    } catch {
      // best effort
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGraph();
  }, []);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    return (graph.nodes || []).filter((n) => {
      if (filterType !== "all" && n.type !== filterType) return false;
      if (onlyRisky && n.risk < 50) return false;
      if (searchQuery && !n.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [graph.nodes, filterType, onlyRisky, searchQuery]);

  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return (graph.edges || []).filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [graph.edges, visibleNodeIds]);

  // Compute 2D node coordinates in a circular cluster layout
  const positionedNodes = useMemo(() => {
    const width = 850;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;
    const total = filteredNodes.length;

    return filteredNodes.map((n, idx) => {
      let r = 200;
      if (n.type === "user") r = 80;
      else if (n.type === "account") r = 150;
      else if (n.type === "payee") r = 210;
      else if (n.type === "device") r = 250;
      else if (n.type === "transaction") r = 180;

      const angle = (idx / Math.max(1, total)) * 2 * Math.PI;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      return { ...n, x, y };
    });
  }, [filteredNodes]);

  const nodePosMap = useMemo(() => {
    const map = new Map();
    positionedNodes.forEach((n) => map.set(n.id, { x: n.x, y: n.y }));
    return map;
  }, [positionedNodes]);

  function getNodeColor(type, risk) {
    if (risk >= 70) return "#F87171"; // rose-400
    if (risk >= 50) return "#FBBF24"; // amber-400
    if (type === "user") return "#8E9BFF";
    if (type === "account") return "#34D399";
    if (type === "payee") return "#60A5FA";
    if (type === "device") return "#A78BFA";
    return "#CBD5E1";
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white tracking-tight">
              NETWORK TOPOLOGY & ENTITY INTELLIGENCE
            </h1>
            <p className="text-secondary text-[#8E96A8] text-xs mt-0.5">
              Interactive relational graph detecting shared devices, proxy proxies, and counterparty clusters
            </p>
          </div>

          {/* Controls toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative w-48">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6E7891]" />
              <input
                type="text"
                placeholder="Find entity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141722] border border-[#222738] rounded pl-8 pr-2.5 py-1 text-xs text-white placeholder-[#6E7891] focus:outline-none"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#141722] border border-[#222738] text-xs text-white px-2 py-1 rounded focus:outline-none"
            >
              <option value="all">All Entities</option>
              <option value="user">Users</option>
              <option value="account">Accounts</option>
              <option value="payee">Beneficiaries</option>
              <option value="device">Devices</option>
              <option value="transaction">Transactions</option>
            </select>

            <button
              onClick={() => setOnlyRisky(!onlyRisky)}
              className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                onlyRisky
                  ? "bg-rose-950/60 text-rose-400 border-rose-800/60"
                  : "bg-[#141722] text-[#8E96A8] border-[#222738]"
              }`}
            >
              Risky Only
            </button>

            <div className="flex items-center gap-1 bg-[#141722] border border-[#222738] rounded px-1 py-0.5">
              <button
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
                className="p-1 text-[#8E96A8] hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] font-mono text-[#6E7891] px-1">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
                className="p-1 text-[#8E96A8] hover:text-white"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            <button
              onClick={loadGraph}
              className="p-1.5 rounded bg-[#1A1E2B] text-[#8E96A8] hover:text-white border border-[#262C3E]"
              title="Refresh Graph"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Graph Workspace & Side Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* SVG Graph Canvas (3 cols) */}
          <div className="lg:col-span-3 bg-[#11131C] border border-[#222738] rounded-md overflow-hidden relative min-h-[550px] flex items-center justify-center">
            {/* Legend Overlay */}
            <div className="absolute top-3 left-3 bg-[#141722]/80 backdrop-blur-sm border border-[#222738] rounded p-2 text-[10px] space-y-1 z-10 text-[#8E96A8]">
              <div className="font-semibold text-white uppercase text-[9px] mb-1">Entity Legend</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#8E9BFF]" /> User</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#34D399]" /> Account</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#60A5FA]" /> Payee</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#A78BFA]" /> Device</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F87171]" /> High Risk (≥70)</div>
            </div>

            <svg
              width="850"
              height="550"
              className="transition-transform duration-150"
              style={{ transform: `scale(${zoom})` }}
            >
              {/* Render Edges */}
              {filteredEdges.map((e) => {
                const s = nodePosMap.get(e.source);
                const t = nodePosMap.get(e.target);
                if (!s || !t) return null;
                return (
                  <line
                    key={e.id}
                    x1={s.x}
                    y1={s.y}
                    x2={t.x}
                    y2={t.y}
                    stroke="#262C3E"
                    strokeWidth="1.2"
                    strokeDasharray={e.relationship === "USES" ? "4 3" : undefined}
                  />
                );
              })}

              {/* Render Nodes */}
              {positionedNodes.map((n) => {
                const isSelected = selectedNode?.id === n.id;
                const fill = getNodeColor(n.type, n.risk);
                return (
                  <g
                    key={n.id}
                    onClick={() => setSelectedNode(n)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={isSelected ? 10 : 7}
                      fill={fill}
                      stroke={isSelected ? "#FFFFFF" : "#141722"}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="transition-all hover:scale-125"
                    />
                    <text
                      x={n.x}
                      y={n.y + 14}
                      fill="#8E96A8"
                      fontSize="9"
                      textAnchor="middle"
                      className="pointer-events-none font-mono"
                    >
                      {n.label.length > 15 ? `${n.label.slice(0, 13)}…` : n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Entity Inspector Side Panel (1 col) */}
          <div className="bg-[#141722] border border-[#222738] rounded-md p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#222738]">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Entity Inspector
              </h3>
              {selectedNode && (
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-[#8E96A8] hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-[#6E7891] font-semibold">{selectedNode.type} Entity</span>
                  <div className="font-semibold text-white text-sm mt-0.5">{selectedNode.label}</div>
                  <div className="font-mono text-[10px] text-[#8E9BFF]">{selectedNode.id}</div>
                </div>

                <div className="p-2.5 bg-[#171B26] border border-[#242A3D] rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E96A8] text-[11px]">Entity Risk Score:</span>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        selectedNode.risk >= 70 ? "text-rose-400" : selectedNode.risk >= 50 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {selectedNode.risk}/100
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-[#6E7891] font-semibold">Entity Attributes:</span>
                  <div className="mt-1 bg-[#10121A] p-2.5 rounded border border-[#1E2332] space-y-1 font-mono text-[11px]">
                    {Object.entries(selectedNode.details || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <span className="text-[#6E7891]">{k}:</span>
                        <span className="text-white truncate max-w-[120px]">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#222738] text-[11px] text-[#8E96A8]">
                  Click other nodes or adjust filters to explore relationships.
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#6E7891]">
                Select any node in the relationship graph to inspect details, device links, and counterparty risks.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
