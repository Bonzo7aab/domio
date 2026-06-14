'use client';

import React, { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building,
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Loader2,
  ChevronRight,
  ClipboardList,
  FileCheck,
  UserCircle,
  Megaphone,
  MessagesSquare,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { registerAction } from '../lib/auth/actions';
import { lookupCompanyByNipAction } from '../lib/gus/actions';
import { isValidNip, normalizeNip } from '../lib/gus/nip';
import { WARSAW_DISTRICTS, DEFAULT_CITY } from '../lib/config/warsawDistricts';
import { useUserProfile } from '../contexts/AuthContext';
import {
  registrationClosedMessage,
  type RegistrationSettings,
} from '../lib/registration-settings-shared';
import {
  AuthFormPanel,
  AuthFormSection,
  AuthPageLayout,
  authFieldClassName,
} from './auth/AuthPageLayout';
import { cn } from './ui/utils';

interface RegisterPageProps {
  registrationSettings: RegistrationSettings;
}

function RoleOption({
  id,
  checked,
  disabled,
  onSelect,
  icon: Icon,
  label,
}: {
  id: string;
  checked: boolean;
  disabled: boolean;
  onSelect: () => void;
  icon: typeof Building;
  label: string;
}) {
  return (
    <div className="relative">
      <input
        type="radio"
        id={id}
        checked={checked}
        onChange={onSelect}
        disabled={disabled}
        className="peer sr-only"
      />
      <Label
        htmlFor={id}
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-xl border-2 border-border/60 bg-background p-4 transition-all',
          'hover:border-primary/40 peer-checked:border-primary peer-checked:bg-primary/5',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </span>
        <span className="font-medium text-foreground">{label}</span>
      </Label>
    </div>
  );
}

export function RegisterPage({ registrationSettings }: RegisterPageProps) {
  const router = useRouter();
  const { refreshSession } = useUserProfile();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const error = formError || searchParams?.get('error') || undefined;
  const message = searchParams?.get('message') || undefined;
  const defaultUserTypeParam = searchParams?.get('userType') as 'contractor' | 'manager' | null;

  const resolvedDefaultType: 'contractor' | 'manager' = (() => {
    if (defaultUserTypeParam === 'manager' && registrationSettings.managerOpen) return 'manager';
    if (defaultUserTypeParam === 'contractor' && registrationSettings.contractorOpen) return 'contractor';
    if (registrationSettings.contractorOpen) return 'contractor';
    if (registrationSettings.managerOpen) return 'manager';
    return 'contractor';
  })();

  const [selectedUserType, setSelectedUserType] = useState<'contractor' | 'manager'>(resolvedDefaultType);
  const [organizationType, setOrganizationType] = useState<'spółdzielnia' | 'wspólnota'>('wspólnota');
  const [district, setDistrict] = useState<string>('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [nip, setNip] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [street, setStreet] = useState('');
  const [regon, setRegon] = useState('');
  const [gusAddress, setGusAddress] = useState('');
  const [gusCity, setGusCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [bankAccountIban, setBankAccountIban] = useState('');
  const [vatStatus, setVatStatus] = useState('');
  const [gusLookupStatus, setGusLookupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [gusLookupMessage, setGusLookupMessage] = useState<string | null>(null);
  const lastLookedUpNipRef = useRef<string | null>(null);
  const gusLookupAbortRef = useRef(0);

  const clearGusDerivedFields = useCallback(() => {
    setRegon('');
    setGusAddress('');
    setGusCity('');
    setPostalCode('');
    setBankAccountIban('');
    setVatStatus('');
    setStreet('');
    setDistrict('');
    lastLookedUpNipRef.current = null;
  }, []);

  const runGusLookup = useCallback(async (nipValue: string) => {
    const normalized = normalizeNip(nipValue);

    if (!isValidNip(normalized)) {
      setGusLookupStatus('error');
      setGusLookupMessage('Nieprawidłowy numer NIP');
      return;
    }

    if (lastLookedUpNipRef.current === normalized) {
      return;
    }

    const requestId = ++gusLookupAbortRef.current;
    setGusLookupStatus('loading');
    setGusLookupMessage(null);

    const result = await lookupCompanyByNipAction(normalized);

    if (requestId !== gusLookupAbortRef.current) {
      return;
    }

    if ('error' in result) {
      setGusLookupStatus('error');
      setGusLookupMessage(result.error);
      clearGusDerivedFields();
      return;
    }

    lastLookedUpNipRef.current = normalized;
    setCompanyName(result.data.name);
    setRegon(result.data.regon);
    setGusAddress(result.data.address ?? '');
    setGusCity(result.data.city ?? '');
    setPostalCode(result.data.postalCode ?? '');
    if (result.data.address) {
      setStreet(result.data.address);
    }
    if (result.data.district) {
      setDistrict(result.data.district);
    }
    setBankAccountIban(result.data.bankAccountIban ?? '');
    setVatStatus(result.data.vatStatus ?? '');
    setGusLookupStatus('success');
    const mfExtras: string[] = [];
    if (result.data.bankAccountIban) {
      mfExtras.push('numer konta');
    }
    if (result.data.vatStatus) {
      mfExtras.push('status VAT');
    }
    setGusLookupMessage(
      mfExtras.length > 0
        ? `Dane firmy pobrane z GUS (w tym ${mfExtras.join(' i ')} z białej listy VAT)`
        : 'Dane firmy pobrane z GUS',
    );
  }, [clearGusDerivedFields]);

  const handleSelectUserType = (type: 'contractor' | 'manager') => {
    setSelectedUserType(type);
  };

  const normalizedNip = normalizeNip(nip);
  const gusNipValidationError =
    normalizedNip.length >= 10 && !isValidNip(normalizedNip) ? 'Nieprawidłowy numer NIP' : null;

  useEffect(() => {
    if (!isValidNip(normalizedNip) || lastLookedUpNipRef.current === normalizedNip) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void runGusLookup(normalizedNip);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [normalizedNip, runGusLookup]);

  const handleNipBlur = () => {
    const normalized = normalizeNip(nip);
    if (isValidNip(normalized) && lastLookedUpNipRef.current !== normalized) {
      void runGusLookup(normalized);
    }
  };

  const handleNipChange = (value: string) => {
    setNip(value);
    const normalized = normalizeNip(value);
    if (lastLookedUpNipRef.current && lastLookedUpNipRef.current !== normalized) {
      clearGusDerivedFields();
      setGusLookupStatus('idle');
      setGusLookupMessage(null);
    }
  };

  const roleRegistrationClosed =
    (selectedUserType === 'contractor' && !registrationSettings.contractorOpen) ||
    (selectedUserType === 'manager' && !registrationSettings.managerOpen);

  const submitDisabled = !acceptTerms || roleRegistrationClosed;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (roleRegistrationClosed) {
      setFormError(registrationClosedMessage(selectedUserType));
      return;
    }

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registerAction(formData);

      if (result && 'error' in result) {
        setFormError(result.error);
        return;
      }

      if (result && 'success' in result && result.success) {
        await refreshSession();
        router.refresh();
        setTimeout(() => {
          router.push(result.redirectTo);
        }, 100);
      }
    });
  };

  const sideFeatures =
    selectedUserType === 'contractor'
      ? [
          {
            icon: ClipboardList,
            title: 'Przeglądaj konkursy i składaj oferty',
            description: 'Dopasuj ofertę do budżetu i terminu realizacji.',
          },
          {
            icon: FileCheck,
            title: 'Weryfikacja, kiedy chcesz',
            description: 'Dokumenty możesz przesłać od razu albo później z konta.',
          },
          {
            icon: UserCircle,
            title: 'Profil firmy w jednym miejscu',
            description: 'NIP, dane kontaktowe i kwalifikacje — uzupełnisz stopniowo.',
          },
        ]
      : [
          {
            icon: Megaphone,
            title: 'Publikuj konkursy dla wykonawców',
            description: 'Ogłoszenia widoczne na mapie i w liście konkursów.',
          },
          {
            icon: MessagesSquare,
            title: 'Bezpieczny kontakt z firmami',
            description: 'Komunikacja tylko z wybranymi wykonawcami.',
          },
          {
            icon: LayoutDashboard,
            title: 'Zarządzaj współpracą',
            description: 'Oferty, statusy i historia w panelu zarządcy.',
          },
        ];

  return (
    <AuthPageLayout
      testId="register-page"
      headingTestId="register-heading"
      contentMaxWidth="lg"
      title="Zarejestruj się"
      subtitle="Kilka pól — i możesz korzystać z platformy."
      trustNote={
        selectedUserType === 'manager'
          ? 'Dane chronione zgodnie z RODO.'
          : 'Dane chronione zgodnie z RODO. Weryfikacja dokumentów dla wykonawców.'
      }
      side={{
        heading:
          selectedUserType === 'contractor'
            ? 'Dołącz jako wykonawca'
            : 'Dołącz jako zarządca',
        body:
          selectedUserType === 'contractor'
            ? 'Załóż konto firmy, a dokumenty weryfikacyjne prześlesz wtedy, kiedy będziesz gotowy.'
            : 'Opublikuj konkursy i znajdź sprawdzonych wykonawców w Warszawie.',
        features: sideFeatures,
      }}
      footer={
        <>
          Masz już konto?{' '}
          <Link href="/logowanie" className="font-medium text-primary hover:underline">
            Zaloguj się
          </Link>
        </>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert className="mb-4 border-emerald-500/30 bg-emerald-500/5">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {!registrationSettings.contractorOpen && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{registrationClosedMessage('contractor')}</AlertDescription>
        </Alert>
      )}
      {!registrationSettings.managerOpen && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{registrationClosedMessage('manager')}</AlertDescription>
        </Alert>
      )}

      <AuthFormPanel>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="userType" value={selectedUserType} />

          <AuthFormSection title="Typ konta">
            <div className="grid grid-cols-2 gap-3">
              <RoleOption
                id="register-manager"
                checked={selectedUserType === 'manager'}
                disabled={!registrationSettings.managerOpen}
                onSelect={() => handleSelectUserType('manager')}
                icon={Building}
                label="Zarządca"
              />
              <RoleOption
                id="register-contractor"
                checked={selectedUserType === 'contractor'}
                disabled={!registrationSettings.contractorOpen}
                onSelect={() => handleSelectUserType('contractor')}
                icon={User}
                label="Wykonawca"
              />
            </div>
          </AuthFormSection>

          {selectedUserType === 'manager' && (
            <AuthFormSection title="Typ organizacji">
              <div className="grid grid-cols-2 gap-3">
                {(['spółdzielnia', 'wspólnota'] as const).map(type => (
                  <div key={type} className="relative">
                    <input
                      type="radio"
                      name="organizationType"
                      value={type}
                      id={`org-${type}`}
                      checked={organizationType === type}
                      onChange={() => setOrganizationType(type)}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`org-${type}`}
                      className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-border/60 p-3 text-sm font-medium transition-all hover:border-primary/40 peer-checked:border-primary peer-checked:bg-primary/5"
                    >
                      {type === 'spółdzielnia' ? 'Spółdzielnia' : 'Wspólnota'}
                    </Label>
                  </div>
                ))}
              </div>
            </AuthFormSection>
          )}

          <AuthFormSection title="Firma">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nip">NIP</Label>
                <div className="relative">
                  <Input
                    id="nip"
                    name="nip"
                    value={nip}
                    onChange={e => handleNipChange(e.target.value)}
                    onBlur={handleNipBlur}
                    placeholder="0000000000"
                    className={authFieldClassName}
                    required
                    disabled={isPending}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                  {gusLookupStatus === 'loading' && (
                    <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                {(gusNipValidationError || gusLookupMessage) && (
                  <p
                    className={cn(
                      'text-xs',
                      !gusNipValidationError && gusLookupStatus === 'success' && 'text-emerald-600',
                      (gusNipValidationError || gusLookupStatus === 'error') && 'text-destructive',
                    )}
                  >
                    {gusNipValidationError ?? gusLookupMessage}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Nazwa</Label>
                <div className="relative">
                  <Building className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="companyName"
                    name="companyName"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder={
                      selectedUserType === 'manager'
                        ? 'np. Wspólnota Mieszkaniowa Osiedle Zielone'
                        : 'np. Firma Budowlana ABC'
                    }
                    className={`pl-10 ${authFieldClassName}`}
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            <input type="hidden" name="regon" value={regon} />
            <input type="hidden" name="postalCode" value={postalCode} />

            {selectedUserType === 'contractor' && (
              <>
                <input type="hidden" name="address" value={gusAddress} />
                <input type="hidden" name="city" value={gusCity} />
                <input type="hidden" name="bankAccountIban" value={bankAccountIban} />
                <input type="hidden" name="vatStatus" value={vatStatus} />
              </>
            )}

            {selectedUserType === 'manager' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="street">Ulica</Label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="street"
                      name="street"
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      placeholder="ul. Przykładowa 1"
                      className={`pl-10 ${authFieldClassName}`}
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">Dzielnica</Label>
                  <select
                    id="district"
                    name="district"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    required
                    disabled={isPending}
                    className={cn(
                      'flex w-full rounded-md border border-border/80 bg-background px-3 py-2 text-sm shadow-sm',
                      'h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                    )}
                  >
                    <option value="">Wybierz dzielnicę</option>
                    {WARSAW_DISTRICTS.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <input type="hidden" name="city" value={DEFAULT_CITY} />
              </div>
            )}
          </AuthFormSection>

          <AuthFormSection title="Osoba kontaktowa">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Imię</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Jan"
                  className={authFieldClassName}
                  required
                  disabled={isPending}
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nazwisko</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Kowalski"
                  className={authFieldClassName}
                  required
                  disabled={isPending}
                  autoComplete="family-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+48 123 456 789"
                    className={`pl-10 ${authFieldClassName}`}
                    required
                    disabled={isPending}
                    autoComplete="tel"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="twoj@email.pl"
                    className={`pl-10 ${authFieldClassName}`}
                    required
                    disabled={isPending}
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>
          </AuthFormSection>

          <AuthFormSection title="Hasło">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Hasło</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Co najmniej 6 znaków"
                    className={`pl-10 pr-10 ${authFieldClassName}`}
                    required
                    disabled={isPending}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Powtórz hasło"
                    className={`pl-10 pr-10 ${authFieldClassName}`}
                    required
                    disabled={isPending}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </AuthFormSection>

          <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
            <Checkbox
              id="acceptTerms"
              checked={acceptTerms}
              onCheckedChange={v => setAcceptTerms(v === true)}
              disabled={isPending}
            />
            <label htmlFor="acceptTerms" className="cursor-pointer text-sm leading-snug text-muted-foreground">
              Akceptuję{' '}
              <Link href="/regulamin" className="font-medium text-primary hover:underline">
                regulamin
              </Link>{' '}
              i{' '}
              <Link href="/polityka-prywatnosci" className="font-medium text-primary hover:underline">
                politykę prywatności
              </Link>
              .
            </label>
          </div>
          <input type="hidden" name="acceptTerms" value={acceptTerms ? '1' : '0'} />

          <Button
            type="submit"
            disabled={submitDisabled || isPending}
            className="h-11 w-full"
            data-testid="register-submit"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {selectedUserType === 'contractor' ? 'Tworzenie konta...' : 'Rejestracja...'}
              </>
            ) : selectedUserType === 'contractor' ? (
              <>
                Dalej
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              'Zarejestruj się'
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {selectedUserType === 'contractor'
              ? 'Po rejestracji wybierzesz, czy chcesz od razu przesłać dokumenty weryfikacyjne.'
              : 'Twoje dane służą wyłącznie do kontaktu z wybranymi wykonawcami.'}
          </p>
        </form>
      </AuthFormPanel>
    </AuthPageLayout>
  );
}

export default RegisterPage;
