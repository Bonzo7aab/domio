"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Upload, FileText, Phone, Building2, X, File, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useUserProfile } from '../contexts/AuthContext';
import { createClient } from '../lib/supabase/client';
import { createJob } from '../lib/database/jobs';
import { fetchUserPrimaryCompany } from '../lib/database/companies';
import { fetchCompanyBuildings } from '../lib/database/buildings';
import { fetchAllCategoriesWithSubcategories } from '../lib/database/categories';
import type { CategoryWithSubcategories } from '../lib/database/categories';
import type { Building } from '../types/building';
import Link from 'next/link';
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
  propertyId: string;
  location: JobLocation | string; // Support both formats during transition
  address: string;
  latitude?: number;
  longitude?: number;
  sublocalityLevel1?: string;
  budget: string;
  budgetType: 'fixed' | 'negotiable';
  deadlineOption: 'emergency' | 'urgent_week' | 'to_agree';
  urgency: 'low' | 'medium' | 'high';
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  additionalInfo: string;
}

// Categories will be loaded from database

const deadlineOptions = [
  { value: 'emergency', label: 'Awaria', description: 'Realizacja natychmiast', urgency: 'high' },
  { value: 'urgent_week', label: 'Pilne', description: 'Realizacja w ciągu tygodnia', urgency: 'medium' },
  { value: 'to_agree', label: 'Do ustalenia', description: 'Termin do uzgodnienia z wykonawcą', urgency: 'low' },
] as const;

const getDeadlineDate = (deadlineOption: JobFormData['deadlineOption']): string | undefined => {
  if (deadlineOption === 'to_agree') return undefined;

  const deadline = new Date();
  if (deadlineOption === 'urgent_week') {
    deadline.setDate(deadline.getDate() + 7);
  }

  return deadline.toISOString().split('T')[0];
};

