'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Phone, Edit2, X, Check, Building2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { updateUserAction } from '../lib/auth/actions';
import { createClient } from '../lib/supabase/client';
import { fetchUserPrimaryCompany, upsertUserCompany, type CompanyData } from '../lib/database/companies';
import type { AuthUser } from '../types/auth';
import { ContractorFinanceSettings } from './ContractorFinanceSettings';
import { ContractorServiceAreaSettings } from './ContractorServiceAreaSettings';
import { GusNipStatusHint } from './gus/GusNipStatusHint';
import { useGusNipLookup } from '../lib/gus/use-gus-nip-lookup';
import type { CompanyLookupResult } from '../lib/gus/types';

interface ProfileFormProps {
  user: AuthUser;
  /** When true (e.g. contractor „Dane wykonawcy” tab), show editable company name and NIP under personal data. */
  includeBusinessData?: boolean;
}

export function ProfileForm({ user, includeBusinessData }: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Separate editing states for each section
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);

  const isContractorBusinessBlock = Boolean(includeBusinessData && user.userType === 'contractor');
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(false);
  const [companySnapshot, setCompanySnapshot] = useState<CompanyData | null>(null);
  const [businessCompanyName, setBusinessCompanyName] = useState('');
  const [businessNip, setBusinessNip] = useState('');
  const [businessRegon, setBusinessRegon] = useState('');
  const [businessKrs, setBusinessKrs] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessCity, setBusinessCity] = useState('');
  const [businessPostalCode, setBusinessPostalCode] = useState('');

  const applyGusCompanyData = useCallback((data: CompanyLookupResult) => {
    setBusinessCompanyName(data.name);
    setBusinessRegon(data.regon);
    if (data.address) {
      setBusinessAddress(data.address);
    }
    if (data.city) {
      setBusinessCity(data.city);
    }
    if (data.postalCode) {
      setBusinessPostalCode(data.postalCode);
    }
  }, []);

  const clearGusDerivedBusinessFields = useCallback(() => {
    setBusinessRegon('');
    setBusinessAddress('');
    setBusinessCity('');
    setBusinessPostalCode('');
  }, []);

  const gusLookup = useGusNipLookup({
    enabled: isContractorBusinessBlock && isEditingBusiness,
    nip: businessNip,
    onApply: applyGusCompanyData,
    onClearDerived: clearGusDerivedBusinessFields,
  });

  const [profileData, setProfileData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const loadPrimaryCompany = useCallback(async () => {
    if (!isContractorBusinessBlock) return;
    setIsLoadingBusiness(true);
    try {
      const supabase = createClient();
      const { data, error } = await fetchUserPrimaryCompany(supabase, user.id);
      if (error || !data) {
        setCompanySnapshot(null);
        setBusinessCompanyName('');
        setBusinessNip('');
        setBusinessRegon('');
        setBusinessKrs('');
        setBusinessAddress('');
        setBusinessCity('');
        setBusinessPostalCode('');
        return;
      }
      setCompanySnapshot(data);
      setBusinessCompanyName(data.name || '');
      setBusinessNip((data.nip || '').trim());
      setBusinessRegon((data.regon || '').trim());
      setBusinessKrs((data.krs || '').trim());
      setBusinessAddress(data.address || '');
      setBusinessCity(data.city || '');
      setBusinessPostalCode(data.postal_code || '');
    } finally {
      setIsLoadingBusiness(false);
    }
  }, [isContractorBusinessBlock, user.id]);

  useEffect(() => {
    if (!isContractorBusinessBlock) {
      setCompanySnapshot(null);
      setBusinessCompanyName('');
      setBusinessNip('');
      setBusinessRegon('');
      setBusinessKrs('');
      setBusinessAddress('');
      setBusinessCity('');
      setBusinessPostalCode('');
      setIsEditingBusiness(false);
      return;
    }
    void loadPrimaryCompany();
  }, [isContractorBusinessBlock, loadPrimaryCompany]);

  const handleSavePersonal = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!profileData.firstName || !profileData.lastName) {
      setError('Imię i nazwisko są wymagane');
      setIsLoading(false);
      return;
    }

    try {
      const result = await updateUserAction({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone || null,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Dane osobowe zostały zaktualizowane');
        setIsEditingPersonal(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Wystąpił błąd podczas aktualizacji');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveContact = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const result = await updateUserAction({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone || null,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Dane kontaktowe zostały zaktualizowane');
        setIsEditingContact(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Wystąpił błąd podczas aktualizacji');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!isContractorBusinessBlock) return;
    setError('');
    setSuccess('');
    const trimmedName = businessCompanyName.trim();
    const trimmedNip = businessNip.trim();
    const trimmedRegon = businessRegon.trim();
    const trimmedKrs = businessKrs.trim();
    if (!trimmedName || !trimmedNip) {
      setError('Nazwa firmy i NIP są wymagane');
      return;
    }
    setIsLoading(true);
    try {
      const supabase = createClient();
      const snap = companySnapshot;
      const isPublic =
        snap &&
        'is_public' in snap &&
        typeof (snap as { is_public?: unknown }).is_public === 'boolean'
          ? (snap as { is_public: boolean }).is_public
          : true;

      const payload = snap
        ? {
            name: trimmedName,
            type: snap.type,
            nip: trimmedNip,
            phone: snap.phone || user.phone || '',
            email: snap.email || user.email || '',
            address: businessAddress.trim() || snap.address || '',
            city: businessCity.trim() || snap.city || '',
            postal_code: businessPostalCode.trim() || snap.postal_code || '',
            regon: trimmedRegon,
            krs: trimmedKrs,
            website: snap.website || '',
            founded_year: snap.founded_year ?? undefined,
            employee_count: snap.employee_count || '',
            description: snap.description || '',
            is_public: isPublic,
          }
        : {
            name: trimmedName,
            type: 'contractor',
            nip: trimmedNip,
            regon: trimmedRegon,
            krs: trimmedKrs,
            phone: user.phone?.trim() || undefined,
            email: user.email?.trim() || undefined,
            address: businessAddress.trim() || undefined,
            city: businessCity.trim() || undefined,
            postal_code: businessPostalCode.trim() || undefined,
          };

      const { data: saved, error: upError } = await upsertUserCompany(supabase, user.id, payload);
      if (upError || !saved) {
        const message =
          typeof upError === 'object' && upError !== null && 'message' in upError
            ? String((upError as { message?: string }).message)
            : 'Nie udało się zapisać danych firmy';
        setError(message);
        return;
      }
      setCompanySnapshot(saved);
      setBusinessCompanyName(saved.name || '');
      setBusinessNip((saved.nip || '').trim());
      setBusinessRegon((saved.regon || '').trim());
      setBusinessKrs((saved.krs || '').trim());
      setBusinessAddress(saved.address || '');
      setBusinessCity(saved.city || '');
      setBusinessPostalCode(saved.postal_code || '');
      setSuccess('Dane biznesowe zostały zaktualizowane');
      setIsEditingBusiness(false);
      gusLookup.resetLookupState();
      setTimeout(() => setSuccess(''), 3000);
      router.refresh();
    } catch {
      setError('Wystąpił błąd podczas aktualizacji danych firmy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBusiness = () => {
    if (companySnapshot) {
      setBusinessCompanyName(companySnapshot.name || '');
      setBusinessNip((companySnapshot.nip || '').trim());
      setBusinessRegon((companySnapshot.regon || '').trim());
      setBusinessKrs((companySnapshot.krs || '').trim());
      setBusinessAddress(companySnapshot.address || '');
      setBusinessCity(companySnapshot.city || '');
      setBusinessPostalCode(companySnapshot.postal_code || '');
    } else {
      setBusinessCompanyName('');
      setBusinessNip('');
      setBusinessRegon('');
      setBusinessKrs('');
      setBusinessAddress('');
      setBusinessCity('');
      setBusinessPostalCode('');
    }
    gusLookup.resetLookupState();
    setIsEditingBusiness(false);
    setError('');
  };

  const handleCancelPersonal = () => {
    setProfileData(prev => ({
      ...prev,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    }));
    setIsEditingPersonal(false);
    setError('');
  };

  const handleCancelContact = () => {
    setProfileData(prev => ({
      ...prev,
      email: user.email || '',
      phone: user.phone || '',
    }));
    setIsEditingContact(false);
    setError('');
  };


  return (
    <div className="space-y-4">
      {(error || success) && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      {/* Personal Information Section */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Dane osobowe</h4>
          {!isEditingPersonal ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditingPersonal(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edytuj
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancelPersonal}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Anuluj
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleSavePersonal}
                disabled={isLoading}
              >
                <Check className="h-4 w-4 mr-2" />
                {isLoading ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Imię *</Label>
            {isEditingPersonal ? (
              <Input
                id="firstName"
                name="firstName"
                value={profileData.firstName}
                onChange={handleProfileChange}
                required
              />
            ) : (
              <p className="text-sm py-2 px-3 bg-muted rounded-md">{profileData.firstName || '—'}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nazwisko *</Label>
            {isEditingPersonal ? (
              <Input
                id="lastName"
                name="lastName"
                value={profileData.lastName}
                onChange={handleProfileChange}
                required
              />
            ) : (
              <p className="text-sm py-2 px-3 bg-muted rounded-md">{profileData.lastName || '—'}</p>
            )}
          </div>
        </div>
      </div>

      {isContractorBusinessBlock ? (
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
              Dane biznesowe
            </h4>
            {isLoadingBusiness ? (
              <span className="text-xs text-muted-foreground">Ładowanie…</span>
            ) : !isEditingBusiness ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditingBusiness(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edytuj
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelBusiness} disabled={isLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Anuluj
                </Button>
                <Button variant="default" size="sm" onClick={handleSaveBusiness} disabled={isLoading}>
                  <Check className="h-4 w-4 mr-2" />
                  {isLoading ? 'Zapisywanie...' : 'Zapisz'}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessCompanyName">Nazwa firmy *</Label>
              {isEditingBusiness ? (
                <Input
                  id="businessCompanyName"
                  value={businessCompanyName}
                  onChange={(e) => setBusinessCompanyName(e.target.value)}
                  autoComplete="organization"
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">{businessCompanyName || '—'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessNip">NIP *</Label>
              {isEditingBusiness ? (
                <>
                  <div className="relative">
                    <Input
                      id="businessNip"
                      value={businessNip}
                      onChange={e =>
                        gusLookup.handleNipChange(e.target.value, setBusinessNip)
                      }
                      onBlur={gusLookup.handleNipBlur}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="np. 1234567890"
                    />
                    {gusLookup.isLoading ? (
                      <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    ) : null}
                  </div>
                  <GusNipStatusHint
                    status={gusLookup.status}
                    validationError={gusLookup.validationError}
                    message={gusLookup.message}
                  />
                </>
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">{businessNip || '—'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessRegon">REGON</Label>
              {isEditingBusiness ? (
                <Input
                  id="businessRegon"
                  value={businessRegon}
                  onChange={(e) => setBusinessRegon(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">{businessRegon || '—'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessKrs">KRS</Label>
              {isEditingBusiness ? (
                <Input
                  id="businessKrs"
                  value={businessKrs}
                  onChange={(e) => setBusinessKrs(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">{businessKrs || '—'}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isContractorBusinessBlock ? <ContractorFinanceSettings userId={user.id} /> : null}

      {/* Contact Information Section */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Dane kontaktowe</h4>
          {!isEditingContact ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditingContact(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edytuj
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancelContact}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Anuluj
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleSaveContact}
                disabled={isLoading}
              >
                <Check className="h-4 w-4 mr-2" />
                {isLoading ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adres email *</Label>
            {isEditingContact ? (
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="pl-10"
                  required
                  disabled
                />
              </div>
            ) : (
              <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="text-sm">{profileData.email || '—'}</p>
              </div>
            )}
            {isEditingContact && (
              <p className="text-xs text-muted-foreground">Email nie może być zmieniony</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            {isEditingContact ? (
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="pl-10"
                  placeholder="+48 000 000 000"
                />
              </div>
            ) : (
              <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="text-sm">{profileData.phone || 'Nie podano'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isContractorBusinessBlock ? <ContractorServiceAreaSettings userId={user.id} /> : null}

    </div>
  );
}

