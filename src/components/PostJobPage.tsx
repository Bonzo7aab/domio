"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ArrowLeft, Upload, MapPin, Calendar, FileText, Phone, Mail, Building } from 'lucide-react';
import { toast } from 'sonner';
import { useUserProfile } from '../contexts/AuthContext';
import { createClient } from '../lib/supabase/client';
import { createJob } from '../lib/database/jobs';
import { fetchUserPrimaryCompany, upsertUserCompany } from '../lib/database/companies';
import LocationAutocomplete from './LocationAutocomplete';

interface PostJobPageProps {
  onBack: () => void;
}

interface JobLocation {
  city: string;
  sublocality_level_1?: string;
}

interface JobFormData {
  title: string;
  category: string;
  subcategory: string;
  description: string;
  location: JobLocation | string; // Support both formats during transition
  address: string;
  latitude?: number;
  longitude?: number;
  sublocalityLevel1?: string;
  budget: string;
  budgetType: 'fixed' | 'hourly' | 'negotiable';
  deadline: string;
  urgency: 'low' | 'medium' | 'high';
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  organizationType: string;
  organizationName: string;
  requirements: string;
  additionalInfo: string;
}

const categories = {
  'Utrzymanie Czystości i Zieleni': [
    'Sprzątanie klatek schodowych',
    'Sprzątanie części wspólnych',
    'Utrzymanie terenów zielonych',
    'Pielęgnacja terenów zielonych',
    'Projektowanie i urządzanie terenów zielonych',
    'Odśnieżanie i zimowe utrzymanie',
    'Odśnieżanie i usuwanie lodu',
    'Wywóz śmieci',
    'Mycie okien',
    'Czyszczenie elewacji'
  ],
  'Roboty Remontowo-Budowlane': [
    'Malowanie i tynkowanie',
    'Wymiana drzwi i okien',
    'Remonty mieszkań',
    'Termomodernizacja',
    'Termomodernizacja budynków',
    'Wymiana pokryć dachowych',
    'Roboty murarskie',
    'Remonty dachów i elewacji',
    'Ogrodzenia i infrastruktura'
  ],
  'Instalacje i systemy': [
    'Instalacje elektryczne',
    'Instalacje wodno-kanalizacyjne',
    'Instalacje gazowe',
    'Systemy grzewcze',
    'Klimatyzacja i wentylacja',
    'Instalacje alarmowe',
    'Przegląd wind',
    'Modernizacja instalacji elektrycznych'
  ],
  'Utrzymanie techniczne i konserwacja': [
    'Konserwacja wind',
    'Serwis urządzeń grzewczych',
    'Konserwacja instalacji',
    'Przeglądy techniczne',
    'Naprawy bieżące',
    'Konserwacja terenów wspólnych'
  ],
  'Specjalistyczne usługi': [
    'Dezynsekcja i deratyzacja',
    'Usługi prawne',
    'Zarządzanie nieruchomościami',
    'Audyty energetyczne',
    'Geodezja',
    'Usługi księgowe',
    'Doradztwo techniczne'
  ]
};

