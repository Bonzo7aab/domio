'use client'

import React, { useState, useEffect } from 'react';
import { Building, Edit2, X, Check, Plus, MapPin, Mail, Phone, Globe, FileText, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import type { AuthUser } from '../types/auth';
import { createClient } from '../lib/supabase/client';
import { fetchUserPrimaryCompany, upsertUserCompany, type CompanyData } from '../lib/database/companies';

interface CompanyManagementFormProps {
  user: AuthUser;
}

const COMPANY_TYPES = [
  { value: 'wspólnota', label: 'Wspólnota Mieszkaniowa' },
  { value: 'spółdzielnia', label: 'Spółdzielnia Mieszkaniowa' },
  { value: 'property_management', label: 'Zarząd Nieruchomości' },
  { value: 'condo_management', label: 'Zarząd Wspólnoty' },
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

  const [companyData, setCompanyData] = useState({
    name: '',
    type: user.userType === 'manager' ? 'wspólnota' : 'contractor',
    phone: '',
    email: '',
    address: '',
    city: '',
    postal_code: '',
    nip: '',
    description: '',
  });

  const [originalCompanyData, setOriginalCompanyData] = useState(companyData);

  // Fetch existing company on mount
  useEffect(() => {
    async function loadCompany() {
      setIsFetchingCompany(true);
      try {
        const supabase = createClient();
        const { data: company, error: fetchError } = await fetchUserPrimaryCompany(supabase, user.id);

        if (fetchError) {
          console.error('Error fetching company:', fetchError);
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
            description: company.description || '',
          };
          setCompanyData(fetchedData);
          setOriginalCompanyData(fetchedData);
          setHasCompany(true);
        }
      } catch (err) {
        console.error('Error loading company:', err);
      } finally {
        setIsFetchingCompany(false);
      }
    }

    loadCompany();
  }, [user.id, user.userType]);

  const handleCompanyChange = (field: string, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveCompany = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!companyData.name.trim()) {
      setError('Nazwa firmy jest wymagana');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: savedCompany, error: saveError } = await upsertUserCompany(
        supabase,
        user.id,
        companyData
      );

      if (saveError) {
        setError(saveError.message || 'Wystąpił błąd podczas zapisywania');
      } else {
        setSuccess('Dane firmy zostały zapisane pomyślnie');
        setOriginalCompanyData(companyData);
        setHasCompany(true);
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error saving company:', err);
      setError('Wystąpił błąd podczas zapisywania');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCompanyData(originalCompanyData);
    setIsEditing(false);
    setError('');
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
      {(error || success) && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      {/* Company Information Section */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Informacje o firmie</h4>
            {hasCompany && (
              <Badge variant="outline" className="text-xs">
                Aktywna
              </Badge>
            )}
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
              Kliknij "Dodaj firmę" aby uzupełnić dane swojej organizacji
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="companyName">Nazwa firmy/organizacji *</Label>
                  {isEditing ? (
                    <Input
                      id="companyName"
                      value={companyData.name}
                      onChange={(e) => handleCompanyChange('name', e.target.value)}
                      placeholder="np. Wspólnota Mieszkaniowa XYZ"
                      required
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md font-medium">
                      {companyData.name || '—'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyType">Typ organizacji *</Label>
                  {isEditing ? (
                    <Select 
                      value={companyData.type} 
                      onValueChange={(value) => handleCompanyChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {COMPANY_TYPES.find(t => t.value === companyData.type)?.label || companyData.type || '—'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyNip">NIP</Label>
                  {isEditing ? (
                    <Input
                      id="companyNip"
                      value={companyData.nip}
                      onChange={(e) => handleCompanyChange('nip', e.target.value)}
                      placeholder="123-456-78-90"
                    />
                  ) : (
                    <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className="text-sm">{companyData.nip || 'Nie podano'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Telefon</Label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyPhone"
                        value={companyData.phone}
                        onChange={(e) => handleCompanyChange('phone', e.target.value)}
                        className="pl-10"
                        placeholder="+48 000 000 000"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className="text-sm">{companyData.phone || 'Nie podano'}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email</Label>
                  {isEditing ? (
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyData.email}
                        onChange={(e) => handleCompanyChange('email', e.target.value)}
                        className="pl-10"
                        placeholder="kontakt@firma.pl"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className="text-sm">{companyData.email || 'Nie podano'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="companyAddress">Adres</Label>
                  {isEditing ? (
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyAddress"
                        value={companyData.address}
                        onChange={(e) => handleCompanyChange('address', e.target.value)}
                        className="pl-10"
                        placeholder="ul. Przykładowa 123"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className="text-sm">{companyData.address || 'Nie podano'}</p>
                    </div>
                  )}
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="companyCity">Miasto</Label>
                  {isEditing ? (
                    <Input
                      id="companyCity"
                      value={companyData.city}
                      onChange={(e) => handleCompanyChange('city', e.target.value)}
                      placeholder="Warszawa"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {companyData.city || 'Nie podano'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyPostalCode">Kod pocztowy</Label>
                  {isEditing ? (
                    <Input
                      id="companyPostalCode"
                      value={companyData.postal_code}
                      onChange={(e) => handleCompanyChange('postal_code', e.target.value)}
                      placeholder="00-000"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
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
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md min-h-[80px]">
                    {companyData.description || 'Brak opisu'}
                  </p>
                )}
              </div>
            </div>

            {!isEditing && hasCompany && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Wskazówka:</strong> Kompletny profil firmy zwiększa zaufanie i pomaga w zdobywaniu zleceń.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

