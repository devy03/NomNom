import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, MessageCircle, MapPin, Users, User, Sparkles, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Footer } from "@/components/shared/Footer";

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/chat", label: "AI Chat", icon: MessageCircle },
  { to: "/nearby", label: "Nearby", icon: MapPin },
  { to: "/group", label: "Group", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
];

export function NavShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isConfigured } = useAuth();

  return (
    <div className="relative min-h-screen bg-transparent">
      <header className="fixed top-0 left-0 right-0 z-40 flex justify-center px-4 pt-4 pointer-events-none">
        <div className="glass-strong flex w-full max-w-3xl items-center justify-between rounded-2xl px-4 py-2.5 shadow-2xl shadow-black/40 pointer-events-auto">
          <NavLink to="/home" className="group flex items-center gap-2 pr-2">
            <Sparkles size={18} className="text-fuchsia-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            <span className="text-sm font-semibold tracking-tight text-white">NomNom</span>
          </NavLink>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-violet-400/60",
                    active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-white/10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {!active && (
                    <span className="absolute inset-0 rounded-xl bg-white/0 transition-colors duration-200 hover:bg-white/5" />
                  )}
                  <item.icon size={15} className="relative z-10" />
                  <span className="relative z-10 hidden sm:inline">{item.label}</span>
                </NavLink>
              );
            })}
            {isConfigured && !user && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/login")}
                className="ml-1 flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-white outline-none transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-violet-400/60"
              >
                <LogIn size={14} /> <span className="hidden sm:inline">Log In</span>
              </motion.button>
            )}
          </nav>
        </div>
      </header>

      <main className="pt-24 pb-10 bg-transparent">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
        <Footer />
      </main>
    </div>
  );
}
