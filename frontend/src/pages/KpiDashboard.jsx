import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import { SkeletonCard } from "../components/Skeleton";
import { api } from "../api/client";

const RISK_COLORS = {
  ALLOW: "#227A4E",
  VERIFY: "#A8720F",
  HOLD: "#B0591F",
  BLOCK: "#A93434",
};

function StatCard({ label, value, supporting }) {
  return (
    <Card>
      <p className="text-caption font-medium text-ink-600 mb-1">{label}</p>
      <p className="font-sans text-[26px] leading-[32px] font-semibold text-ink-900 mb-1">
        {value}
      </p>
      {supporting && <p className="text-caption text-ink-400">{supporting}</p>}
    </Card>
  );
}

export default function KpiDashboard() {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/kpi/summary")
      .then(setKpi)
      .finally(() => setLoading(false));
  }, []);

  const chartData = kpi
    ? Object.entries(kpi.decisions_by_type).map(([decision, count]) => ({
        decision,
        count,
      }))
    : [];

  const totalDecisions = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-title font-semibold text-ink-900">
          Insights
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              label="Avg. detection lead time"
              value={`${kpi.detection_lead_time_avg_sec.toFixed(1)}s`}
              supporting="Pre-commitment window"
            />
            <StatCard
              label="False challenge rate"
              value={`${Math.round(kpi.false_challenge_rate * 100)}%`}
              supporting="Challenges marked false positive"
            />
            <StatCard
              label="Intervention accuracy"
              value={`${Math.round(kpi.intervention_accuracy * 100)}%`}
              supporting="Confirmed risk resolution"
            />
            <StatCard
              label="Prevented exposure"
              value={`₹${kpi.total_prevented_exposure.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
              supporting="Blocked / held exposure"
            />
          </>
        )}
      </div>

      <section>
        <h2 className="font-sans text-secondary font-semibold text-ink-900 uppercase text-eyebrow mb-4">
          Decisions by type
        </h2>
        {loading ? (
          <Card className="h-64 flex items-center justify-center">
            <div className="skeleton w-full h-48" />
          </Card>
        ) : totalDecisions === 0 ? (
          <Card>
            <EmptyState
              icon={BarChart3}
              message="No decisions recorded yet. Run transactions to evaluate risk and view system metrics."
            />
          </Card>
        ) : (
          <Card>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} barSize={40}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#EBEBEE"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="decision"
                    stroke="#63636D"
                    fontSize={12}
                    fontFamily="Montserrat, sans-serif"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#63636D"
                    fontSize={12}
                    fontFamily="Montserrat, sans-serif"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "1px solid #EBEBEE",
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: "Montserrat, sans-serif",
                      boxShadow: "0 1px 2px rgba(20,20,27,0.04)",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.decision}
                        fill={RISK_COLORS[entry.decision] || "#23265C"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </section>
    </Layout>
  );
}
