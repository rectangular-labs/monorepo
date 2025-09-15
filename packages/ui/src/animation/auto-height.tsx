"use client";

import { cn } from "@rectangular-labs/ui/utils/cn";
import { motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

function AutoHeight({
  children,
  className,
  contentId,
  ...props
}: React.ComponentPropsWithRef<typeof motion.div> & {
  contentId: string;
  children: React.ReactNode;
}) {
  const [parentHeight, setParentHeight] = useState(0);

  return (
    <motion.div
      animate={{ height: parentHeight }}
      className={cn("relative overflow-hidden", className)}
      transition={{
        ease: [0, 0, 0.28, 1],
      }}
      {...props}
    >
      <ChildContainer key={contentId} onHeightReady={(h) => setParentHeight(h)}>
        {children}
      </ChildContainer>
    </motion.div>
  );
}

function ChildContainer({
  children,
  onHeightReady,
}: {
  children: React.ReactNode;
  onHeightReady: (height: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const next = containerRef.current.offsetHeight;
      requestAnimationFrame(() => onHeightReady(next));
    });

    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight);
      ro.observe(containerRef.current);
    }
    return () => {
      ro.disconnect();
    };
  }, [onHeightReady]);

  return <div ref={containerRef}>{children}</div>;
}

export { AutoHeight };
