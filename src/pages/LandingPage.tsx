import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { AIOrb } from "@/components/shared/AIOrb";
import { Footer } from "@/components/shared/Footer";

const examples = [
  "I want something spicy",
  "Best burger under $20",
  "Date night ideas",
  "I'm too tired to cook",
  "I have chicken at home",
];

export function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setExampleIndex((i) => (i + 1) % examples.length);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/chat", { state: { initialQuery: query || examples[exampleIndex] } });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-zinc-300"
      >
        <Sparkles size={13} className="text-fuchsia-400" />
        Your AI food decision assistant
      </motion.div>

      <AIOrb size={280} radar className="mb-2" />

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 text-center text-5xl font-semibold tracking-tight text-gradient sm:text-6xl"
      >
        What are we eating today?
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mt-4 max-w-md text-center text-base text-zinc-400"
      >
        No more scrolling. No more group chats going in circles. Just tell me what's on your mind.
      </motion.p>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6 }}
        className="glass-strong mt-10 w-full max-w-xl rounded-3xl p-2 shadow-2xl shadow-black/50"
      >
        <div className="relative flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full flex-1 bg-transparent px-5 py-4 text-base text-white placeholder-zinc-500 outline-none"
            placeholder=" "
          />
          {!query && (
            <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500">
              <span className="mr-1">Ask me anything...</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={exampleIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="italic text-violet-300/70"
                >
                  "{examples[exampleIndex]}"
                </motion.span>
              </AnimatePresence>
            </div>
          )}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30"
          >
            <ArrowRight size={20} />
          </motion.button>
        </div>
      </motion.form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 flex flex-wrap justify-center gap-2"
      >
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => navigate("/chat", { state: { initialQuery: ex } })}
            className="rounded-full glass px-3.5 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            {ex}
          </button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-14 flex items-center gap-4 text-sm"
      >
        <button
          onClick={() => navigate("/signup")}
          className="rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 px-5 py-2 font-medium text-white shadow-lg shadow-fuchsia-500/25"
        >
          Create Account
        </button>
        <button onClick={() => navigate("/login")} className="text-zinc-400 hover:text-zinc-200">
          Log In
        </button>
        <button
          onClick={() => navigate("/home")}
          className="text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
        >
          Skip to dashboard →
        </button>
      </motion.div>
      <Footer />
    </div>
  );
}
