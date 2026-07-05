import { motion } from "framer-motion";
import { AlertTriangle, Inbox, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SkeletonCard() {
  return (
    <div className="glass overflow-hidden rounded-3xl">
      <div className="shimmer h-44 w-full" />
      <div className="space-y-2 p-4">
        <div className="shimmer h-4 w-2/3 rounded-full" />
        <div className="shimmer h-3 w-1/2 rounded-full" />
        <div className="shimmer h-3 w-full rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function LoadingState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-4 py-16 text-center"
    >
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-violet-400"
            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <p className="text-sm text-zinc-400">{message}</p>
    </motion.div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl px-8 py-14 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-zinc-400">
        <Icon size={22} />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && <p className="text-sm text-zinc-400">{description}</p>}
      {action && (
        <Button size="sm" variant="glass" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl px-8 py-14 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
        <AlertTriangle size={22} />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && <p className="text-sm text-zinc-400">{description}</p>}
      {onRetry && (
        <Button size="sm" variant="glass" onClick={onRetry} className="mt-2">
          Try Again
        </Button>
      )}
    </motion.div>
  );
}
