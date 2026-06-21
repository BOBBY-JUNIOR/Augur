"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Restrained editorial reveal: fade + slight slide-up, ease-out, no spring/bounce.
const ease = [0.22, 0.61, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealOnScroll({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.25, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
