import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Transfer from "./pages/Transfer";
import HoldReview from "./pages/HoldReview";
import RiskExplanation from "./pages/RiskExplanation";
import Activity from "./pages/Activity";
import Payees from "./pages/Payees";
import KpiDashboard from "./pages/KpiDashboard";

// Admin / Risk Operations Console Pages
import AdminOverview from "./pages/admin/AdminOverview";
import AdminLiveSessions from "./pages/admin/AdminLiveSessions";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserProfile from "./pages/admin/AdminUserProfile";
import AdminCommitments from "./pages/admin/AdminCommitments";
import AdminCommitmentDetail from "./pages/admin/AdminCommitmentDetail";
import AdminTimeline from "./pages/admin/AdminTimeline";
import AdminNetwork from "./pages/admin/AdminNetwork";
import AdminAlerts from "./pages/admin/AdminAlerts";
import AdminInvestigations from "./pages/admin/AdminInvestigations";
import AdminReplay from "./pages/admin/AdminReplay";
import AdminModels from "./pages/admin/AdminModels";
import AdminSystem from "./pages/admin/AdminSystem";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Portal */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transfer"
          element={
            <ProtectedRoute>
              <Transfer />
            </ProtectedRoute>
          }
        />
        <Route path="/trade" element={<Navigate to="/transfer" replace />} />
        <Route
          path="/holds/:id"
          element={
            <ProtectedRoute>
              <HoldReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions/:id"
          element={
            <ProtectedRoute>
              <RiskExplanation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <Activity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payees"
          element={
            <ProtectedRoute>
              <Payees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kpi"
          element={
            <ProtectedRoute>
              <KpiDashboard />
            </ProtectedRoute>
          }
        />

        {/* Risk Operations / Admin Console */}
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/overview" element={<AdminOverview />} />
        <Route path="/admin/live" element={<AdminLiveSessions />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/:id" element={<AdminUserProfile />} />
        <Route path="/admin/commitments" element={<AdminCommitments />} />
        <Route path="/admin/commitments/:id" element={<AdminCommitmentDetail />} />
        <Route path="/admin/timeline" element={<AdminTimeline />} />
        <Route path="/admin/network" element={<AdminNetwork />} />
        <Route path="/admin/alerts" element={<AdminAlerts />} />
        <Route path="/admin/investigations" element={<AdminInvestigations />} />
        <Route path="/admin/replay" element={<AdminReplay />} />
        <Route path="/admin/models" element={<AdminModels />} />
        <Route path="/admin/system" element={<AdminSystem />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
