"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ArrowLeft, Upload, MapPin, Calendar, FileText, Phone, Mail, Building, X, File, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useUserProfile } from '../contexts/AuthContext';
import { createClient } from '../lib/supabase/client';
import { createJob } from '../lib/database/jobs';
import { fetchUserPrimaryCompany } from '../lib/database/companies';
import Link from 'next/link';
import LocationAutocomplete from './LocationAutocomplete';
import type { BudgetInput } from '../types/budget';
import { uploadJobAttachments, deleteJobAttachments } from '../lib/storage/job-attachments';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from './ui/dropzone';
import type { FileRejection } from 'react-dropzone';

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
  ],
  'Inne': [
    'Inne'
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
  const [hasCompany, setHasCompany] = useState<boolean | null>(null);
  const [isCheckingCompany, setIsCheckingCompany] = useState(true);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if user has a company
  useEffect(() => {
    const checkCompany = async () => {
      if (!user?.id) {
        setIsCheckingCompany(false);
        return;
      }
      
      try {
        const { data: company } = await fetchUserPrimaryCompany(supabase, user.id);
        setHasCompany(!!company);
      } catch (error) {
        console.error('Error checking company:', error);
        setHasCompany(false);
      } finally {
        setIsCheckingCompany(false);
      }
    };
    
    checkCompany();
  }, [user, supabase]);

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
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileUpload = (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    // Handle rejected files
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      const error = rejection.errors[0];
      if (error.code === 'file-too-large') {
        toast.error(`Plik "${rejection.file.name}" jest zbyt duży. Maksymalny rozmiar: 10MB`);
      } else if (error.code === 'file-invalid-type') {
        toast.error(`Nieprawidłowy typ pliku "${rejection.file.name}". Dozwolone: JPG, PNG, WEBP, GIF, PDF, DOC, DOCX`);
      } else {
        toast.error(`Błąd przy dodawaniu pliku "${rejection.file.name}": ${error.message}`);
      }
    }

    // Add accepted files
    if (acceptedFiles.length > 0) {
      const maxFiles = 10;
      const currentCount = attachments.length;
      const remainingSlots = maxFiles - currentCount;
      
      if (remainingSlots <= 0) {
        toast.error(`Można dodać maksymalnie ${maxFiles} plików`);
        return;
      }

      const filesToAdd = acceptedFiles.slice(0, remainingSlots);
      setAttachments(prev => [...prev, ...filesToAdd]);
      
      if (acceptedFiles.length > remainingSlots) {
        toast.warning(`Dodano ${remainingSlots} z ${acceptedFiles.length} plików (maksymalnie ${maxFiles})`);
      } else {
        toast.success(`Dodano ${filesToAdd.length} plik${filesToAdd.length > 1 ? 'i' : ''}`);
      }
    }
  };

  const removeAttachment = (index: number) => {
    // Clean up preview URL if it exists
    const file = attachments[index];
    if (file && isImageFile(file)) {
      // URL will be cleaned up automatically when component re-renders
      // since we create it fresh each time
    }
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  // Create and manage preview URLs for image files
  const previewUrls = useMemo(() => {
    const urls = new Map<number, string>();
    attachments.forEach((file, index) => {
      if (isImageFile(file)) {
        urls.set(index, URL.createObjectURL(file));
      }
    });
    return urls;
  }, [attachments]);

  // Cleanup object URLs on component unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

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
    
    // Validate category
    if (!formData.category) {
      toast.error('Proszę wybrać kategorię');
      return;
    }
    
    // Validate subcategory - accept "-" when category is "Inne"
    // Ensure subcategory is set correctly for "Inne" category
    const currentSubcategory = formData.category === 'Inne' ? '-' : formData.subcategory;
    
    const isValidSubcategory = formData.category === 'Inne'
      ? currentSubcategory === '-' // For "Inne", must be "-"
      : currentSubcategory && currentSubcategory !== '' && currentSubcategory !== '-'; // For others, must be selected
    
    if (!isValidSubcategory) {
      toast.error('Proszę wybrać podkategorię');
      return;
    }
    
    // Update formData with correct subcategory if needed
    if (formData.category === 'Inne' && formData.subcategory !== '-') {
      setFormData(prev => ({ ...prev, subcategory: '-' }));
    }
    
    if (!formData.title || !formData.description || !locationCity) {
      toast.error('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    // Walidacja lokalizacji i współrzędnych
    if (!formData.latitude || !formData.longitude) {
      toast.error('Proszę wybrać lokalizację z listy lub użyć przycisku geolokalizacji');
      return;
    }

    // Walidacja budżetu - wymagany dla fixed i hourly, opcjonalny dla negotiable
    if (formData.budgetType !== 'negotiable') {
      if (!formData.budget || formData.budget.trim() === '') {
        toast.error(`Proszę podać ${formData.budgetType === 'hourly' ? 'stawkę godzinową' : 'budżet'}`);
        return;
      }
      
      // Validate budget is a valid number
      const budgetValue = parseFloat(formData.budget.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (isNaN(budgetValue) || budgetValue <= 0) {
        toast.error('Proszę podać prawidłową wartość budżetu');
        return;
      }
    }

    // Walidacja pól kontaktowych (opcjonalne, używane jako kontakt do zlecenia, nie do tworzenia firmy)
    // Company is required and checked earlier

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

      // Get company - must exist (checked earlier)
      const company = await fetchUserPrimaryCompany(supabase, managerId);
      
      if (!company.data) {
        toast.error('Nie znaleziono firmy. Proszę najpierw uzupełnić dane firmy w profilu.');
        return;
      }

      // Use stored coordinates (already geocoded when location was selected)
      const latitude = formData.latitude;
      const longitude = formData.longitude;

      // Parse budget using Budget type
      let budgetMin: number | undefined;
      let budgetMax: number | undefined;
      
      if (formData.budget && formData.budget.trim() !== '') {
        const cleanedBudget = formData.budget.replace(/[^\d.,]/g, '').replace(',', '.');
        const budgetValue = parseFloat(cleanedBudget);
        
        if (!isNaN(budgetValue) && budgetValue > 0) {
          budgetMin = budgetValue;
          // For fixed type, min and max are the same
          // For hourly, only min is set
          // For negotiable, both can be undefined
          budgetMax = formData.budgetType === 'fixed' ? budgetValue : undefined;
        } else {
          console.warn('Invalid budget value:', formData.budget);
        }
      }
      
      // Create BudgetInput object
      const budgetInput: BudgetInput = {
        min: budgetMin,
        max: budgetMax,
        type: formData.budgetType,
        currency: 'PLN',
      };
      
      console.log('Budget input:', {
        raw: formData.budget,
        budgetType: formData.budgetType,
        parsed: budgetInput
      });

      // Parse requirements string to array
      const requirementsArray = formData.requirements
        ? formData.requirements.split('\n').filter(r => r.trim().length > 0)
        : [];

      // Upload attachments if any
      let uploadedUrls: string[] = [];
      if (attachments.length > 0) {
        setIsUploading(true);
        try {
          const uploadResult = await uploadJobAttachments(
            supabase,
            attachments,
            managerId
            // No jobId yet - files will be in 'draft' folder
          );

          if (uploadResult.errors.length > 0) {
            // Some files failed to upload
            const errorMessages = uploadResult.errors.map(e => 
              `${e.file}: ${e.error?.message || 'Błąd przesyłania'}`
            ).join(', ');
            toast.error(`Niektóre pliki nie zostały przesłane: ${errorMessages}`);
          }

          if (uploadResult.data.length > 0) {
            uploadedUrls = uploadResult.data.map(result => result.url);
            setUploadedFileUrls(uploadedUrls);
            toast.success(`Przesłano ${uploadResult.data.length} z ${attachments.length} plików`);
          } else {
            // All files failed
            throw new Error('Nie udało się przesłać żadnego pliku. Spróbuj ponownie.');
          }
        } catch (uploadError: any) {
          console.error('Error uploading attachments:', uploadError);
          throw new Error(uploadError?.message || 'Błąd podczas przesyłania plików');
        } finally {
          setIsUploading(false);
        }
      }

      // Create job in database
      console.log('Creating job with data:', {
        title: formData.title,
        category: formData.category,
        subcategory: formData.subcategory,
        budget: budgetInput,
        managerId: managerId,
        companyId: company.data!.id,
        attachmentsCount: uploadedUrls.length,
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
        budgetMin: budgetInput.min,
        budgetMax: budgetInput.max,
        budgetType: budgetInput.type || 'fixed',
        currency: budgetInput.currency || 'PLN',
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
        images: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        managerId: managerId,
        companyId: company.data!.id,
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
        // Clean up uploaded files if job creation failed
        if (uploadedUrls.length > 0) {
          try {
            await deleteJobAttachments(supabase, uploadedUrls);
            console.log('Cleaned up uploaded files after job creation failure');
          } catch (cleanupError) {
            console.error('Error cleaning up uploaded files:', cleanupError);
          }
        }
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
      setUploadedFileUrls([]);
      
      // Powrót do listy zleceń po krótkim opóźnieniu
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error: any) {
      console.error('Błąd podczas zapisywania zlecenia:', error);
      
      // Clean up uploaded files if job creation failed
      if (uploadedFileUrls.length > 0) {
        try {
          await deleteJobAttachments(supabase, uploadedFileUrls);
          console.log('Cleaned up uploaded files after error');
          setUploadedFileUrls([]);
        } catch (cleanupError) {
          console.error('Error cleaning up uploaded files:', cleanupError);
        }
      }
      
      toast.error(error?.message || 'Wystąpił błąd podczas publikowania zlecenia');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  // Show loading while checking company
  if (isCheckingCompany) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="ml-2 text-sm text-muted-foreground">Ładowanie...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show message with button if no company
  if (!hasCompany) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center space-y-4 gap-2 flex flex-col justify-center">
              <p className="text-muted-foreground">Nie znaleziono firmy. Proszę najpierw uzupełnić dane firmy w profilu.</p>
              <Link href="/account?tab=company">
                <Button>Dodaj dane firmy w profilu</Button>
              </Link>
              <Button variant="outline" onClick={onBack} className="mt-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Powrót
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hidden md:flex items-center gap-2"
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
                    // Set subcategory to "-" if "Inne" is selected, otherwise reset
                    handleInputChange('subcategory', value === 'Inne' ? '-' : '');
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
                  {formData.category === 'Inne' ? (
                    <div>
                      <Input
                        value="-"
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">(automatycznie ustawione dla kategorii "Inne")</p>
                    </div>
                  ) : (
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
                  )}
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
                  <Label htmlFor="budget">
                    {formData.budgetType === 'hourly' ? 'Stawka godzinowa' : 
                     formData.budgetType === 'negotiable' ? 'Budżet (opcjonalnie)' : 
                     'Budżet'}
                  </Label>
                  <Input
                    id="budget"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder={
                      formData.budgetType === 'hourly' ? 'np. 50 PLN/h' :
                      formData.budgetType === 'negotiable' ? 'np. 5000-10000 PLN (opcjonalnie)' :
                      'np. 5000 PLN'
                    }
                  />
                  {formData.budgetType === 'negotiable' && (
                    <p className="text-sm text-gray-500 mt-1">
                      Możesz podać orientacyjny zakres budżetu lub pozostawić puste - budżet będzie przedmiotem negocjacji
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="budgetType">Typ budżetu</Label>
                  <Select value={formData.budgetType} onValueChange={(value: 'fixed' | 'hourly' | 'negotiable') => {
                    handleInputChange('budgetType', value);
                  }}>
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
                <Label>Dodaj pliki (zdjęcia, dokumenty, specyfikacje)</Label>
                <Dropzone
                  accept={{
                    'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
                    'application/pdf': ['.pdf'],
                    'application/msword': ['.doc'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                  }}
                  maxFiles={10}
                  maxSize={10 * 1024 * 1024} // 10MB
                  minSize={1024} // 1KB
                  onDrop={handleFileUpload}
                  disabled={attachments.length >= 10 || isSubmitting || isUploading}
                  src={attachments}
                  className="mt-2"
                >
                  <DropzoneEmptyState>
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Upload className="h-4 w-4" />
                      </div>
                      <p className="my-2 w-full truncate text-wrap font-medium text-sm">
                        Przeciągnij pliki tutaj lub kliknij, aby wybrać
                      </p>
                      <p className="w-full truncate text-wrap text-muted-foreground text-xs">
                        Obsługiwane formaty: JPG, PNG, WEBP, GIF, PDF, DOC, DOCX. Maksymalnie 10 plików, 10MB każdy.
                      </p>
                    </div>
                  </DropzoneEmptyState>
                  <DropzoneContent>
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Upload className="h-4 w-4" />
                      </div>
                      <p className="my-2 w-full truncate text-wrap font-medium text-sm">
                        {attachments.length} plik{attachments.length > 1 ? 'ów' : ''} wybran{attachments.length > 1 ? 'ych' : 'y'}
                      </p>
                      <p className="w-full truncate text-wrap text-muted-foreground text-xs">
                        Kliknij, aby dodać więcej plików
                      </p>
                    </div>
                  </DropzoneContent>
                </Dropzone>
                {attachments.length >= 10 && (
                  <p className="text-sm text-amber-600 mt-1">
                    Osiągnięto limit 10 plików. Usuń plik, aby dodać nowy.
                  </p>
                )}
              </div>

              {attachments.length > 0 && (
                <div className="space-y-3">
                  <Label>Załączone pliki ({attachments.length}/10):</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {attachments.map((file, index) => {
                      const previewUrl = previewUrls.get(index) || null;
                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          {previewUrl ? (
                            <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border border-gray-300">
                              <img
                                src={previewUrl}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 flex-shrink-0 rounded bg-gray-200 flex items-center justify-center border border-gray-300">
                              <File className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatFileSize(file.size)}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  {isImageFile(file) ? (
                                    <Badge variant="secondary" className="text-xs">
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                      Obraz
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      <File className="h-3 w-3 mr-1" />
                                      Dokument
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttachment(index)}
                                className="flex-shrink-0 h-8 w-8 p-0"
                                disabled={isSubmitting || isUploading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
              disabled={isMounted ? (isSubmitting || isUploading || !isAuthenticated) : false}
            >
              {isUploading ? 'Przesyłanie plików...' : isSubmitting ? 'Publikowanie...' : 'Opublikuj zlecenie'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}