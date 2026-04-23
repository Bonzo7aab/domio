'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Building, Edit2, X, Check, Plus, MapPin, Mail, Phone, Globe, FileText, Loader2, AlertCircle, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import type { AuthUser } from '../types/auth';
import { createClient } from '../lib/supabase/client';
import { fetchUserPrimaryCompany, upsertUserCompany } from '../lib/database/companies';
import { BuildingManagement } from './BuildingManagement';
import { cn } from './ui/utils';

interface CompanyManagementFormProps {
  user: AuthUser;
}

const MANAGER_COMPANY_TYPES = [
  { value: 'wspólnota', label: 'Wspólnota Mieszkaniowa' },
  { value: 'spółdzielnia', label: 'Spółdzielnia Mieszkaniowa' },
  { value: 'property_management', label: 'Zarząd Nieruchomości' },
  { value: 'condo_management', label: 'Zarząd Wspólnoty' },
  { value: 'housing_association', label: 'Stowarzyszenie Mieszkaniowe' },
  { value: 'cooperative', label: 'Spółdzielnia' },
];

const CONTRACTOR_COMPANY_TYPES = [
  { value: 'contractor', label: 'Firma Wykonawcza' },
  { value: 'construction_company', label: 'Firma Budowlana' },
  { value: 'service_provider', label: 'Usługodawca' },
];

