'use client'

import React, { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'
import { Alert, AlertDescription } from './ui/alert'
import { deleteAccountAction } from '../lib/auth/actions'

export function DeleteAccountSection() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const handleDeleteAccount = async (e: React.MouseEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await deleteAccountAction()

      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
        // Keep dialog open on error so user can see the error message
        setOpen(true)
        return
      }

      // Success - redirect will happen server-side via redirect() in the action
      // Close dialog and let redirect happen
      setOpen(false)
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas usuwania konta')
      setIsLoading(false)
      setOpen(true) // Keep dialog open to show error
    }
  }

  return (
    <div className="space-y-4">
      <Separator />
      
      <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <h4 className="font-medium text-destructive">Niebezpieczna strefa</h4>
              <p className="text-sm text-muted-foreground">
                Usunięcie konta jest działaniem nieodwracalnym. Wszystkie Twoje dane, 
                w tym profile, zgłoszenia, aplikacje i wiadomości, zostaną trwale usunięte 
                i nie będą mogły zostać przywrócone.
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Usuń konto
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Potwierdź usunięcie konta
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2 pt-2">
                    <p>
                      Czy na pewno chcesz trwale usunąć swoje konto? Ta operacja jest 
                      nieodwracalna i spowoduje:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                      <li>Trwałe usunięcie Twojego profilu użytkownika</li>
                      <li>Usunięcie wszystkich Twoich ofert pracy i przetargów</li>
                      <li>Usunięcie wszystkich zgłoszeń i aplikacji</li>
                      <li>Usunięcie wszystkich wiadomości i konwersacji</li>
                      <li>Usunięcie wszystkich innych powiązanych danych</li>
                    </ul>
                    <p className="font-medium text-destructive pt-2">
                      Tej akcji nie można cofnąć.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && (
                <Alert variant="destructive" className="my-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>
                  Anuluj
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Usuwanie...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Tak, usuń konto
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

