"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * A results grid with a soft editorial entrance: children fade + rise with a
 * gentle stagger. Honors prefers-reduced-motion (renders static).
 */
export function MotionGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.04 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;

  return (
    <motion.div
      className="h-full"
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      // New cards that prepend during polling animate in cleanly too.
      layout
    >
      {children}
    </motion.div>
  );
}

export { AnimatePresence };
