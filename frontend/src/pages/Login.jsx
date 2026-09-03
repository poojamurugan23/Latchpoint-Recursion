import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white px-4">
      <header className="py-6 max-w-5xl mx-auto w-full flex items-center justify-between">
        <Link
          to="/"
          className="font-display text-xl font-semibold text-accent tracking-tight"
        >
          Latchpoint
        </Link>
      </header>

      <main className="flex items-center justify-center my-auto">
        <Card className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-accent text-center mb-1">
            Latchpoint
          </h1>
          <p className="text-secondary text-ink-600 text-center mb-6">
            {mode === "login"
              ? "Sign in to your account"
              : "Create your account"}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="text-caption text-block">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="w-full text-center text-secondary text-ink-600 hover:text-ink-900 mt-5 transition-colors duration-[120ms] ease-out"
          >
            {mode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </Card>
      </main>

      <footer className="py-6 text-center text-caption text-ink-400">
        Pre-commitment financial risk intelligence
      </footer>
    </div>
  );
}
