"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent } from './ui/card';
import { 
  Upload, 
  X, 
  Image as ImageIcon,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  User,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { useUserProfile } from '../contexts/AuthContext';
import { createClient } from '../lib/supabase/client';
import { 
  createPortfolioProject, 
  updatePortfolioProject,
  addPortfolioProjectImage,
  type PortfolioProjectInput 
} from '../lib/database/contractors';
import { uploadPortfolioImage } from '../lib/storage/portfolio-images';
import { fetchUserPrimaryCompany } from '../lib/database/companies';
import { toast } from 'sonner';
import Image from 'next/image';

interface PortfolioProjectFormProps {
  projectId?: string;
  initialData?: {
    id: string;
    title: string;
    description?: string;
    category?: string;
    location?: string;
    projectType?: string;
    budget?: string;
    duration?: string;
    completionDate?: string;
    clientName?: string;
    clientFeedback?: string;
    isFeatured?: boolean;
    images?: string[];
  };
  onClose: () => void;
  onSuccess: () => void;
}

const categories = [
  'Utrzymanie Czystości i Zieleni',
  'Roboty Remontowo-Budowlane',
  'Instalacje i systemy',
  'Utrzymanie techniczne i konserwacja',
  'Specjalistyczne usługi',
  'Inne'
];

const projectTypes = [
  'residential',
  'commercial',
  'industrial',
  'mixed'
];

const projectTypeLabels: Record<string, string> = {
  'residential': 'Mieszkaniowy',
  'commercial': 'Komercyjny',
  'industrial': 'Przemysłowy',
  'mixed': 'Mieszany'
};

export default function PortfolioProjectForm({
  projectId,
  initialData,
  onClose,
  onSuccess
}: PortfolioProjectFormProps) {
  const { user } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    location: initialData?.location || '',
    projectType: initialData?.projectType || '',
    budgetRange: initialData?.budget || '',
    duration: initialData?.duration || '',
    completionDate: initialData?.completionDate || '',
    clientName: initialData?.clientName || '',
    clientFeedback: initialData?.clientFeedback || '',
    isFeatured: initialData?.isFeatured || false,
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(initialData?.images || []);
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]); // Track existing image file IDs
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        setImages(prev => [...prev, file]);
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImagePreviews(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tytuł jest wymagany';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Proszę uzupełnić wymagane pola');
      return;
    }

    if (!user?.id) {
      toast.error('Musisz być zalogowany');
      return;
    }

    setIsSubmitting(true);
    setUploadingImages(true);

    try {
      const supabase = createClient();

      // Get user's company
      const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, user.id);
      
      if (companyError || !company) {
        toast.error('Nie znaleziono firmy. Proszę najpierw uzupełnić dane firmy.');
        setIsSubmitting(false);
        setUploadingImages(false);
        return;
      }

      // Find category ID
      let categoryId: string | undefined;
      if (formData.category) {
        const { data: categoryData } = await supabase
          .from('job_categories')
          .select('id')
          .ilike('name', `%${formData.category}%`)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        
        categoryId = categoryData?.id;
      }

      const projectInput: PortfolioProjectInput = {
        title: formData.title,
        description: formData.description || undefined,
        categoryId: categoryId,
        location: formData.location || undefined,
        projectType: formData.projectType || undefined,
        budgetRange: formData.budgetRange || undefined,
        duration: formData.duration || undefined,
        completionDate: formData.completionDate || undefined,
        clientName: formData.clientName || undefined,
        clientFeedback: formData.clientFeedback || undefined,
        isFeatured: formData.isFeatured,
      };

      let savedProjectId: string;

      if (projectId && initialData) {
        // Update existing project
        const { data: success, error: updateError } = await updatePortfolioProject(
          supabase,
          projectId,
          projectInput
        );

        if (updateError || !success) {
          toast.error('Nie udało się zaktualizować projektu');
          console.error('Error updating project:', updateError);
          setIsSubmitting(false);
          setUploadingImages(false);
          return;
        }

        savedProjectId = projectId;
      } else {
        // Create new project
        const { data: newProjectId, error: createError } = await createPortfolioProject(
          supabase,
          company.id,
          projectInput
        );

        if (createError || !newProjectId) {
          toast.error('Nie udało się utworzyć projektu');
          console.error('Error creating project:', createError);
          setIsSubmitting(false);
          setUploadingImages(false);
          return;
        }

        savedProjectId = newProjectId;
      }

      // Upload images
      if (images.length > 0) {
        let uploadedCount = 0;
        let failedCount = 0;

        for (const image of images) {
          const { data: uploadResult, error: uploadError } = await uploadPortfolioImage(
            supabase,
            image,
            user.id,
            savedProjectId
          );

          if (uploadError || !uploadResult) {
            const errorMessage = uploadError?.message || uploadError?.details || uploadError?.hint || JSON.stringify(uploadError) || 'Nieznany błąd';
            console.error('Error uploading image:', { uploadError, imageName: image.name, projectId: savedProjectId });
            toast.error(`Nie udało się przesłać obrazu: ${image.name}. ${errorMessage}`);
            failedCount++;
            continue;
          }

          // Add image to portfolio project
          const { data: imageRecordId, error: imageError } = await addPortfolioProjectImage(
            supabase,
            savedProjectId,
            uploadResult.fileId
          );

          if (imageError || !imageRecordId) {
            const errorMessage = imageError?.message || imageError?.details || imageError?.hint || JSON.stringify(imageError) || 'Nieznany błąd';
            console.error('Error adding image to project:', { 
              imageError, 
              imageName: image.name, 
              projectId: savedProjectId, 
              fileId: uploadResult.fileId,
              errorMessage 
            });
            toast.error(`Nie udało się dodać obrazu do projektu: ${image.name}. ${errorMessage}`);
            failedCount++;
            // Try to clean up the uploaded file if we can't link it
            try {
              await supabase.storage.from('job-attachments').remove([uploadResult.path]);
            } catch (cleanupError) {
              console.error('Error cleaning up uploaded file:', cleanupError);
            }
            continue;
          }

          uploadedCount++;
        }

        if (uploadedCount > 0) {
          toast.success(`Przesłano ${uploadedCount} ${uploadedCount === 1 ? 'obraz' : uploadedCount < 5 ? 'obrazy' : 'obrazów'}`);
        }

        if (failedCount > 0) {
          toast.warning(`${failedCount} ${failedCount === 1 ? 'obraz nie został' : 'obrazy nie zostały'} przesłane`);
        }
      }

      toast.success(projectId ? 'Projekt zaktualizowany' : 'Projekt utworzony');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error('Wystąpił błąd podczas zapisywania projektu');
    } finally {
      setIsSubmitting(false);
      setUploadingImages(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="title">Tytuł projektu *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="np. Remont klatki schodowej"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <Label htmlFor="category">Kategoria</Label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz kategorię" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="projectType">Typ projektu</Label>
          <Select value={formData.projectType} onValueChange={(value) => handleInputChange('projectType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz typ" />
            </SelectTrigger>
            <SelectContent>
              {projectTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {projectTypeLabels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="location">Lokalizacja</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="np. Warszawa, Ursynów"
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="budgetRange">Budżet</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="budgetRange"
              value={formData.budgetRange}
              onChange={(e) => handleInputChange('budgetRange', e.target.value)}
              placeholder="np. 50 000 - 75 000 zł"
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="duration">Czas realizacji</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="duration"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              placeholder="np. 3 miesiące"
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="completionDate">Data ukończenia</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="completionDate"
              type="date"
              value={formData.completionDate}
              onChange={(e) => handleInputChange('completionDate', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="clientName">Nazwa klienta</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              placeholder="np. Wspólnota Mieszkaniowa XYZ"
              className="pl-10"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">Opis projektu</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Opisz szczegóły projektu..."
            rows={4}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="clientFeedback">Opinie klienta</Label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Textarea
              id="clientFeedback"
              value={formData.clientFeedback}
              onChange={(e) => handleInputChange('clientFeedback', e.target.value)}
              placeholder="Opinia klienta o projekcie..."
              rows={3}
              className="pl-10"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFeatured"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => handleInputChange('isFeatured', checked as boolean)}
            />
            <Label htmlFor="isFeatured" className="cursor-pointer">
              Wyróżnij projekt (będzie wyświetlany na górze)
            </Label>
          </div>
        </div>

        <div className="md:col-span-2">
          <Label>Zdjęcia projektu</Label>
          <div className="mt-2 space-y-4">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Kliknij, aby przesłać</span> lub przeciągnij i upuść
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, WEBP (MAX. 10MB)</p>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="p-2">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isSubmitting || uploadingImages}>
          {isSubmitting || uploadingImages ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {uploadingImages ? 'Przesyłanie...' : 'Zapisywanie...'}
            </>
          ) : (
            projectId ? 'Zaktualizuj projekt' : 'Utwórz projekt'
          )}
        </Button>
      </div>
    </form>
  );
}

