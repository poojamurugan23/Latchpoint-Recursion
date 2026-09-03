import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, LineChart, ListOrdered } from "lucide-react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import RiskBadge from "../components/RiskBadge";
import EmptyState from "../components/EmptyState";
import { SkeletonCard, SkeletonTable } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/transactions?limit=5")
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, []);

  // Backend timestamps are naive UTC; comparing raw date prefixes avoids local shift
  const todayUtc = new Date().toISOString().slice(0, 10);
  const exposureToday = transactions
    .filter(
      (t) =>
        t.status === "completed" && t.created_at?.slice(0, 10) === todayUtc,
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const baseline = 5000;
  const exposureRatio = Math.min(exposureToday / baseline, 1);
  const isElevated = exposureToday > baseline * 2;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-title font-semibold text-ink-900">
          Dashboard
        </h1>
        <div className="flex gap-3">
          <Link to="/transfer">
            <Button variant="primary">
              <ArrowLeftRight size={16} /> Transfer
            </Button>
          </Link>
          <Link to="/trade">
            <Button variant="secondary">
              <LineChart size={16} /> Trade
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {loading ? (
          <>
            <SkeletonCard />
            <div className="md:col-span-2">
              <SkeletonCard />
            </div>
          </>
        ) : (
          <>
            <Card className="md:col-span-1">
              <p className="text-secondary font-medium text-ink-600 mb-1">
                Available balance
              </p>
              <p className="font-sans text-[26px] leading-[32px] font-semibold text-ink-900">
                ₹
                {(user?.balance ?? 0).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-caption text-ink-400 mt-2">Checking account</p>
            </Card>

            <Card className="md:col-span-2">
              <div className="flex justify-between items-baseline mb-1">
                <p className="text-secondary font-medium text-ink-600">
                  Exposure today
                </p>
                <span className="text-caption font-medium text-ink-600">
                  {Math.round(exposureRatio * 100)}% of baseline
                </span>
              </div>
              <p className="font-sans text-[26px] leading-[32px] font-semibold text-ink-900 mb-3">
                ₹{exposureToday.toLocaleString("en-IN")}
              </p>
              <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ease-out ${
                    isElevated ? "bg-hold" : "bg-accent"
                  }`}
                  style={{ width: `${Math.max(exposureRatio * 100, 2)}%` }}
                />
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Recent activity */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans text-secondary font-semibold text-ink-900 uppercase text-eyebrow">
            Recent Activity
          </h2>
          <Link
            to="/activity"
            className="text-caption text-ink-600 hover:text-accent font-medium transition-colors duration-[120ms] ease-out"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <SkeletonTable rows={4} />
        ) : transactions.length === 0 ? (
          <Card>
            <EmptyState
              icon={ListOrdered}
              message="No transactions yet. Transfers and trades will appear here."
              action={{ label: "Make a Transfer", to: "/transfer" }}
            />
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <ul className="flex flex-col divide-y divide-border">
              {transactions.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/transactions/${t.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-bg-subtle transition-colors duration-[120ms] ease-out"
                  >
                    <div>
                      <p className="text-secondary font-medium text-ink-900 capitalize">
                        {t.type} {t.symbol ? `· ${t.symbol}` : ""}
                      </p>
                      <p className="text-caption text-ink-600 mt-0.5">
                        ₹{t.amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <RiskBadge decision={t.decision} />
                      <span className="text-caption text-ink-400">→</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </Layout>
  );
}
