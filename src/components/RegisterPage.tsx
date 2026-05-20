'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building, User, Phone, Mail, Lock, Eye, EyeOff, MapPin, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { registerAction } from '../lib/auth/actions';
import { getAllCategoryConfigs } from '../lib/config/categoryConfig';
import { WARSAW_DISTRICTS, DEFAULT_CITY } from '../lib/config/warsawDistricts';
import { useUserProfile } from '../contexts/AuthContext';
import {
  registrationClosedMessage,
  type RegistrationSettings,
} from '../lib/registration-settings-shared';

interface RegisterPageProps {
  registrationSettings: RegistrationSettings;
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const categories = getAllCategoryConfigs();

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const roleRegistrationClosed =
    (selectedUserType === 'contractor' && !registrationSettings.contractorOpen) ||
    (selectedUserType === 'manager' && !registrationSettings.managerOpen);

  const submitDisabled =
    !acceptTerms ||
    roleRegistrationClosed ||
    (selectedUserType === 'contractor' && selectedCategories.length === 0);

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

  return (
    <div className="min-h-screen bg-slate-50 py-16" data-testid="register-page">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2" data-testid="register-heading">
              Zarejestruj się
            </h1>
            <p className="text-slate-600">Wypełnij formularz aby założyć nowe konto</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert className="mb-6">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {!registrationSettings.contractorOpen && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                {registrationClosedMessage('contractor')}
              </AlertDescription>
            </Alert>
          )}
          {!registrationSettings.managerOpen && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{registrationClosedMessage('manager')}</AlertDescription>
            </Alert>
          )}

          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <input type="hidden" name="userType" value={selectedUserType} />

                {/* Typ konta */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-900">Typ konta</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="radio"
                        name="userType"
                        value="manager"
                        id="manager"
                        checked={selectedUserType === 'manager'}
                        onChange={() => setSelectedUserType('manager')}
                        disabled={!registrationSettings.managerOpen}
                        className="sr-only peer"
                      />
                      <Label
                        htmlFor="manager"
                        className={`flex items-center space-x-3 p-3 border border-slate-200 rounded-lg transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-blue-300 ${
                          registrationSettings.managerOpen
                            ? 'cursor-pointer'
                            : 'cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Building className="h-5 w-5 text-slate-600" />
                        <div>
                          <h3 className="font-medium text-slate-900">Zarządca</h3>
                        </div>
                      </Label>
                    </div>
                    <div className="relative">
                      <input
                        type="radio"
                        name="userType"
                        value="contractor"
                        id="contractor"
                        checked={selectedUserType === 'contractor'}
                        onChange={() => setSelectedUserType('contractor')}
                        disabled={!registrationSettings.contractorOpen}
                        className="sr-only peer"
                      />
                      <Label
                        htmlFor="contractor"
                        className={`flex items-center space-x-3 p-3 border border-slate-200 rounded-lg transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-blue-300 ${
                          registrationSettings.contractorOpen
                            ? 'cursor-pointer'
                            : 'cursor-not-allowed opacity-50'
                        }`}
                      >
                        <User className="h-5 w-5 text-slate-600" />
                        <div>
                          <h3 className="font-medium text-slate-900">Wykonawca</h3>
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Zarządca: Typ organizacji */}
                {selectedUserType === 'manager' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-900">Typ organizacji</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="radio"
                          name="organizationType"
                          value="spółdzielnia"
                          id="org-spoldzielnia"
                          checked={organizationType === 'spółdzielnia'}
                          onChange={() => setOrganizationType('spółdzielnia')}
                          className="sr-only peer"
                        />
                        <Label
                          htmlFor="org-spoldzielnia"
                          className="flex items-center justify-center p-3 border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-blue-300"
                        >
                          Spółdzielnia
                        </Label>
                      </div>
                      <div className="relative">
                        <input
                          type="radio"
                          name="organizationType"
                          value="wspólnota"
                          id="org-wspolnota"
                          checked={organizationType === 'wspólnota'}
                          onChange={() => setOrganizationType('wspólnota')}
                          className="sr-only peer"
                        />
                        <Label
                          htmlFor="org-wspolnota"
                          className="flex items-center justify-center p-3 border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-blue-300"
                        >
                          Wspólnota
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* NIP + Nazwa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nip" className="text-sm font-medium text-slate-900">
                      NIP *
                    </Label>
                    <Input
                      id="nip"
                      name="nip"
                      placeholder="0000000000"
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium text-slate-900">
                      Nazwa *
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                      <Input
                        id="companyName"
                        name="companyName"
                        placeholder={
                          selectedUserType === 'manager'
                            ? 'np. Wspólnota Mieszkaniowa Osiedle Zielone'
                            : 'np. Firma Budowlana ABC'
                        }
                        className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Adres – tylko Zarządca */}
                {selectedUserType === 'manager' && (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-slate-900">Adres *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="street" className="text-xs text-slate-600">
                          Ulica
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                          <Input
                            id="street"
                            name="street"
                            placeholder="ul. Przykładowa 1"
                            className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="district" className="text-xs text-slate-600">
                          Dzielnica *
                        </Label>
                        <select
                          id="district"
                          name="district"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          required
                          className="flex h-11 w-full rounded-md border border-slate-200 bg-gray-50 px-3 py-2 text-sm text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="">Wybierz dzielnicę</option>
                          {WARSAW_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <input type="hidden" name="city" value={DEFAULT_CITY} />
                  </div>
                )}

                {/* Osoba kontaktowa */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-slate-900">Osoba kontaktowa *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-xs text-slate-600">
                        Imię
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="Jan"
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-xs text-slate-600">
                        Nazwisko
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Kowalski"
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs text-slate-600">
                        Telefon *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+48 123 456 789"
                          className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs text-slate-600">
                        Mail *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="twoj@email.pl"
                          className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kategoria – tylko Wykonawca */}
                {selectedUserType === 'contractor' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-900">
                      Kategoria * (wybierz specjalizacje)
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3">
                      {categories.map((cat) => (
                        <label
                          key={cat.slug}
                          className="flex items-center gap-3 cursor-pointer rounded-md hover:bg-slate-50 p-2"
                        >
                          <Checkbox
                            checked={selectedCategories.includes(cat.slug)}
                            onCheckedChange={() => toggleCategory(cat.slug)}
                          />
                          <span className="text-sm text-slate-700">{cat.name}</span>
                        </label>
                      ))}
                    </div>
                    {selectedCategories.map((slug) => (
                      <input
                        key={slug}
                        type="hidden"
                        name="categories"
                        value={slug}
                      />
                    ))}
                    {selectedCategories.length === 0 && (
                      <p className="text-xs text-amber-600">
                        Wybierz co najmniej jedną kategorię.
                      </p>
                    )}
                  </div>
                )}

                {/* Hasło + Potwierdź hasło */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-900">
                      Hasło *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Co najmniej 6 znaków"
                        className="pl-10 pr-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-900">
                      Potwierdź hasło *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Powtórz hasło"
                        className="pl-10 pr-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Akceptuję regulamin */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="acceptTerms"
                    checked={acceptTerms}
                    onCheckedChange={(v) => setAcceptTerms(v === true)}
                  />
                  <label
                    htmlFor="acceptTerms"
                    className="text-sm text-slate-600 cursor-pointer leading-tight"
                  >
                    Akceptuję{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      regulamin
                    </Link>{' '}
                    i{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      politykę prywatności
                    </Link>
                    .
                  </label>
                </div>
                <input
                  type="hidden"
                  name="acceptTerms"
                  value={acceptTerms ? '1' : '0'}
                />

                <Button
                  type="submit"
                  disabled={submitDisabled || isPending}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 group disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Rejestracja...
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-5 w-5" />
                      Zarejestruj się
                    </>
                  )}
                </Button>
              </form>

              {/* Budowanie zaufania */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                {selectedUserType === 'manager' && (
                  <p className="text-sm text-slate-600">
                    Twoje dane są bezpieczne i służą jedynie do kontaktu z wybranymi wykonawcami.
                  </p>
                )}
                {selectedUserType === 'contractor' && (
                  <p className="text-sm text-slate-600">
                    Po rejestracji przejdziesz proces weryfikacji, aby otrzymać odznakę
                    Zweryfikowany Wykonawca.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <span className="text-slate-600">Masz już konto? </span>
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              Zaloguj się
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