const getDeadlineLabel = (deadlineOption: JobFormData['deadlineOption']): string => {
  const option = deadlineOptions.find((item) => item.value === deadlineOption);
  return option ? `${option.label} - ${option.description}` : 'Do ustalenia';
};

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

  // Load categories from database
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      const { data } = await fetchAllCategoriesWithSubcategories(supabase);
      if (data) {
        setCategoriesFromDb(data);
      }
      setIsLoadingCategories(false);
    };
    loadCategories();
  }, [supabase]);

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    category: '',
    subcategory: '',
    description: '',
    propertyId: '',
    location: { city: '' },
    address: '',
    latitude: undefined,
    longitude: undefined,
    budget: '',
    budgetType: 'fixed',
    deadlineOption: 'to_agree',
    urgency: 'medium',
    contactName: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    additionalInfo: ''
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [categoriesFromDb, setCategoriesFromDb] = useState<CategoryWithSubcategories[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      contactName: prev.contactName || [user?.firstName, user?.lastName].filter(Boolean).join(' '),
      contactPhone: prev.contactPhone || user?.phone || '',
      contactEmail: prev.contactEmail || user?.email || '',
    }));
  }, [user]);

  useEffect(() => {
    const loadBuildings = async () => {
      if (!user?.id) return;

      setIsLoadingBuildings(true);
      try {
        const { data: company } = await fetchUserPrimaryCompany(supabase, user.id);
        if (!company) {
          setBuildings([]);
          return;
        }

        const { data, error } = await fetchCompanyBuildings(supabase, company.id);
        if (error) {
          console.error('Error loading buildings:', error);
          toast.error('Nie udało się załadować nieruchomości z profilu');
          setBuildings([]);
          return;
        }

        setBuildings(data || []);
      } finally {
        setIsLoadingBuildings(false);
      }
    };

    loadBuildings();
  }, [user, supabase]);

  const handleInputChange = (field: keyof JobFormData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePropertyChange = (buildingId: string) => {
    const building = buildings.find((item) => item.id === buildingId);
    if (!building) return;

    setFormData(prev => ({
      ...prev,
      propertyId: buildingId,
      location: {
        city: building.city,
      },
      address: [building.street_address, building.postal_code, building.city].filter(Boolean).join(', '),
      latitude: building.latitude ?? undefined,
      longitude: building.longitude ?? undefined,
      sublocalityLevel1: undefined
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
      toast.error('Musisz być zalogowany, aby opublikować zgłoszenie');
      return;
    }

    // Validate category
    if (!formData.category) {
      toast.error('Proszę wybrać kategorię');
      return;
    }
    
    // Validate subcategory
    if (!formData.subcategory || formData.subcategory === '') {
      toast.error('Proszę wybrać podkategorię');
      return;
    }
    
    if (!formData.title || !formData.description) {
      toast.error('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    if (!formData.propertyId) {
      toast.error('Proszę wybrać nieruchomość');
      return;
    }

    // Walidacja budżetu - wymagany tylko przy opcji wpisania kwoty.
    if (formData.budgetType !== 'negotiable') {
      if (!formData.budget || formData.budget.trim() === '') {
        toast.error('Proszę podać budżet netto');
        return;
      }
      
      // Validate budget is a valid number
      const budgetValue = parseFloat(formData.budget.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (isNaN(budgetValue) || budgetValue <= 0) {
        toast.error('Proszę podać prawidłową wartość budżetu');
        return;
      }
    }

    if (!formData.contactName || !formData.contactPhone) {
      toast.error('Proszę podać osobę kontaktową i telefon');
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

      // Get company - must exist (checked earlier)
      const company = await fetchUserPrimaryCompany(supabase, managerId);
      
      if (!company.data) {
        toast.error('Nie znaleziono firmy. Proszę najpierw uzupełnić dane firmy w profilu.');
        return;
      }

      const selectedBuilding = buildings.find((building) => building.id === formData.propertyId);
      if (!selectedBuilding) {
        throw new Error('Wybrana nieruchomość nie jest już dostępna. Odśwież stronę i spróbuj ponownie.');
      }

      const deadlineOption = deadlineOptions.find((option) => option.value === formData.deadlineOption);
      const deadlineLabel = getDeadlineLabel(formData.deadlineOption);
      const derivedUrgency = deadlineOption?.urgency || 'low';

      // Parse budget using Budget type
      let budgetMin: number | undefined;
      let budgetMax: number | undefined;
      
      if (formData.budget && formData.budget.trim() !== '') {
        const cleanedBudget = formData.budget.replace(/[^\d.,]/g, '').replace(',', '.');
        const budgetValue = parseFloat(cleanedBudget);
        
        if (!isNaN(budgetValue) && budgetValue > 0) {
          budgetMin = budgetValue;
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
            const errorMessages = uploadResult.errors.map((e: unknown) => 
              `${(e as { file?: string }).file || 'Nieznany plik'}: ${((e as { error?: { message?: string } }).error?.message) || 'Błąd przesyłania'}`
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
        } catch (uploadError: unknown) {
          console.error('Error uploading attachments:', uploadError);
          throw new Error((uploadError instanceof Error ? uploadError.message : (uploadError as { message?: string })?.message) || 'Błąd podczas przesyłania plików');
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
        deadline: deadlineLabel,
        propertyId: formData.propertyId,
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
        latitude: formData.latitude,
        longitude: formData.longitude,
        sublocalityLevel1: formData.sublocalityLevel1 || undefined,
        budgetMin: budgetInput.min,
        budgetMax: budgetInput.max,
        budgetType: budgetInput.type || 'fixed',
        currency: budgetInput.currency || 'PLN',
        deadline: getDeadlineDate(formData.deadlineOption),
        projectDuration: deadlineLabel,
        urgency: derivedUrgency,
        status: 'collecting_offers',
        type: derivedUrgency === 'high' ? 'urgent' : 'regular',
        isPublic: true,
        contactPerson: formData.contactName,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail,
        buildingType: selectedBuilding.building_type || undefined,
        buildingYear: selectedBuilding.year_built || undefined,
        additionalInfo: [
          `Nieruchomość: ${selectedBuilding.name}`,
          `Adres nieruchomości: ${formData.address}`,
          `Termin: ${deadlineLabel}`,
          formData.additionalInfo ? `Dodatkowe informacje: ${formData.additionalInfo}` : null,
        ].filter(Boolean).join('\n'),
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

      toast.success(`✅ Zgłoszenie "${formData.title}" zostało opublikowane pomyślnie!`);
      
      // Reset form
      setFormData({
        title: '',
        category: '',
        subcategory: '',
        description: '',
        propertyId: '',
        location: { city: '' },
        address: '',
        latitude: undefined,
        longitude: undefined,
        budget: '',
        budgetType: 'fixed',
        deadlineOption: 'to_agree',
        urgency: 'medium',
        contactName: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
        contactPhone: user?.phone || '',
        contactEmail: user?.email || '',
        additionalInfo: ''
      });
      setAttachments([]);
      setUploadedFileUrls([]);
      
      // Powrót do listy zleceń po krótkim opóźnieniu
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error: unknown) {
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
      
      toast.error((error instanceof Error ? error.message : (error as { message?: string })?.message) || 'Wystąpił błąd podczas publikowania zlecenia');
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
              Powrót
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Dodaj nowe zgłoszenie</h1>
              <p className="text-gray-600">Opisz potrzebę i zbierz oferty od wykonawców</p>
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
                <Label htmlFor="title">Tytuł *</Label>
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
                  {isLoadingCategories ? (
                    <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
                  ) : (
                    <Select value={formData.category} onValueChange={(value) => {
                      handleInputChange('category', value);
                      // Reset subcategory when category changes
                      handleInputChange('subcategory', '');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz kategorię" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesFromDb.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <Label htmlFor="subcategory">Podkategoria *</Label>
                  {isLoadingCategories ? (
                    <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
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
                        {formData.category && (() => {
                          const selectedCategory = categoriesFromDb.find(c => c.name === formData.category);
                          return selectedCategory?.subcategories.map((subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.name}>
                              {subcategory.name}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="propertyId">Nieruchomość *</Label>
                {isLoadingBuildings ? (
                  <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
                ) : buildings.length > 0 ? (
                  <Select value={formData.propertyId} onValueChange={handlePropertyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz nieruchomość z profilu" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name} - {building.street_address}, {building.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Nie masz jeszcze dodanych nieruchomości. Dodaj je w profilu, aby móc utworzyć zgłoszenie.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Szczegóły techniczne */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Szczegóły techniczne
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="description">Opis *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Opisz usterkę, podaj piętro, czy potrzebny jest specjalistyczny sprzęt?"
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label>Załączniki</Label>
                <Dropzone
                  accept={{
                    'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
                    'application/pdf': ['.pdf'],
                    'application/msword': ['.doc'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                  }}
                  maxFiles={10}
                  maxSize={10 * 1024 * 1024}
                  minSize={1024}
                  onDrop={handleFileUpload}
                  disabled={attachments.length >= 10 || isSubmitting || isUploading}
                  src={attachments}
                  className="mt-2"
                >
                  <DropzoneEmptyState>
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="my-2 w-full truncate text-wrap font-medium text-sm">
                        Dodaj
                      </p>
                      <p className="w-full truncate text-wrap text-muted-foreground text-xs">
                        JPG, PNG, WEBP, GIF, PDF, DOC, DOCX. Maksymalnie 10 plików, 10MB każdy.
                      </p>
                    </div>
                  </DropzoneEmptyState>
                  <DropzoneContent>
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="my-2 w-full truncate text-wrap font-medium text-sm">
                        Dodaj
                      </p>
                      <p className="w-full truncate text-wrap text-muted-foreground text-xs">
                        Wybrano {attachments.length} plik{attachments.length > 1 ? 'ów' : ''}
                      </p>
                    </div>
                  </DropzoneContent>
                </Dropzone>
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
                              {/* eslint-disable-next-line @next/next/no-img-element */}
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
                                <Badge variant={isImageFile(file) ? 'secondary' : 'outline'} className="text-xs mt-1">
                                  {isImageFile(file) ? (
                                    <ImageIcon className="h-3 w-3 mr-1" />
                                  ) : (
                                    <File className="h-3 w-3 mr-1" />
                                  )}
                                  {isImageFile(file) ? 'Obraz' : 'Dokument'}
                                </Badge>
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
            </CardContent>
          </Card>

          {/* Czas i budżet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-600 font-medium">PLN</span>
                Czas i budżet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Termin *</Label>
                <RadioGroup
                  value={formData.deadlineOption}
                  onValueChange={(value: JobFormData['deadlineOption']) => handleInputChange('deadlineOption', value)}
                  className="mt-3 grid gap-3"
                >
                  {deadlineOptions.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`deadline-${option.value}`}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-gray-50"
                    >
                      <RadioGroupItem id={`deadline-${option.value}`} value={option.value} className="mt-1" />
                      <span>
                        <span className="block font-medium">{option.label}</span>
                        <span className="block text-sm text-gray-600">{option.description}</span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label>Budżet netto *</Label>
                <RadioGroup
                  value={formData.budgetType}
                  onValueChange={(value: JobFormData['budgetType']) => {
                    handleInputChange('budgetType', value);
                    if (value === 'negotiable') {
                      handleInputChange('budget', '');
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  <Label htmlFor="budget-fixed" className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:bg-gray-50">
                    <RadioGroupItem id="budget-fixed" value="fixed" />
                    <span className="font-medium">Wpisz kwotę</span>
                  </Label>
                  <Label htmlFor="budget-negotiable" className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:bg-gray-50">
                    <RadioGroupItem id="budget-negotiable" value="negotiable" />
                    <span className="font-medium">Potrzebna wycena</span>
                  </Label>
                </RadioGroup>

                {formData.budgetType === 'fixed' && (
                <div>
                  <Label htmlFor="budget">Kwota netto</Label>
                  <Input
                    id="budget"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="np. 5000 PLN"
                  />
                </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Osoba kontaktowa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Osoba kontaktowa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-gray-600">
                Domyślnie wpisany jest zarządca dodający zgłoszenie. Możesz zmienić dane, jeśli na miejscu kontaktową osobą będzie ktoś inny.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">Imię i nazwisko *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                    placeholder="Jan Kowalski"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone">Telefon *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      placeholder="+48 123 456 789"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
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
              {isUploading ? 'Przesyłanie plików...' : isSubmitting ? 'Publikowanie...' : 'Opublikuj zgłoszenie'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}