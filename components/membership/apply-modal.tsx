"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApplyForm } from "@/components/site/apply-form";

interface ApplyModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ApplyModal({ open, onOpenChange, trigger }: ApplyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">
            Apply to join Build For Good
          </DialogTitle>
          <DialogDescription>
            Character is the gate, not your CV. A human reads every application — usually within 72 hours.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ApplyForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ApplyModal;