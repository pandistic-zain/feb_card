"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function PinkLampOverlay({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)}>
      <motion.div
        initial={{ opacity: 0.08, scale: 0.96 }}
        animate={{ opacity: 0.14, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute left-1/2 top-1 h-32 w-[20rem] -translate-x-1/2 rounded-full bg-pink-300/35 blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0.05, scale: 0.95 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.05 }}
        className="absolute left-1/2 top-3 h-20 w-[13rem] -translate-x-1/2 rounded-full bg-rose-400/30 blur-2xl"
      />
    </div>
  );
}
