"use client";

import { Button } from "@rectangular-labs/ui/components/ui/button";
import { AnimatePresence, motion } from "motion/react";

export interface FloatingToolbarProps {
  onCancel: () => void;
  isSaving?: boolean;
  isVisible: boolean;
}

export function FloatingToolbar({
  onCancel,
  isSaving = false,
  isVisible,
}: FloatingToolbarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={`-translate-x-1/2 fixed bottom-6 left-1/2 z-50 flex items-center justify-end gap-2 rounded-lg border bg-background px-2 py-2 shadow-lg`}
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.1, ease: [0, 0, 0.28, 1] }}
        >
          <Button
            disabled={isSaving}
            onClick={onCancel}
            size="sm"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            isLoading={isSaving}
            size="sm"
            type="submit"
            variant="default"
          >
            Save changes
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
