'use client'

import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, MapPin, Loader2, X, Check, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from './ui/dropzone';
import type { FileRejection } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { createClient } from '../lib/supabase/client';
import { fetchCompanyBuildings, createBuilding, updateBuilding, deleteBuilding } from '../lib/database/buildings';
import { geocodeAddressWithFallback } from '../lib/database/geocoding-helper';
import { uploadBuildingImages } from '../lib/storage/building-images';
import type { Building, BuildingFormData } from '../types/building';
import { BUILDING_TYPE_OPTIONS } from '../types/building';

interface BuildingManagementProps {
  companyId: string;
}

export function BuildingManagement({ companyId }: BuildingManagementProps) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<Building | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [formData, setFormData] = useState<BuildingFormData>({
    name: '',
    street_address: '',
    city: '',
    postal_code: '',
    building_type: '',
    year_built: '',
    units_count: '',
    floors_count: '',
    notes: '',
    images: [],
  });

  // Fetch buildings on mount and when companyId changes
  useEffect(() => {
    loadBuildings();
  }, [companyId]);

  const loadBuildings = async () => {
    setIsLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await fetchCompanyBuildings(supabase, companyId);
      
      if (fetchError) {
        setError('Nie udało się załadować budynków');
        console.error('Error fetching buildings:', fetchError);
      } else {
        setBuildings(data || []);
      }
    } catch (err) {
      setError('Wystąpił błąd podczas ładowania budynków');
      console.error('Error loading buildings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingBuilding(null);
    setFormData({
      name: '',
      street_address: '',
      city: '',
      postal_code: '',
      building_type: '',
      year_built: '',
      units_count: '',
      floors_count: '',
      notes: '',
      images: [],
    });
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setError('');
    setSuccess('');
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (building: Building) => {
    setEditingBuilding(building);
    setFormData({
      name: building.name,
      street_address: building.street_address,
      city: building.city,
      postal_code: building.postal_code || '',
      building_type: building.building_type || '',
      year_built: building.year_built?.toString() || '',
      units_count: building.units_count?.toString() || '',
      floors_count: building.floors_count?.toString() || '',
      notes: building.notes || '',
      latitude: building.latitude,
      longitude: building.longitude,
      images: building.images || [],
    });
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages(building.images || []);
    setError('');
    setSuccess('');
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (building: Building) => {
    setDeletingBuilding(building);
    setIsDeleteDialogOpen(true);
  };

  const handleFormChange = (field: keyof BuildingFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDrop = (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      const rejectedCount = fileRejections.length;
      setError(`${rejectedCount} ${rejectedCount === 1 ? 'plik został' : 'pliki zostały'} odrzucone. Dozwolone: obrazy JPG, PNG, WEBP (max 5MB)`);
      setTimeout(() => setError(''), 5000);
    }

    if (acceptedFiles.length > 0) {
      setImageFiles(prev => [...prev, ...acceptedFiles]);
      
      // Create previews
      acceptedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setImagePreviews(prev => [...prev, reader.result as string]);
          }
        };
        reader.onerror = () => {
          console.error('Error reading file:', file.name);
          setError(`Nie udało się odczytać pliku: ${file.name}`);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDropError = (error: Error) => {
    setError(error.message || 'Wystąpił błąd podczas przesyłania plików');
    setTimeout(() => setError(''), 5000);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    setIsGeocoding(true);

    // Validate required fields
    if (!formData.name.trim() || !formData.street_address.trim() || !formData.city.trim()) {
      setError('Nazwa, adres ulicy i miasto są wymagane');
      setIsSubmitting(false);
      setIsGeocoding(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Get user ID for image uploads
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setError('Musisz być zalogowany, aby zapisać budynek');
        setIsSubmitting(false);
        setIsGeocoding(false);
        return;
      }

      // Geocode address
      const fullAddress = `${formData.street_address}, ${formData.city}${formData.postal_code ? `, ${formData.postal_code}` : ''}, Polska`;
      const geocodeResult = await geocodeAddressWithFallback(fullAddress);
      
      setIsGeocoding(false);

      if (editingBuilding) {
        // Update existing building
        let imageUrls: string[] = [...existingImages];

        // Upload new images if any
        if (imageFiles.length > 0) {
          setIsUploadingImages(true);
          try {
            const { data: uploadedImages, errors: uploadErrors } = await uploadBuildingImages(
              supabase,
              imageFiles,
              editingBuilding.id,
              authUser.id
            );

            if (uploadErrors.length > 0) {
              console.error('Some images failed to upload:', uploadErrors);
              const errorMessages = uploadErrors.map(e => e.error?.message || 'Nieznany błąd').join(', ');
              setError(`${uploadErrors.length} ${uploadErrors.length === 1 ? 'obraz nie został' : 'obrazów nie zostało'} przesłanych: ${errorMessages}`);
            }

            if (uploadedImages.length > 0) {
              imageUrls = [...imageUrls, ...uploadedImages.map(img => img.url)];
            }
          } catch (uploadErr) {
            console.error('Error during image upload:', uploadErr);
            setError('Wystąpił błąd podczas przesyłania obrazów. Spróbuj ponownie.');
          } finally {
            setIsUploadingImages(false);
          }
        }

        const buildingData: BuildingFormData = {
          ...formData,
          latitude: geocodeResult.success ? geocodeResult.latitude : null,
          longitude: geocodeResult.success ? geocodeResult.longitude : null,
          images: imageUrls.length > 0 ? imageUrls : undefined,
        };

        const { data, error: updateError } = await updateBuilding(
          supabase,
          editingBuilding.id,
          buildingData
        );

        if (updateError) {
          setError(updateError.message || 'Nie udało się zaktualizować budynku');
        } else {
          const imageCount = imageUrls.length;
          setSuccess(`Budynek został zaktualizowany pomyślnie${imageCount > 0 ? ` z ${imageCount} ${imageCount === 1 ? 'obrazem' : 'obrazami'}` : ''}`);
          await loadBuildings();
          setTimeout(() => {
            setIsDialogOpen(false);
            setSuccess('');
            setImageFiles([]);
            setImagePreviews([]);
            setExistingImages([]);
          }, 2000);
        }
      } else {
        // Create new building first, then upload images with correct building ID
        const buildingData: BuildingFormData = {
          ...formData,
          latitude: geocodeResult.success ? geocodeResult.latitude : null,
          longitude: geocodeResult.success ? geocodeResult.longitude : null,
          images: [], // Create without images first
        };

        const { data: newBuilding, error: createError } = await createBuilding(
          supabase,
          companyId,
          buildingData
        );

        if (createError) {
          setError(createError.message || 'Nie udało się utworzyć budynku');
          setIsSubmitting(false);
          return;
        }

        if (!newBuilding) {
          setError('Nie udało się utworzyć budynku');
          setIsSubmitting(false);
          return;
        }

        // Upload images if any
        if (imageFiles.length > 0) {
          setIsUploadingImages(true);
          try {
            const { data: uploadedImages, errors: uploadErrors } = await uploadBuildingImages(
              supabase,
              imageFiles,
              newBuilding.id,
              authUser.id
            );

            if (uploadErrors.length > 0) {
              console.error('Some images failed to upload:', uploadErrors);
              const errorMessages = uploadErrors.map(e => e.error?.message || 'Nieznany błąd').join(', ');
              setError(`Budynek został utworzony, ale ${uploadErrors.length} ${uploadErrors.length === 1 ? 'obraz nie został' : 'obrazów nie zostało'} przesłanych: ${errorMessages}`);
            }

            const finalImageUrls = uploadedImages.length > 0 
              ? [...existingImages, ...uploadedImages.map(img => img.url)]
              : existingImages;
            
            // Update building with image URLs if we have any
            if (finalImageUrls.length > 0) {
              const { error: updateError } = await updateBuilding(
                supabase,
                newBuilding.id,
                { ...buildingData, images: finalImageUrls }
              );

              if (updateError) {
                console.error('Error updating building with images:', updateError);
                setError('Budynek został utworzony, ale nie udało się zapisać obrazów. Spróbuj edytować budynek i dodać obrazy ponownie.');
              } else {
                setSuccess(`Budynek został dodany pomyślnie${uploadedImages.length > 0 ? ` z ${uploadedImages.length} ${uploadedImages.length === 1 ? 'obrazem' : 'obrazami'}` : ''}`);
              }
            } else {
              setSuccess('Budynek został dodany pomyślnie');
            }
          } catch (uploadErr) {
            console.error('Error during image upload:', uploadErr);
            setError('Budynek został utworzony, ale wystąpił błąd podczas przesyłania obrazów. Spróbuj edytować budynek i dodać obrazy ponownie.');
          } finally {
            setIsUploadingImages(false);
          }
        } else {
          setSuccess('Budynek został dodany pomyślnie');
        }

        await loadBuildings();
        setTimeout(() => {
          setIsDialogOpen(false);
          setSuccess('');
          setImageFiles([]);
          setImagePreviews([]);
          setExistingImages([]);
        }, 1500);
      }
    } catch (err) {
      setIsGeocoding(false);
      setIsUploadingImages(false);
      setError('Wystąpił błąd podczas zapisywania budynku');
      console.error('Error saving building:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBuilding) return;

    setError('');
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { success, error: deleteError } = await deleteBuilding(supabase, deletingBuilding.id);

      if (deleteError || !success) {
        setError(deleteError?.message || 'Nie udało się usunąć budynku');
      } else {
        setSuccess('Budynek został usunięty pomyślnie');
        await loadBuildings();
        setIsDeleteDialogOpen(false);
        setDeletingBuilding(null);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Wystąpił błąd podczas usuwania budynku');
      console.error('Error deleting building:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBuildingTypeLabel = (type: string | null) => {
    if (!type) return 'Nie określono';
    return BUILDING_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="ml-2 text-sm text-muted-foreground">Ładowanie budynków...</p>
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

      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Zarządzanie budynkami</h4>
            {buildings.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {buildings.length} {buildings.length === 1 ? 'budynek' : 'budynków'}
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleOpenAddDialog}
          >
            <Plus className="h-4 w-4 mr-2" />
            Dodaj budynek
          </Button>
        </div>

        {buildings.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Nie masz jeszcze dodanych budynków
            </p>
            <p className="text-xs text-muted-foreground">
              Kliknij "Dodaj budynek" aby dodać pierwszy budynek
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buildings.map((building) => (
              <Card key={building.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{building.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {building.street_address}, {building.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleOpenEditDialog(building)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleOpenDeleteDialog(building)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Building Images */}
                  {building.images && building.images.length > 0 && (
                    <div className="mb-3">
                      <div className="grid grid-cols-3 gap-2">
                        {building.images.slice(0, 3).map((imageUrl, index) => (
                          <div key={index} className="relative aspect-video rounded-md overflow-hidden border">
                            <img
                              src={imageUrl}
                              alt={`${building.name} - zdjęcie ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Error loading building image:', imageUrl);
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12"%3EBłąd ładowania%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      {building.images.length > 3 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          +{building.images.length - 3} więcej {building.images.length - 3 === 1 ? 'zdjęcia' : 'zdjęć'}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="space-y-2 text-sm">
                    {building.building_type && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getBuildingTypeLabel(building.building_type)}
                        </Badge>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {building.year_built && (
                        <div>Rok budowy: {building.year_built}</div>
                      )}
                      {building.units_count && (
                        <div>Jednostek: {building.units_count}</div>
                      )}
                      {building.floors_count && (
                        <div>Pięter: {building.floors_count}</div>
                      )}
                      {(building.latitude && building.longitude) && (
                        <div className="col-span-2">
                          Współrzędne: {building.latitude.toFixed(6)}, {building.longitude.toFixed(6)}
                        </div>
                      )}
                    </div>
                    {building.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {building.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBuilding ? 'Edytuj budynek' : 'Dodaj nowy budynek'}
            </DialogTitle>
            <DialogDescription>
              Wypełnij formularz aby {editingBuilding ? 'zaktualizować' : 'dodać'} budynek. Adres zostanie automatycznie zgeokodowany.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {(error || success) && (
              <Alert variant={error ? "destructive" : "default"}>
                <AlertDescription>{error || success}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="buildingName">Nazwa budynku *</Label>
                <Input
                  id="buildingName"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="np. Budynek A, Osiedle XYZ"
                  required
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="streetAddress">Adres ulicy *</Label>
                <Input
                  id="streetAddress"
                  value={formData.street_address}
                  onChange={(e) => handleFormChange('street_address', e.target.value)}
                  placeholder="ul. Przykładowa 123"
                  required
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label htmlFor="city">Miasto *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  placeholder="Warszawa"
                  required
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label htmlFor="postalCode">Kod pocztowy</Label>
                <Input
                  id="postalCode"
                  value={formData.postal_code}
                  onChange={(e) => handleFormChange('postal_code', e.target.value)}
                  placeholder="00-000"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="buildingType">Typ budynku</Label>
                <Select
                  value={formData.building_type}
                  onValueChange={(value) => handleFormChange('building_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz typ budynku" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILDING_TYPE_OPTIONS.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label htmlFor="yearBuilt">Rok budowy</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  value={formData.year_built}
                  onChange={(e) => handleFormChange('year_built', e.target.value)}
                  placeholder="2020"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label htmlFor="unitsCount">Liczba jednostek</Label>
                <Input
                  id="unitsCount"
                  type="number"
                  value={formData.units_count}
                  onChange={(e) => handleFormChange('units_count', e.target.value)}
                  placeholder="24"
                  min="0"
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label htmlFor="floorsCount">Liczba pięter</Label>
                <Input
                  id="floorsCount"
                  type="number"
                  value={formData.floors_count}
                  onChange={(e) => handleFormChange('floors_count', e.target.value)}
                  placeholder="5"
                  min="0"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Uwagi/Opis</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Dodatkowe informacje o budynku..."
                  rows={3}
                />
              </div>

              {/* Image Upload Section */}
              <div className="col-span-2 space-y-2">
                <Label>Zdjęcia budynku</Label>
                <Dropzone
                  accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                  maxFiles={10}
                  maxSize={5 * 1024 * 1024} // 5MB
                  minSize={1024} // 1KB
                  onDrop={handleDrop}
                  onError={handleDropError}
                  src={imageFiles}
                >
                  <DropzoneEmptyState>
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Upload className="h-4 w-4" />
                      </div>
                      <p className="my-2 w-full truncate text-wrap font-medium text-sm">
                        Przeciągnij zdjęcia tutaj lub kliknij aby wybrać
                      </p>
                      <p className="w-full truncate text-wrap text-muted-foreground text-xs">
                        Dozwolone: JPG, PNG, WEBP (max 5MB na plik)
                      </p>
                    </div>
                  </DropzoneEmptyState>
                  <DropzoneContent>
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Upload className="h-4 w-4" />
                      </div>
                      <p className="my-2 w-full truncate text-wrap font-medium text-sm">
                        {imageFiles.length} {imageFiles.length === 1 ? 'plik wybrany' : 'plików wybranych'}
                      </p>
                      <p className="w-full truncate text-wrap text-muted-foreground text-xs">
                        Przeciągnij nowe zdjęcia tutaj lub kliknij aby zastąpić
                      </p>
                    </div>
                  </DropzoneContent>
                </Dropzone>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Istniejące zdjęcia</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {existingImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Budynek ${index + 1}`}
                            className="w-full h-24 object-cover rounded-md border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeExistingImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Nowe zdjęcia ({imagePreviews.length})</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Podgląd ${index + 1}`}
                            className="w-full h-24 object-cover rounded-md border"
                            onError={(e) => {
                              console.error('Error loading image preview:', preview);
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ccc"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3EBłąd%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isGeocoding && (
                <div className="col-span-2">
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Geokodowanie adresu...
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Anuluj
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isGeocoding || isUploadingImages}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isGeocoding ? 'Geokodowanie...' : isUploadingImages ? 'Przesyłanie zdjęć...' : 'Zapisywanie...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {editingBuilding ? 'Zapisz zmiany' : 'Dodaj budynek'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć budynek?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć budynek "{deletingBuilding?.name}"? 
              Ta operacja jest nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Usuwanie...
                </>
              ) : (
                'Usuń'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

