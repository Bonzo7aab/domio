'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

export const DOCUMENT_REMOVAL_DESCRIPTION =
  'Usunięcie dokumentu jest nieodwracalne. Jeśli Twoje konto było zweryfikowane lub dokumenty zostały już przesłane do weryfikacji, będziesz musiał(a) uzupełnić dokumenty ponownie i przejść weryfikację od nowa.';

interface DocumentRemovalAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
  title?: string;
  description?: string;
}

export function DocumentRemovalAlertDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  title = 'Usunąć dokument?',
  description = DOCUMENT_REMOVAL_DESCRIPTION,
}: DocumentRemovalAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={event => {
              event.preventDefault();
              void onConfirm();
            }}
          >
            {isPending ? 'Usuwanie…' : 'Usuń dokument'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