export function CompanyManagementForm({ user }: CompanyManagementFormProps) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFetchingCompany, setIsFetchingCompany] = useState(true);
  const [hasCompany, setHasCompany] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  // Priority 3: Prevent concurrent fetches
  const isFetchingRef = useRef(false);
  const isMounted = useRef(true);

  const [companyData, setCompanyData] = useState({
    name: '',
    type: user.userType === 'manager' ? 'wspólnota' : 'contractor',
    phone: '',
    email: '',
    address: '',
    city: '',
    postal_code: '',
    nip: '',
    regon: '',
    krs: '',
    website: '',
    founded_year: null as number | null,
    employee_count: '',
    description: '',
    is_public: true, // Default to public profile
  });

  const [originalCompanyData, setOriginalCompanyData] = useState(companyData);

  // Fetch existing company on mount and when user changes
  const loadCompany = useCallback(async () => {
    // Priority 3: Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    setIsFetchingCompany(true);
    try {
      const supabase = createClient();
      const { data: company, error: fetchError } = await fetchUserPrimaryCompany(supabase, user.id);

      if (!isMounted.current) return;

      if (fetchError) {
        setHasCompany(false);
        setCompanyId(null);
      } else if (company) {
        const fetchedData = {
          name: company.name || '',
          type: company.type || (user.userType === 'manager' ? 'wspólnota' : 'contractor'),
          phone: company.phone || '',
          email: company.email || '',
          address: company.address || '',
          city: company.city || '',
          postal_code: company.postal_code || '',
          nip: company.nip || '',
          regon: company.regon || '',
          krs: company.krs || '',
          website: company.website || '',
          founded_year: company.founded_year || null,
          employee_count: company.employee_count || '',
          description: company.description || '',
          is_public: ('is_public' in company && company.is_public !== undefined) ? company.is_public as boolean : true, // Default to true if not set
        };
        setCompanyData(fetchedData);
        setOriginalCompanyData(fetchedData);
        setHasCompany(true);
        setCompanyId(company.id);
      } else {
        // No company found - reset state
        setHasCompany(false);
        setCompanyId(null);
      }
    } catch {
      if (isMounted.current) {
        setHasCompany(false);
        setCompanyId(null);
      }
    } finally {
      if (isMounted.current) {
        setIsFetchingCompany(false);
      }
      // Priority 3: Reset fetch flag
      isFetchingRef.current = false;
    }
  }, [user.id, user.userType]);

  useEffect(() => {
    isMounted.current = true;
    loadCompany();

    // Cleanup function
    return () => {
      isMounted.current = false;
      isFetchingRef.current = false;
    };
  }, [loadCompany]);

  const handleCompanyChange = (field: string, value: string | number | boolean | null) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
    // Clear general error when user makes changes
    if (error) {
      setError('');
    }
  };

  const handleSaveCompany = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validate all required fields (all except description)
    const errors: Record<string, boolean> = {};
    let hasErrors = false;
    
    if (!companyData.name.trim()) {
      errors.name = true;
      hasErrors = true;
    } else {
      errors.name = false;
    }
    
    if (!companyData.type) {
      errors.type = true;
      hasErrors = true;
    } else {
      errors.type = false;
    }

    if (!companyData.nip.trim()) {
      errors.nip = true;
      hasErrors = true;
    } else {
      errors.nip = false;
    }

    if (!companyData.phone.trim()) {
      errors.phone = true;
      hasErrors = true;
    } else {
      errors.phone = false;
    }

    if (!companyData.email.trim()) {
      errors.email = true;
      hasErrors = true;
    } else {
      errors.email = false;
    }

    if (!companyData.address.trim()) {
      errors.address = true;
      hasErrors = true;
    } else {
      errors.address = false;
    }

    if (!companyData.city.trim()) {
      errors.city = true;
      hasErrors = true;
    } else {
      errors.city = false;
    }

    if (!companyData.postal_code.trim()) {
      errors.postal_code = true;
      hasErrors = true;
    } else {
      errors.postal_code = false;
    }

    setFieldErrors(errors);

    if (hasErrors) {
      setError('Proszę wypełnić wszystkie wymagane pola');
      setIsLoading(false);
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Clear field errors if validation passes
    setFieldErrors({});

    try {
      const supabase = createClient();
      const { error: saveError } = await upsertUserCompany(
        supabase,
        user.id,
        {
          name: companyData.name,
          type: companyData.type,
          phone: companyData.phone,
          email: companyData.email,
          address: companyData.address,
          city: companyData.city,
          postal_code: companyData.postal_code,
          nip: companyData.nip,
          regon: companyData.regon || undefined,
          krs: companyData.krs || undefined,
          website: companyData.website || undefined,
          founded_year: companyData.founded_year || undefined,
          employee_count: companyData.employee_count || undefined,
          description: companyData.description,
          is_public: companyData.is_public,
        }
      );

      if (saveError) {
        const errorMessage = saveError instanceof Error 
          ? saveError.message 
          : (saveError as { message?: string; details?: string; hint?: string })?.message || (saveError as { message?: string; details?: string; hint?: string })?.details || (saveError as { message?: string; details?: string; hint?: string })?.hint || 'Wystąpił błąd podczas zapisywania';
        setError(errorMessage);
      } else {
        setSuccess('Dane firmy zostały zapisane pomyślnie');
        setIsEditing(false);
        // Refetch company data from database to ensure we have the latest data
        await loadCompany();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Wystąpił błąd podczas zapisywania');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCompanyData(originalCompanyData);
    setIsEditing(false);
    setError('');
    setFieldErrors({});
  };

  // Check which required and optional fields are missing (null/empty from DB or cleared in form)
  const getMissingFields = (): string[] => {
    const missingFields: string[] = [];
    const fieldLabels: Record<string, string> = {
      // Required fields
      name: 'Nazwa firmy',
      type: 'Typ organizacji',
      nip: 'NIP',
      phone: 'Telefon',
      email: 'Email',
      address: 'Adres',
      city: 'Miasto',
      postal_code: 'Kod pocztowy',
      // Optional fields (shown when empty to encourage completion)
      regon: 'REGON',
      krs: 'KRS',
      website: 'Strona internetowa',
      founded_year: 'Rok założenia',
      employee_count: 'Liczba pracowników',
      description: 'Opis firmy'
    };

    // Helper to check if a field is truly empty (null, undefined, empty string "", or whitespace-only string)
    const isEmpty = (value: string | number | null | undefined): boolean => {
      // Check for null or undefined
      if (value === null || value === undefined) return true;
      // Check for empty string ""
      if (value === '') return true;
      // Check for whitespace-only strings
      if (typeof value === 'string' && value.trim() === '') return true;
      return false;
    };

    // Check each required field - a field is missing if it's null, undefined, empty string "", or whitespace-only
    if (isEmpty(companyData.name)) missingFields.push(fieldLabels.name);
    if (isEmpty(companyData.type)) missingFields.push(fieldLabels.type);
    if (isEmpty(companyData.nip)) missingFields.push(fieldLabels.nip);
    if (isEmpty(companyData.phone)) missingFields.push(fieldLabels.phone);
    if (isEmpty(companyData.email)) missingFields.push(fieldLabels.email);
    if (isEmpty(companyData.address)) missingFields.push(fieldLabels.address);
    if (isEmpty(companyData.city)) missingFields.push(fieldLabels.city);
    if (isEmpty(companyData.postal_code)) missingFields.push(fieldLabels.postal_code);

    // Check optional fields (only for contractors)
    if (user.userType === 'contractor') {
      if (isEmpty(companyData.regon)) missingFields.push(fieldLabels.regon);
      if (isEmpty(companyData.krs)) missingFields.push(fieldLabels.krs);
      if (isEmpty(companyData.website)) missingFields.push(fieldLabels.website);
      if (isEmpty(companyData.founded_year)) missingFields.push(fieldLabels.founded_year);
      if (isEmpty(companyData.employee_count)) missingFields.push(fieldLabels.employee_count);
      if (isEmpty(companyData.description)) missingFields.push(fieldLabels.description);
    }

    return missingFields;
  };

  if (isFetchingCompany) {
    return (
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="ml-2 text-sm text-muted-foreground">Ładowanie danych firmy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert 
          variant="destructive" 
          className="border-red-500 bg-red-50 dark:bg-red-950/20 shadow-md animate-in slide-in-from-top-2"
        >
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
            {error}
          </AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <Check className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Company Information Section */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Informacje o firmie</h4>
          </div>
          {!isEditing ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              {hasCompany ? (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edytuj
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj firmę
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Anuluj
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleSaveCompany}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Zapisz
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {!isEditing && !hasCompany ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Nie masz jeszcze dodanej firmy
            </p>
            <p className="text-xs text-muted-foreground">
              Kliknij &quot;Dodaj firmę&quot; aby uzupełnić dane swojej organizacji
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="companyName" className={fieldErrors.name ? 'text-red-600 dark:text-red-400' : ''}>
                    Nazwa firmy/organizacji *
                  </Label>
                  {isEditing ? (
                    <Input
                      id="companyName"
                      value={companyData.name}
                      onChange={(e) => handleCompanyChange('name', e.target.value)}
                      placeholder="np. Wspólnota Mieszkaniowa XYZ"
                      required
                      className={`placeholder:text-muted-foreground/60 ${fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                  ) : (
                    <p className={`text-sm py-2 px-3 bg-muted rounded-md font-medium ${!companyData.name ? 'text-muted-foreground/60' : ''}`}>
                      {companyData.name || '—'}
                    </p>
                  )}
                  {fieldErrors.name && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      To pole jest wymagane
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyType" className={fieldErrors.type ? 'text-red-600 dark:text-red-400' : ''}>
                    Typ organizacji *
                  </Label>
                  {isEditing ? (
                    <>
                      <Select 
                        value={companyData.type} 
                        onValueChange={(value) => handleCompanyChange('type', value)}
                      >
                        <SelectTrigger className={fieldErrors.type ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}>
                          <SelectValue placeholder="Wybierz typ organizacji" />
                        </SelectTrigger>
                        <SelectContent>
                          {(user.userType === 'manager' ? MANAGER_COMPANY_TYPES : CONTRACTOR_COMPANY_TYPES).map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.type && (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          To pole jest wymagane
                        </p>
                      )}
                    </>
                  ) : (
                    <p className={`text-sm py-2 px-3 bg-muted rounded-md ${!companyData.type ? 'text-muted-foreground/60' : ''}`}>
                      {[...MANAGER_COMPANY_TYPES, ...CONTRACTOR_COMPANY_TYPES].find(t => t.value === companyData.type)?.label || companyData.type || '—'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyNip" className={fieldErrors.nip ? 'text-red-600 dark:text-red-400' : ''}>
                    NIP *
                  </Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="companyNip"
                        value={companyData.nip}
                        onChange={(e) => handleCompanyChange('nip', e.target.value)}
                        placeholder="1234567890"
                        type="number"
                        required
                        className={cn(fieldErrors.nip ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', 'placeholder:text-muted-foreground/60 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none')}
                      />
                      {fieldErrors.nip && (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          To pole jest wymagane
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className={`text-sm ${!companyData.nip ? 'text-muted-foreground/60' : ''}`}>{companyData.nip || 'Nie podano'}</p>
                    </div>
                  )}
                </div>

                {user.userType === 'contractor' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="companyRegon">REGON</Label>
                      {isEditing ? (
                        <Input
                          id="companyRegon"
                          value={companyData.regon}
                          onChange={(e) => handleCompanyChange('regon', e.target.value)}
                          placeholder="123456789"
                          type="number"
                          className="placeholder:text-muted-foreground/60 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      ) : (
                        <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          <p className={`text-sm ${!companyData.regon ? 'text-muted-foreground/60' : ''}`}>{companyData.regon || 'Nie podano'}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyKrs">KRS (opcjonalnie)</Label>
                      {isEditing ? (
                          <Input
                            id="companyKrs"
                            value={companyData.krs}
                            onChange={(e) => handleCompanyChange('krs', e.target.value)}
                            placeholder="0000123456"
                            type="number"
                            className="placeholder:text-muted-foreground/60 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                      ) : (
                        <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          <p className={`text-sm ${!companyData.krs ? 'text-muted-foreground/60' : ''}`}>{companyData.krs || 'Nie podano'}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Additional Business Info for Contractors */}
              {user.userType === 'contractor' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyFoundedYear">Rok założenia</Label>
                    {isEditing ? (
                      <Input
                        id="companyFoundedYear"
                        type="number"
                        value={companyData.founded_year || ''}
                        onChange={(e) => handleCompanyChange('founded_year', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="2020"
                        min="1900"
                        max={new Date().getFullYear()}
                        className="placeholder:text-muted-foreground/60 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    ) : (
                      <p className={`text-sm py-2 px-3 bg-muted rounded-md ${!companyData.founded_year ? 'text-muted-foreground/60' : ''}`}>
                        {companyData.founded_year || 'Nie podano'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyEmployeeCount">Liczba pracowników</Label>
                    {isEditing ? (
                      <Select 
                        value={companyData.employee_count} 
                        onValueChange={(value) => handleCompanyChange('employee_count', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz zakres" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-5">1-5</SelectItem>
                          <SelectItem value="6-10">6-10</SelectItem>
                          <SelectItem value="11-20">11-20</SelectItem>
                          <SelectItem value="21-50">21-50</SelectItem>
                          <SelectItem value="51-100">51-100</SelectItem>
                          <SelectItem value="100+">100+</SelectItem>
                        </SelectContent>
                      </Select>
                      ) : (
                        <p className={`text-sm py-2 px-3 bg-muted rounded-md ${!companyData.employee_count ? 'text-muted-foreground/60' : ''}`}>
                          {companyData.employee_count || 'Nie podano'}
                        </p>
                      )}
                  </div>
                </div>
              )}

              {/* Contact Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyPhone" className={fieldErrors.phone ? 'text-red-600 dark:text-red-400' : ''}>
                    Telefon *
                  </Label>
                  {isEditing ? (
                    <>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="companyPhone"
                          value={companyData.phone}
                          onChange={(e) => handleCompanyChange('phone', e.target.value)}
                          className={`pl-10 placeholder:text-muted-foreground/60 ${fieldErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          placeholder="+48 000 000 000"
                          type="tel"
                          required
                        />
                      </div>
                      {fieldErrors.phone && (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          To pole jest wymagane
                        </p>
                      )}
                    </>
                    ) : (
                      <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p className={`text-sm ${!companyData.phone ? 'text-muted-foreground/60' : ''}`}>{companyData.phone || 'Nie podano'}</p>
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyEmail" className={fieldErrors.email ? 'text-red-600 dark:text-red-400' : ''}>
                    Email *
                  </Label>
                  {isEditing ? (
                    <>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="companyEmail"
                          type="email"
                          value={companyData.email}
                          onChange={(e) => handleCompanyChange('email', e.target.value)}
                          className={`pl-10 placeholder:text-muted-foreground/60 ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          placeholder="kontakt@firma.pl"
                          required
                        />
                      </div>
                      {fieldErrors.email && (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          To pole jest wymagane
                        </p>
                      )}
                    </>
                    ) : (
                      <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p className={`text-sm ${!companyData.email ? 'text-muted-foreground/60' : ''}`}>{companyData.email || 'Nie podano'}</p>
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Strona internetowa</Label>
                  {isEditing ? (
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyWebsite"
                        type="url"
                        value={companyData.website}
                        onChange={(e) => handleCompanyChange('website', e.target.value)}
                        className="pl-10 placeholder:text-muted-foreground/60"
                        placeholder="https://www.example.pl"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                      <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className={`text-sm ${!companyData.website ? 'text-muted-foreground/60' : ''}`}>{companyData.website || 'Nie podano'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="companyAddress" className={fieldErrors.address ? 'text-red-600 dark:text-red-400' : ''}>
                    Adres *
                  </Label>
                  {isEditing ? (
                    <>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="companyAddress"
                          value={companyData.address}
                          onChange={(e) => handleCompanyChange('address', e.target.value)}
                          className={`pl-10 placeholder:text-muted-foreground/60 ${fieldErrors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          placeholder="ul. Przykładowa 123"
                          required
                        />
                      </div>
                      {fieldErrors.address && (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          To pole jest wymagane
                        </p>
                      )}
                    </>
                    ) : (
                      <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p className={`text-sm ${!companyData.address ? 'text-muted-foreground/60' : ''}`}>{companyData.address || 'Nie podano'}</p>
                      </div>
                    )}
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="companyCity" className={fieldErrors.city ? 'text-red-600 dark:text-red-400' : ''}>
                    Miasto *
                  </Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="companyCity"
                        value={companyData.city}
                        onChange={(e) => handleCompanyChange('city', e.target.value)}
                        placeholder="Warszawa"
                        required
                        className={`placeholder:text-muted-foreground/60 ${fieldErrors.city ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {fieldErrors.city && (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          To pole jest wymagane
                        </p>
                      )}
                    </>
                    ) : (
                      <p className={`text-sm py-2 px-3 bg-muted rounded-md ${!companyData.city ? 'text-muted-foreground/60' : ''}`}>
                        {companyData.city || 'Nie podano'}
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyPostalCode" className={fieldErrors.postal_code ? 'text-red-600 dark:text-red-400' : ''}>
                    Kod pocztowy *
                  </Label>
                  {isEditing ? (
                    <>
                        <Input
                          id="companyPostalCode"
                          value={companyData.postal_code}
                          onChange={(e) => handleCompanyChange('postal_code', e.target.value)}
                          placeholder="00-999"
                          type="text"
                          inputMode="text"
                          autoComplete="postal-code"
                          maxLength={10}
                          required
                          className={cn(fieldErrors.postal_code ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '', 'placeholder:text-muted-foreground/60')}
                        />
                      {fieldErrors.postal_code && (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          To pole jest wymagane
                        </p>
                      )}
                    </>
                    ) : (
                      <p className={`text-sm py-2 px-3 bg-muted rounded-md ${!companyData.postal_code ? 'text-muted-foreground/60' : ''}`}>
                        {companyData.postal_code || 'Nie podano'}
                      </p>
                    )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="companyDescription">Opis firmy</Label>
                {isEditing ? (
                  <Textarea
                    id="companyDescription"
                    value={companyData.description}
                    onChange={(e) => handleCompanyChange('description', e.target.value)}
                    placeholder="Krótki opis Twojej firmy lub organizacji..."
                    rows={3}
                    className="placeholder:text-muted-foreground/60"
                  />
                  ) : (
                    <p className={`text-sm py-2 px-3 bg-muted rounded-md min-h-[80px] ${!companyData.description ? 'text-muted-foreground/60' : ''}`}>
                      {companyData.description || 'Brak opisu'}
                    </p>
                  )}
              </div>

              {/* Profile Settings */}
              {isEditing && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor="isPublic" className="font-medium cursor-pointer">
                          Profil publiczny
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Twój profil będzie widoczny dla wszystkich użytkowników i będzie wyświetlany na stronie /contractors
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="isPublic"
                      checked={companyData.is_public}
                      onCheckedChange={(checked) => handleCompanyChange('is_public', checked)}
                    />
                  </div>
                </div>
              )}

              {!isEditing && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Profil publiczny</p>
                        <p className="text-xs text-muted-foreground">
                          {companyData.is_public 
                            ? 'Twój profil jest widoczny dla wszystkich użytkowników i będzie wyświetlany na stronie /contractors' 
                            : 'Twój profil jest prywatny i nie będzie widoczny dla innych użytkowników'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={companyData.is_public ? 'default' : 'secondary'}>
                      {companyData.is_public ? 'Publiczny' : 'Prywatny'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {(hasCompany || isEditing) && (() => {
              const missingFields = getMissingFields();

              if (missingFields.length === 0) {
                return null; // Don't show anything if profile is complete
              }

              return (
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground mb-2">
                    💡 <strong>Wskazówka:</strong> Kompletny profil firmy zwiększa zaufanie i pomaga w zdobywaniu zleceń.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Brakujące pola:</strong> {missingFields.join(', ')}
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Building Management Section - Only for managers */}
      {user.userType === 'manager' && (
        <div className="mt-6">
          <Separator className="my-6" />
          {hasCompany && companyId ? (
            <BuildingManagement companyId={companyId} />
          ) : (
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Zarządzanie budynkami</h4>
              </div>
              <div className="text-center py-6">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Aby zarządzać budynkami, najpierw dodaj firmę powyżej
                </p>
                <p className="text-xs text-muted-foreground">
                  Po dodaniu firmy będziesz mógł dodawać i zarządzać budynkami
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

