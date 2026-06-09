import { Suspense } from 'react';
import { getRegistrationSettings } from '../../lib/database/platform-settings';
import { RegisterPageClient } from '../../components/RegisterPageClient';

function LoadingState({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" data-testid="auth-loading">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default async function Register() {
  const registrationSettings = await getRegistrationSettings();

  return (
    <Suspense fallback={<LoadingState label="Ładowanie strony rejestracji..." />}>
      <RegisterPageClient registrationSettings={registrationSettings} />
    </Suspense>
  );
}
