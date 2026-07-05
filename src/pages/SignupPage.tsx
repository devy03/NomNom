import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Sparkles } from "lucide-react";
import { AIOrb } from "@/components/shared/AIOrb";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signUp } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export function SignupPage() {
  const navigate = useNavigate();
  const { isConfigured } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Enter your name.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");

    if (!isConfigured) {
      toast("Demo mode — Supabase isn't configured, so accounts aren't saved.", "info");
      navigate("/onboarding");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name);
      toast("Welcome to NomNom! Let's set up your preferences.", "success");
      navigate("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong signing up.");
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
          <h1 className="text-2xl font-semibold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-400">Tell us what you like. We'll handle the rest.</p>
          {!isConfigured && (
            <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              Demo mode: Supabase isn't configured yet, so this won't create a real account.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" autoComplete="name" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" required />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" autoComplete="new-password" required />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            <UserPlus size={16} /> {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-violet-300 hover:text-violet-200">
            Log in
          </Link>
        </p>
      </motion.div>

      <Link to="/home" className="mt-6 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300">
        <Sparkles size={12} /> Skip for now
      </Link>
    </div>
  );
}
