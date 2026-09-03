import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Network, Layers } from "lucide-react";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [error, setError] = useState("");
  const { demoLogin, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleDemoLogin() {
    setError("");
    setLoadingDemo(true);
    try {
      await demoLogin();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to start demo session");
    } finally {
      setLoadingDemo(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* 1. Nav */}
      <header
        className={`sticky top-0 z-40 transition-colors duration-150 ease-out ${
          scrolled
            ? "border-b border-border bg-white/95 backdrop-blur-sm"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-accent tracking-tight">
            Latchpoint
          </span>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button
                  variant="secondary"
                  className="text-secondary py-2 px-4"
                >
                  Open Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button
                  variant="secondary"
                  className="text-secondary py-2 px-4"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero */}
      <main className="flex-1 flex flex-col items-center px-6">
        <section className="pt-24 pb-16 max-w-[680px] w-full text-center flex flex-col items-center">
          <p className="font-sans text-eyebrow uppercase text-ink-600 mb-6">
            PRE-COMMITMENT RISK INTELLIGENCE
          </p>
          <h1 className="font-display text-hero text-ink-900 mb-6">
            See the risk before it becomes irreversible.
          </h1>
          <p className="font-sans text-body text-ink-600 max-w-[520px] mb-8">
            Risk in the sequence, network, and context around an otherwise
            legitimate action, surfaced in the seconds before commitment.
          </p>

          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              onClick={handleDemoLogin}
              disabled={loadingDemo}
              className="py-3 px-6"
            >
              {loadingDemo ? "Entering…" : "Enter Live Demo →"}
            </Button>
            <Link to="/login">
              <Button variant="secondary" className="py-3 px-6">
                Sign In
              </Button>
            </Link>
          </div>

          {error && <p className="text-caption text-block mt-4">{error}</p>}
        </section>

        {/* 3. Three-column feature strip */}
        <section className="w-full max-w-5xl py-16 border-t border-border mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-start text-left">
              <div className="p-2 border border-border rounded-sm text-ink-600 mb-4">
                <Activity size={18} />
              </div>
              <h3 className="font-sans text-secondary font-semibold text-ink-900 mb-2">
                Sequence
              </h3>
              <p className="font-sans text-[13px] leading-[20px] text-ink-600">
                Detects cumulative same-day drift, rapid pacing, and
                uncharacteristic behavioral pauses before money moves.
              </p>
            </div>

            <div className="flex flex-col items-start text-left">
              <div className="p-2 border border-border rounded-sm text-ink-600 mb-4">
                <Network size={18} />
              </div>
              <h3 className="font-sans text-secondary font-semibold text-ink-900 mb-2">
                Network
              </h3>
              <p className="font-sans text-[13px] leading-[20px] text-ink-600">
                Surfaces shared device fingerprints, proxy routing, and
                cross-payee structural connections in real time.
              </p>
            </div>

            <div className="flex flex-col items-start text-left">
              <div className="p-2 border border-border rounded-sm text-ink-600 mb-4">
                <Layers size={18} />
              </div>
              <h3 className="font-sans text-secondary font-semibold text-ink-900 mb-2">
                Context
              </h3>
              <p className="font-sans text-[13px] leading-[20px] text-ink-600">
                Flags repeated negative-outcome sequences and sudden deviations
                from established personal baselines.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <p className="font-sans text-caption text-ink-400">
            Latchpoint · Pre-commitment risk intelligence
          </p>
          <p className="font-sans text-caption text-ink-400">White Studio v2</p>
        </div>
      </footer>
    </div>
  );
}
