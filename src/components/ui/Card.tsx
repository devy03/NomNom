import type { HTMLAttributes } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  strong?: boolean;
}

export function Card({ className, strong, children, ...props }: CardProps & HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      className={cn(strong ? "glass-strong" : "glass", "rounded-3xl", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn("text-lg font-semibold tracking-tight text-white", className)}>{children}</h3>;
}

export function CardSubtitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("text-sm text-zinc-400", className)}>{children}</p>;
}
