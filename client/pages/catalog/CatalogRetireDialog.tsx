import { Archive, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { buttonVariants } from "../../components/ui/button";
import { cn } from "../../lib/utils";

type CatalogRetireDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  pending?: boolean;
  onConfirm: () => void;
};

/**
 * Destructive confirm for soft-delete («Dar de baja»), erp-ui-style.
 */
export function CatalogRetireDialog({
  open,
  onOpenChange,
  title,
  description,
  pending = false,
  onConfirm,
}: CatalogRetireDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm w-full rounded-xl p-6 shadow-2xl backdrop-blur-sm">
        <AlertDialogHeader className="border-b border-border pb-3 space-y-2">
          <AlertDialogTitle className="text-xl font-bold text-destructive">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-end gap-3">
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Archive className="mr-2 h-4 w-4" />
            )}
            {pending ? "Dando de baja…" : "Dar de baja"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
