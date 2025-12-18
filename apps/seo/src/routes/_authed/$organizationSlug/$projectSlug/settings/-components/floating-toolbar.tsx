"use client";

import {
  Alert,
  AlertDescription,
} from "@rectangular-labs/ui/components/ui/alert";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { AnimatePresence, motion } from "motion/react";

export interface FloatingToolbarProps {
  onCancel: () => void;
  isSaving?: boolean;
  isVisible: boolean;
  errors?: string;
}

export function FloatingToolbar({
  onCancel,
  isSaving = false,
  isVisible,
  errors,
}: FloatingToolbarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 space-y-2 rounded-lg border bg-background px-2 py-2 shadow-lg`}
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.1, ease: [0, 0, 0.28, 1] }}
        >
          {errors && (
            <Alert variant="destructive">
              <AlertDescription>{errors}</AlertDescription>
            </Alert>
          )}
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              disabled={isSaving}
              onClick={onCancel}
              size="sm"
              type="button"
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