const urgencyLevels = [
  { value: 'low', label: 'Niski', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Średni', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'Pilny', color: 'bg-red-100 text-red-800' }
];

const organizationTypes = [
  'Spółdzielnia Mieszkaniowa',
  'Wspólnota Mieszkaniowa', 
  'Zarządca Nieruchomości',
  'Deweloper',
  'Inne'
];

export default function PostJobPage({ onBack }: PostJobPageProps) {
  const { user, isAuthenticated } = useUserProfile();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    category: '',
    subcategory: '',
    description: '',
    location: { city: '' },
    address: '',
    latitude: undefined,
    longitude: undefined,
    budget: '',
    budgetType: 'fixed',
    deadline: '',
    urgency: 'medium',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    organizationType: '',
    organizationName: '',
    requirements: '',
    additionalInfo: ''
  });

  const [attachments, setAttachments] = useState<File[]>([]);

  const handleInputChange = (field: keyof JobFormData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = (location: string, address: string, lat: number, lng: number, sublocalityLevel1?: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        city: location,
        ...(sublocalityLevel1 ? { sublocality_level_1: sublocalityLevel1 } : {})
      },
      address,
      latitude: lat,
      longitude: lng,
      sublocalityLevel1: sublocalityLevel1
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication
    if (!isAuthenticated || !user) {
      toast.error('Musisz być zalogowany, aby opublikować zlecenie');
      return;
    }

    // Walidacja podstawowa
    const locationCity = typeof formData.location === 'string' 
      ? formData.location 
      : formData.location?.city;
    
    if (!formData.title || !formData.category || !formData.subcategory || !formData.description || !locationCity) {
      toast.error('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    // Walidacja lokalizacji i współrzędnych
    if (!formData.latitude || !formData.longitude) {
      toast.error('Proszę wybrać lokalizację z listy lub użyć przycisku geolokalizacji');
      return;
    }

    // Walidacja dodatkowych pól
    if (!formData.organizationName || !formData.organizationType || !formData.contactName || !formData.contactEmail) {
      toast.error('Proszę wypełnić wszystkie wymagane pola kontaktowe');
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('No active session:', sessionError);
        throw new Error('Brak aktywnej sesji. Proszę się zalogować ponownie.');
      }

      const sessionUserId = sessionData.session.user.id;
      
      console.log('Session verified:', {
        userId: sessionUserId,
        userEmail: sessionData.session.user.email,
        contextUserId: user.id,
        match: sessionUserId === user.id,
      });

      // Use session user ID to ensure it matches auth.uid() in RLS policies
      const managerId = sessionUserId;

      // Get or create company
      let company = await fetchUserPrimaryCompany(supabase, managerId);
      
      if (!company.data) {
        // Map organization type to database type
        const orgTypeMapping: Record<string, string> = {
          'Spółdzielnia Mieszkaniowa': 'spółdzielnia',
          'Wspólnota Mieszkaniowa': 'wspólnota',
          'Zarządca Nieruchomości': 'property_management',
          'Deweloper': 'property_management',
          'Inne': 'property_management',
        };

        const companyType = orgTypeMapping[formData.organizationType] || 'property_management';

        // Create company
        const createResult = await upsertUserCompany(supabase, managerId, {
          name: formData.organizationName,
          type: companyType,
          phone: formData.contactPhone || undefined,
          email: formData.contactEmail,
          city: typeof formData.location === 'string' ? formData.location : formData.location?.city || '',
          address: formData.address || undefined,
        });

        if (createResult.error || !createResult.data) {
          throw new Error(createResult.error?.message || 'Nie udało się utworzyć firmy');
        }

        company = { data: createResult.data, error: null };
      }

      if (!company.data) {
        throw new Error('Nie udało się pobrać lub utworzyć firmy');
      }

      // Use stored coordinates (already geocoded when location was selected)
      const latitude = formData.latitude;
      const longitude = formData.longitude;

      // Parse budget
      let budgetMin: number | undefined;
      let budgetMax: number | undefined;
      
      if (formData.budget) {
        const budgetValue = parseFloat(formData.budget.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(budgetValue)) {
          budgetMin = budgetValue;
          budgetMax = formData.budgetType === 'fixed' ? budgetValue : undefined;
        }
      }

      // Parse requirements string to array
      const requirementsArray = formData.requirements
        ? formData.requirements.split('\n').filter(r => r.trim().length > 0)
        : [];

      // Create job in database
      console.log('Creating job with data:', {
        title: formData.title,
        category: formData.category,
        managerId: managerId,
        companyId: company.data.id,
      });

      const jobResult = await createJob(supabase, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        location: formData.location,
        address: formData.address || undefined,
        latitude,
        longitude,
        sublocalityLevel1: formData.sublocalityLevel1 || undefined,
        budgetMin,
        budgetMax,
        budgetType: formData.budgetType,
        currency: 'PLN',
        deadline: formData.deadline || undefined,
        urgency: formData.urgency,
        status: 'active',
        type: formData.urgency === 'high' ? 'urgent' : 'regular',
        isPublic: true,
        contactPerson: formData.contactName,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail,
        additionalInfo: formData.additionalInfo || undefined,
        requirements: requirementsArray.length > 0 ? requirementsArray : undefined,
        managerId: managerId,
        companyId: company.data.id,
      });

      console.log('Job creation result:', jobResult);

      if (jobResult.error) {
        console.error('Job creation error details:', {
          error: jobResult.error,
          message: jobResult.error?.message,
          details: jobResult.error?.details,
          hint: jobResult.error?.hint,
          code: jobResult.error?.code,
        });
        throw new Error(
          jobResult.error?.message || 
          jobResult.error?.details || 
          jobResult.error?.hint || 
          'Nie udało się utworzyć zlecenia w bazie danych'
        );
      }

      if (!jobResult.data) {
        throw new Error('Nie udało się utworzyć zlecenia - brak danych zwrotnych');
      }

      toast.success(`✅ Zlecenie "${formData.title}" zostało opublikowane pomyślnie!`);
      
      // Reset form
      setFormData({
        title: '',
        category: '',
        subcategory: '',
        description: '',
        location: '',
        address: '',
        latitude: undefined,
        longitude: undefined,
        budget: '',
        budgetType: 'fixed',
        deadline: '',
        urgency: 'medium',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        organizationType: '',
        organizationName: '',
        requirements: '',
        additionalInfo: ''
      });
      setAttachments([]);
      
      // Powrót do listy zleceń po krótkim opóźnieniu
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error: any) {
      console.error('Błąd podczas zapisywania zlecenia:', error);
      toast.error(error?.message || 'Wystąpił błąd podczas publikowania zlecenia');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Powrót do listy zleceń
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Opublikuj nowe zlecenie</h1>
              <p className="text-gray-600">Znajdź najlepszych wykonawców dla Twojego projektu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Podstawowe informacje */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Podstawowe informacje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Tytuł zlecenia *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="np. Malowanie klatki schodowej"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Kategoria *</Label>
                  <Select value={formData.category} onValueChange={(value) => {
                    handleInputChange('category', value);
                    handleInputChange('subcategory', ''); // Reset subcategory when category changes
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz kategorię" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(categories).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subcategory">Podkategoria *</Label>
                  <Select 
                    value={formData.subcategory} 
                    onValueChange={(value) => handleInputChange('subcategory', value)}
                    disabled={!formData.category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz podkategorię" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.category && categories[formData.category as keyof typeof categories]?.map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Opis zlecenia *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Szczegółowy opis prac do wykonania, wymagań technicznych, materiałów..."
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="requirements">Wymagania i kwalifikacje</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  placeholder="Wymagane uprawnienia, certyfikaty, doświadczenie..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lokalizacja */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Lokalizacja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <LocationAutocomplete
                value={formData.address || (typeof formData.location === 'string' ? formData.location : formData.location?.city || '')}
                onLocationSelect={handleLocationSelect}
                required
                placeholder="Wpisz adres lub wybierz z listy"
                label="Lokalizacja *"
              />
            </CardContent>
          </Card>

          {/* Budżet i terminy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-600 font-medium">💰</span>
                Budżet i terminy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budżet</Label>
                  <Input
                    id="budget"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="np. 5000"
                  />
                </div>

                <div>
                  <Label htmlFor="budgetType">Typ budżetu</Label>
                  <Select value={formData.budgetType} onValueChange={(value: 'fixed' | 'hourly' | 'negotiable') => handleInputChange('budgetType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Kwota stała</SelectItem>
                      <SelectItem value="hourly">Za godzinę</SelectItem>
                      <SelectItem value="negotiable">Do negocjacji</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deadline">Termin wykonania</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="urgency">Priorytet</Label>
                  <Select value={formData.urgency} onValueChange={(value: 'low' | 'medium' | 'high') => handleInputChange('urgency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center gap-2">
                            <Badge className={level.color}>{level.label}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informacje o organizacji */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informacje o zleceniodawcy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organizationType">Typ organizacji *</Label>
                  <Select value={formData.organizationType} onValueChange={(value) => handleInputChange('organizationType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz typ" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="organizationName">Nazwa organizacji *</Label>
                  <Input
                    id="organizationName"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange('organizationName', e.target.value)}
                    placeholder="np. SM Przyjaźń"
                    required
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contactName">Osoba kontaktowa *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                    placeholder="Jan Kowalski"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone">Telefon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      placeholder="+48 123 456 789"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contactEmail">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      placeholder="kontakt@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Załączniki */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Załączniki i dokumenty
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="attachments">Dodaj pliki (zdjęcia, dokumenty, specyfikacje)</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileUpload}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Obsługiwane formaty: PDF, DOC, DOCX, JPG, PNG, GIF. Maksymalnie 10 plików.
                </p>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Załączone pliki:</Label>
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        Usuń
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Label htmlFor="additionalInfo">Dodatkowe informacje</Label>
                <Textarea
                  id="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                  placeholder="Inne ważne informacje, uwagi, preferencje czasowe..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Przyciski akcji */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onBack}>
              Anuluj
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isMounted ? (isSubmitting || !isAuthenticated) : false}
            >
              {isSubmitting ? 'Publikowanie...' : 'Opublikuj zlecenie'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}