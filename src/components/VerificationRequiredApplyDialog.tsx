'use client';

import { useRouter } from 'next/navigation';
import { FileWarning } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { CONTRACTOR_VERIFICATION_DOCUMENTS_PATH } from '../lib/verification/documents-route';

interface VerificationRequiredApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shown when an unverified contractor tries to submit an offer.
 */
export function VerificationRequiredApplyDialog({
  open,
  onOpenChange,
}: VerificationRequiredApplyDialogProps) {
  const router = useRouter();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-amber-600" />
            Uzupełnij dokumenty weryfikacyjne
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Twoje konto oczekuje na weryfikację przez administratora. Składanie ofert jest
                tymczasowo zablokowane.
              </p>
              <p>
                Uzupełnij dokumenty (wypis z KRS/CEIDG, polisa OC), jeśli jeszcze tego nie zrobiłeś —
                przyspieszy to proces weryfikacji.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onOpenChange(false);
              router.push(CONTRACTOR_VERIFICATION_DOCUMENTS_PATH);
            }}
          >
            Prześlij dokumenty
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
