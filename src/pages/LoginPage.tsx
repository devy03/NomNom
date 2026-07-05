import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Sparkles } from "lucide-react";
import { AIOrb } from "@/components/shared/AIOrb";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signIn } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConfigured } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/home";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isConfigured) {
      toast("Demo mode — Supabase isn't configured, so login is simulated.", "info");
      navigate(from);
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      toast("Welcome back!", "success");
      navigate(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't log you in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <AIOrb size={120} className="mb-4" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong w-full max-w-md rounded-3xl p-8"
      >
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-zinc-400">Let's find something good to eat.</p>
          {!isConfigured && (
            <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              Demo mode: Supabase isn't configured yet, so this won't check a real account.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            <LogIn size={16} /> {loading ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          New here?{" "}
          <Link to="/signup" className="font-medium text-violet-300 hover:text-violet-200">
            Create an account
          </Link>
        </p>
      </motion.div>

      <Link to="/home" className="mt-6 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300">
        <Sparkles size={12} /> Skip for now
      </Link>
    </div>
  );
}
