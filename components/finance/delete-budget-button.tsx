"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteBudget } from "@/lib/actions/budgets";
import { IDLE_FORM_STATE } from "@/lib/validation/form";

export function DeleteBudgetButton({
  id,
  categoryName,
}: {
  id: string;
  categoryName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await deleteBudget(IDLE_FORM_STATE, formData);
      if (result.status === "success") {
        toast.success(result.message ?? "Budget removed.");
        setOpen(false);
      } else {
        toast.error(result.message ?? "Could not remove that budget.");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove the ${categoryName} budget`}
        >
          <Trash2 aria-hidden />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this budget?</AlertDialogTitle>
          <AlertDialogDescription>
            The {categoryName} limit for this month will be deleted. Your
            transactions are not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <form onSubmit={handleSubmit} className="contents">
            <input type="hidden" name="id" value={id} />
            <AlertDialogCancel disabled={pending}>Keep it</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {pending ? "Removing…" : "Remove budget"}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
