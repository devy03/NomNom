import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/5 transition-all focus:bg-white/8 focus:ring-2 focus:ring-violet-500/50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("mb-1.5 block text-xs font-medium text-zinc-400", className)}>{children}</label>;
}
