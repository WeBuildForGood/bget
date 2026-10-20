"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProblemForm } from "@/components/site/problem-form";

interface ProblemSubmitModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ProblemSubmitModal({ open, onOpenChange, trigger }: ProblemSubmitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">
            Submit a problem
          </DialogTitle>
          <DialogDescription>
            Any problem, any sector. A human answers within 72 hours.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ProblemForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProblemSubmitModal;