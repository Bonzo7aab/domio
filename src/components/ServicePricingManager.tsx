'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ServicePricing } from '../types/contractor';
import { 
  fetchContractorServicePricing, 
  updateContractorServicePricing,
  updateContractorServices 
} from '../lib/database/contractors';
import { createClient } from '../lib/supabase/client';
import { fetchAllCategoriesWithSubcategories } from '../lib/database/categories';
import type { CategoryWithSubcategories } from '../lib/database/categories';
import { toast } from 'sonner';

const PROFILE_SERVICE_BUCKETS = ['primary', 'secondary', 'specializations'] as const;

function isLegacyPricingCategory(category: string | undefined): boolean {
  return !!category && PROFILE_SERVICE_BUCKETS.includes(category as (typeof PROFILE_SERVICE_BUCKETS)[number]);
}

function hasMonetaryPricing(pricing: ServicePricing | undefined): boolean {
  return !!(
    pricing &&
    (pricing.netPrice !== undefined || (pricing.min !== undefined && pricing.min > 0))
  );
}

function computeGrossFromNet(net: number | undefined, vatPercent: number | undefined): number | undefined {
  if (net === undefined || !Number.isFinite(net) || net <= 0) return undefined;
  const vat = vatPercent ?? 23;
  return Number((net * (1 + vat / 100)).toFixed(2));
}

interface ServicePricingManagerProps {
  companyId: string;
  services: {
    primary: string[];
    secondary: string[];
    specializations: string[];
  };
  onServicesUpdate?: () => void; // Callback to refresh parent
}

const UNIT_OPTIONS: Array<'m2' | 'szt.' | 'mb' | 'kg' | '1 godzina' | 'miesiąc'> = [
  'm2',
  'szt.',
  'mb',
  'kg',
  '1 godzina',
  'miesiąc',
];

/** UI choice for main „Typ ceny” picker (distinct from DB row when fixed + brak jednostki vs Jednostka). */
type PriceTypeChoice = 'hourly' | 'range' | 'fixed' | 'unit';

function derivePriceTypeChoice(pricing: Pick<ServicePricing, 'type' | 'unit'>): PriceTypeChoice {
  if (pricing.type === 'hourly') return 'hourly';
  if (pricing.type === 'range') return 'range';
  if (pricing.type === 'fixed' && pricing.unit) return 'unit';
  return 'fixed';
}

const VAT_OPTIONS = [0, 5, 8, 23];

export default function ServicePricingManager({ companyId, services: initialServices, onServicesUpdate }: ServicePricingManagerProps) {
  const supabase = useMemo(() => createClient(), []);
  const [categoriesFromDb, setCategoriesFromDb] = useState<CategoryWithSubcategories[]>([]);
  const [jobMarketCategoryName, setJobMarketCategoryName] = useState('');
  const [jobMarketSubcategoryName, setJobMarketSubcategoryName] = useState('');
  const [servicePricing, setServicePricing] = useState<Record<string, ServicePricing>>({});
  const [services, setServices] = useState(initialServices);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [enablePricing, setEnablePricing] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editingServiceName, setEditingServiceName] = useState<string | null>(null);
  const [priceTypeChoice, setPriceTypeChoice] = useState<PriceTypeChoice>('hourly');
  const [formData, setFormData] = useState<ServicePricing & { serviceName?: string }>({
    type: 'hourly',
    min: undefined,
    max: undefined,
    currency: 'PLN',
    unit: undefined,
    serviceName: undefined
  });
  const [serviceFormData, setServiceFormData] = useState<{
    name: string;
    category: 'primary' | 'secondary' | 'specializations';
  }>({
    name: '',
    category: 'primary'
  });

  // Get all unique services from primary, secondary, and specializations
  const allServices = [
    ...new Set([
      ...services.primary,
      ...services.secondary,
      ...services.specializations
    ])
  ].sort();

  // Helper function to get service category
  const getServiceCategory = (serviceName: string): 'primary' | 'secondary' | 'specializations' | null => {
    if (services.primary.includes(serviceName)) return 'primary';
    if (services.secondary.includes(serviceName)) return 'secondary';
    if (services.specializations.includes(serviceName)) return 'specializations';
    return null;
  };

  // Update services when props change
  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  const selectedMarketCategory = useMemo(
    () => categoriesFromDb.find((c) => c.name === jobMarketCategoryName),
    [categoriesFromDb, jobMarketCategoryName]
  );

  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await fetchAllCategoriesWithSubcategories(supabase);
      if (data) {
        setCategoriesFromDb(data);
      }
    };
    loadCategories();
  }, [supabase]);

  useEffect(() => {
    const loadPricing = async () => {
      if (!companyId) return;

      try {
        setLoading(true);
        const pricing = await fetchContractorServicePricing(companyId);
        setServicePricing(pricing);
      } catch (error) {
        console.error('Error loading service pricing:', error);
        toast.error('Nie udało się załadować cen usług');
      } finally {
        setLoading(false);
      }
    };

    loadPricing();
  }, [companyId]);

  // Service management handlers
  const handleAddService = () => {
    setEditingServiceName(null);
    setEditingService(null);
    setEnablePricing(false);
    setJobMarketCategoryName('');
    setJobMarketSubcategoryName('');
    setServiceFormData({
      name: '',
      category: 'primary'
    });
    setFormData({
      type: 'hourly',
      min: undefined,
      max: undefined,
      currency: 'PLN',
      unit: undefined,
      serviceName: undefined,
      netPrice: undefined,
      vatRate: undefined,
      grossPrice: undefined,
    });
    setPriceTypeChoice('hourly');
    setShowDialog(true);
  };

  const handleEditService = (serviceName: string) => {
    // Determine which category the service belongs to
    let category: 'primary' | 'secondary' | 'specializations' = 'primary';
    if (services.primary.includes(serviceName)) {
      category = 'primary';
    } else if (services.secondary.includes(serviceName)) {
      category = 'secondary';
    } else if (services.specializations.includes(serviceName)) {
      category = 'specializations';
    }
    
    const pricingSnapshot = servicePricing[serviceName];
    const hasPricing = hasMonetaryPricing(pricingSnapshot);
    
    setEditingServiceName(serviceName);
    setEditingService(null);
    setEnablePricing(hasPricing);
    setServiceFormData({
      name: serviceName,
      category
    });
    const storedMarketCat = pricingSnapshot?.category;
    const storedMarketSub = pricingSnapshot?.subcategory;
    if (storedMarketCat && !isLegacyPricingCategory(storedMarketCat)) {
      setJobMarketCategoryName(storedMarketCat);
      setJobMarketSubcategoryName(storedMarketSub || '');
    } else {
      setJobMarketCategoryName('');
      setJobMarketSubcategoryName('');
    }
    if (hasPricing) {
      const p = servicePricing[serviceName];
      const netBase = p.min ?? p.netPrice;
      const vat = p.vatRate ?? 23;
      const gross = p.grossPrice ?? computeGrossFromNet(netBase, vat);
      const merged: ServicePricing & { serviceName?: string } = {
        ...p,
        serviceName: serviceName,
        min: netBase,
        grossPrice: gross,
      };
      if (merged.type === 'hourly' || merged.type === 'range') {
        merged.unit = undefined;
      }
      setFormData(merged);
      setPriceTypeChoice(derivePriceTypeChoice(merged));
    } else {
      setFormData({
        type: 'hourly',
        min: undefined,
        max: undefined,
        currency: 'PLN',
        unit: undefined,
        serviceName: serviceName,
        netPrice: undefined,
        vatRate: undefined,
        grossPrice: undefined,
      });
      setPriceTypeChoice('hourly');
    }
    setShowDialog(true);
  };

  const handleDeleteService = async (serviceName: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć usługę "${serviceName}"? To również usunie przypisaną do niej cenę.`)) {
      return;
    }

    try {
      setSaving(true);
      
      // Remove service from all categories
      const updatedServices = {
        primary: services.primary.filter(s => s !== serviceName),
        secondary: services.secondary.filter(s => s !== serviceName),
        specializations: services.specializations.filter(s => s !== serviceName)
      };
      
      const { error } = await updateContractorServices(companyId, updatedServices);
      
      if (error) {
        throw error;
      }

      // Remove pricing for this service
      const updatedPricing = { ...servicePricing };
      delete updatedPricing[serviceName];
      
      if (Object.keys(updatedPricing).length !== Object.keys(servicePricing).length) {
        await updateContractorServicePricing(companyId, updatedPricing);
        setServicePricing(updatedPricing);
      }

      setServices(updatedServices);
      toast.success('Usługa została usunięta');
      
      // Refresh parent component
      if (onServicesUpdate) {
        onServicesUpdate();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Nie udało się usunąć usługi');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveService = async () => {
    const serviceName = editingService || serviceFormData.name || formData.serviceName;
    if (!serviceName?.trim()) {
      toast.error('Podaj nazwę usługi');
      return;
    }

    if (categoriesFromDb.length === 0) {
      toast.error('Ładowanie kategorii — poczekaj chwilę i spróbuj ponownie');
      return;
    }

    if (!jobMarketCategoryName.trim() || !jobMarketSubcategoryName.trim()) {
      toast.error('Wybierz kategorię i podkategorię');
      return;
    }

    const categoryMatch = categoriesFromDb.find((c) => c.name === jobMarketCategoryName);
    const subcategoryValid = categoryMatch?.subcategories.some((s) => s.name === jobMarketSubcategoryName);
    if (!categoryMatch || !subcategoryValid) {
      toast.error('Wybierz prawidłową parę kategoria i podkategoria');
      return;
    }

    try {
      setSaving(true);
      
      // If only editing pricing (editingService set), skip service updates
      if (!editingService) {
        const updatedServices = { ...services };
      
      if (editingServiceName) {
        // Editing existing service - remove from all categories first
        updatedServices.primary = updatedServices.primary.filter(s => s !== editingServiceName);
        updatedServices.secondary = updatedServices.secondary.filter(s => s !== editingServiceName);
        updatedServices.specializations = updatedServices.specializations.filter(s => s !== editingServiceName);
        
        // Check if new name already exists (excluding current service)
        const allServicesList = [
          ...updatedServices.primary,
          ...updatedServices.secondary,
          ...updatedServices.specializations
        ];
        if (serviceFormData.name !== editingServiceName && allServicesList.includes(serviceFormData.name)) {
          toast.error('Usługa o tej nazwie już istnieje');
          return;
        }
        
        // If name changed, update pricing key
        if (editingServiceName !== serviceFormData.name && servicePricing[editingServiceName]) {
          const pricing = servicePricing[editingServiceName];
          const updatedPricing = { ...servicePricing };
          delete updatedPricing[editingServiceName];
          updatedPricing[serviceFormData.name] = pricing;
          setServicePricing(updatedPricing);
          await updateContractorServicePricing(companyId, updatedPricing);
        }
      } else {
        // Adding new service - check for duplicates
        const allServicesList = [
          ...updatedServices.primary,
          ...updatedServices.secondary,
          ...updatedServices.specializations
        ];
        if (allServicesList.includes(serviceFormData.name)) {
          toast.error('Ta usługa już istnieje');
          return;
        }
      }
      
      // Add to selected category (only if not already there)
      if (!updatedServices[serviceFormData.category].includes(serviceFormData.name)) {
        updatedServices[serviceFormData.category] = [
          ...updatedServices[serviceFormData.category],
          serviceFormData.name
        ].sort(); // Keep services sorted
      }
      
      const { error } = await updateContractorServices(companyId, updatedServices);
      
      if (error) {
        throw error;
      }

        setServices(updatedServices);
      }
      
      // Handle pricing if enabled
      let finalServiceName = editingService || serviceFormData.name || formData.serviceName;
      if (!finalServiceName?.trim()) {
        toast.error('Podaj nazwę usługi');
        return;
      }
      
      if (enablePricing) {
        // Validate pricing if enabled
        if (priceTypeChoice === 'unit' && !formData.unit) {
          toast.error('Wybierz jednostkę');
          return;
        }
        if (formData.type === 'hourly' || formData.type === 'fixed') {
          if (!formData.min || formData.min <= 0) {
            toast.error('Podaj prawidłową cenę minimalną');
            return;
          }
        }
        if (formData.type === 'range') {
          if (!formData.min || !formData.max || formData.min <= 0 || formData.max <= formData.min) {
            toast.error('Podaj prawidłowy zakres cen (min < max)');
            return;
          }
        }
        
        // Handle service name change for pricing (only if not just editing pricing)
        if (!editingService && editingServiceName && editingServiceName !== serviceFormData.name) {
          // Service name changed - update pricing key
          if (servicePricing[editingServiceName]) {
            const updatedPricing = { ...servicePricing };
            const pricing = updatedPricing[editingServiceName];
            delete updatedPricing[editingServiceName];
            updatedPricing[serviceFormData.name] = pricing;
            setServicePricing(updatedPricing);
            await updateContractorServicePricing(companyId, updatedPricing);
            finalServiceName = serviceFormData.name;
          }
        }
        
        // Save pricing (single net amount from min)
        const netPrice = formData.min ?? 0;
        const vatRate = formData.vatRate ?? 23;
        const grossPrice =
          formData.grossPrice ??
          computeGrossFromNet(netPrice > 0 ? netPrice : undefined, vatRate) ??
          Number((netPrice * (1 + vatRate / 100)).toFixed(2));
        const {
          serviceName: _serviceName,
          category: _discardCat,
          subcategory: _discardSub,
          netPrice: _discardNet,
          ...pricingData
        } = formData;
        const updatedPricing = {
          ...servicePricing,
          [finalServiceName]: {
            ...(pricingData as ServicePricing),
            category: jobMarketCategoryName,
            subcategory: jobMarketSubcategoryName,
            workDescription: finalServiceName,
            netPrice,
            vatRate,
            grossPrice,
          }
        };
        
        const { error: pricingError } = await updateContractorServicePricing(companyId, updatedPricing);
        if (pricingError) {
          throw pricingError;
        }
        
        setServicePricing(updatedPricing);
      } else {
        let updatedPricing = { ...servicePricing };

        if (
          !editingService &&
          editingServiceName &&
          editingServiceName !== serviceFormData.name &&
          updatedPricing[editingServiceName]
        ) {
          const pricing = updatedPricing[editingServiceName];
          delete updatedPricing[editingServiceName];
          updatedPricing[serviceFormData.name] = pricing;
          finalServiceName = serviceFormData.name;
        }

        updatedPricing = {
          ...updatedPricing,
          [finalServiceName]: {
            type: 'hourly',
            currency: 'PLN',
            category: jobMarketCategoryName,
            subcategory: jobMarketSubcategoryName,
            workDescription: finalServiceName.trim(),
          },
        };

        const { error: pricingErrorMinimal } = await updateContractorServicePricing(
          companyId,
          updatedPricing
        );
        if (pricingErrorMinimal) {
          throw pricingErrorMinimal;
        }

        setServicePricing(updatedPricing);
      }
      
      toast.success(editingService ? 'Cena została zaktualizowana' : (editingServiceName ? 'Usługa została zaktualizowana' : 'Usługa została dodana'));
      setShowDialog(false);
      
      // Refresh parent component
      if (onServicesUpdate) {
        onServicesUpdate();
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Nie udało się zapisać usługi');
    } finally {
      setSaving(false);
    }
  };

  const recalculateGrossFromForm = () => {
    setFormData((prev) => {
      const net = prev.min;
      const vat = prev.vatRate ?? 23;
      return { ...prev, grossPrice: computeGrossFromNet(net, vat) };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cennik usług</h2>
          <p className="text-gray-600 mt-1">
            Zarządzaj cenami dla swoich usług
          </p>
          {allServices.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Znaleziono {allServices.length} {allServices.length === 1 ? 'usługę' : allServices.length < 5 ? 'usługi' : 'usług'} w Twoim profilu
            </p>
          )}
        </div>
      </div>

      {/* Services table */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Twoje usługi</h3>
        <Button 
          onClick={handleAddService}
          disabled={saving}
        >
          <Plus className="w-4 h-4 mr-2" />
          Dodaj usługę
        </Button>
      </div>

      {allServices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-sm text-gray-600 mb-3">
              Nie masz jeszcze dodanych usług. Kliknij &quot;Dodaj usługę&quot; powyżej, aby rozpocząć.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ w profilu</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead>Podkategoria</TableHead>
                  <TableHead>Wykonywane prace</TableHead>
                  <TableHead>Jednostka</TableHead>
                  <TableHead>Cena Netto</TableHead>
                  <TableHead>Stawka VAT</TableHead>
                  <TableHead>Cena Brutto</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allServices.map((service) => {
                  const category = getServiceCategory(service);
                  const pricing = servicePricing[service];
                  const marketCategory =
                    pricing?.category && !isLegacyPricingCategory(pricing.category)
                      ? pricing.category
                      : null;
                  return (
                    <TableRow key={service}>
                      <TableCell>
                        {category && (
                          <Badge variant={category === 'primary' ? 'default' : category === 'secondary' ? 'outline' : 'secondary'}>
                            {category === 'primary' ? 'Usługa podstawowa' : category === 'secondary' ? 'Usługa dodatkowa' : 'Specjalizacja'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{marketCategory || '—'}</TableCell>
                      <TableCell>{pricing?.subcategory || '—'}</TableCell>
                      <TableCell>{pricing?.workDescription || service}</TableCell>
                      <TableCell>{pricing?.unit || '-'}</TableCell>
                      <TableCell>
                        {pricing?.min !== undefined || pricing?.netPrice !== undefined
                          ? `${pricing?.min ?? pricing?.netPrice} PLN`
                          : '—'}
                      </TableCell>
                      <TableCell>{pricing?.vatRate !== undefined ? `${pricing.vatRate}%` : '-'}</TableCell>
                      <TableCell>{pricing?.grossPrice !== undefined ? `${pricing.grossPrice.toFixed(2)} PLN` : '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditService(service)} disabled={saving}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edytuj
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteService(service)} disabled={saving}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Unified Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) {
          // Reset all state when dialog closes
          setEditingService(null);
          setEditingServiceName(null);
          setEnablePricing(false);
          setJobMarketCategoryName('');
          setJobMarketSubcategoryName('');
          setFormData({
            type: 'hourly',
            min: undefined,
            max: undefined,
            currency: 'PLN',
            unit: undefined,
            serviceName: undefined,
            netPrice: undefined,
            vatRate: undefined,
            grossPrice: undefined,
          });
          setServiceFormData({
            name: '',
            category: 'primary'
          });
          setPriceTypeChoice('hourly');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingServiceName || editingService
                ? (editingService ? 'Edytuj cenę usługi' : 'Edytuj usługę')
                : (serviceFormData.name || formData.serviceName
                    ? 'Dodaj usługę i cenę'
                    : 'Dodaj nową usługę')}
            </DialogTitle>
            <DialogDescription>
              {editingServiceName || editingService
                ? (editingService 
                    ? `Edytuj cenę dla usługi: ${editingService}`
                    : 'Zmień nazwę, kategorię lub cenę usługi.')
                : 'Dodaj nową usługę do swojego profilu. Opcjonalnie możesz ustawić cenę.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Service Selection/Name */}
            {!editingService && !editingServiceName && !serviceFormData.name && !formData.serviceName && (
              <div className="space-y-2">
                <Label>Usługa</Label>
                {allServices.filter((s) => !hasMonetaryPricing(servicePricing[s])).length > 0 ? (
                  <Select
                    value={formData.serviceName || serviceFormData.name || ''}
                    onValueChange={(value) => {
                      // Find which category this service belongs to
                      let category: 'primary' | 'secondary' | 'specializations' = 'primary';
                      if (services.primary.includes(value)) {
                        category = 'primary';
                      } else if (services.secondary.includes(value)) {
                        category = 'secondary';
                      } else if (services.specializations.includes(value)) {
                        category = 'specializations';
                      }
                      setServiceFormData({ name: value, category });
                      setFormData({ ...formData, serviceName: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz istniejącą usługę" />
                    </SelectTrigger>
                    <SelectContent>
                      {allServices
                        .filter((s) => !hasMonetaryPricing(servicePricing[s]))
                        .map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : null}
                <div className="text-sm text-gray-500">
                  lub wprowadź nazwę nowej usługi poniżej
                </div>
              </div>
            )}

            {/* Service Name */}
            <div className="space-y-2">
              <Label>Nazwa usługi</Label>
              <Input
                type="text"
                value={serviceFormData.name || formData.serviceName || editingService || ''}
                onChange={(e) => {
                  if (!editingService) {
                    const newName = e.target.value;
                    setServiceFormData({ ...serviceFormData, name: newName });
                    setFormData({ ...formData, serviceName: newName });
                  }
                }}
                disabled={!!editingService}
                placeholder="np. Remonty mieszkań"
              />
            </div>

            {/* Profile bucket (primary / secondary / specializations) */}
            <div className="space-y-2">
              <Label>Typ usługi w profilu</Label>
              <Select
                value={serviceFormData.category}
                onValueChange={(value: 'primary' | 'secondary' | 'specializations') => {
                  setServiceFormData({ ...serviceFormData, category: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Usługi podstawowe</SelectItem>
                  <SelectItem value="secondary">Usługi dodatkowe</SelectItem>
                  <SelectItem value="specializations">Specjalizacje</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Marketplace category + subcategory (same source as homepage filters) */}
            <div className="space-y-2">
              <Label>Kategoria</Label>
              <Select
                value={jobMarketCategoryName}
                onValueChange={(name) => {
                  setJobMarketCategoryName(name);
                  setJobMarketSubcategoryName('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesFromDb.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Podkategoria</Label>
              <Select
                value={jobMarketSubcategoryName}
                onValueChange={setJobMarketSubcategoryName}
                disabled={!jobMarketCategoryName}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      jobMarketCategoryName ? 'Wybierz podkategorię' : 'Najpierw wybierz kategorię'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(selectedMarketCategory?.subcategories ?? []).map((sub) => (
                    <SelectItem key={sub.id} value={sub.name}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Enable Pricing Switch */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="enable-pricing">Dodaj cenę</Label>
                <p className="text-sm text-gray-500">Włącz, aby ustawić cenę dla tej usługi</p>
              </div>
              <Switch
                id="enable-pricing"
                checked={enablePricing}
                onCheckedChange={setEnablePricing}
              />
            </div>

            {/* Pricing Fields - Conditionally Shown */}
            {enablePricing && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Typ ceny (netto)</Label>
                  <Select
                    value={priceTypeChoice}
                    onValueChange={(value: PriceTypeChoice) => {
                      setPriceTypeChoice(value);
                      setFormData((prev) => {
                        if (value === 'hourly') {
                          return { ...prev, type: 'hourly', unit: undefined };
                        }
                        if (value === 'range') {
                          return { ...prev, type: 'range', unit: undefined };
                        }
                        if (value === 'fixed') {
                          return { ...prev, type: 'fixed', unit: undefined };
                        }
                        return { ...prev, type: 'fixed', unit: undefined };
                      });
                    }}
                  >
                    <SelectTrigger aria-label="Typ ceny">
                      <SelectValue placeholder="Wybierz typ ceny" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Stawka godzinowa</SelectItem>
                      <SelectItem value="range">Zakres cen</SelectItem>
                      <SelectItem value="fixed">Cena stała</SelectItem>
                      <SelectItem value="unit">Jednostka</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {priceTypeChoice === 'unit' && (
                  <div className="space-y-2">
                    <Label>Jednostka</Label>
                    <Select
                      value={formData.unit ?? ''}
                      onValueChange={(u) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: 'fixed',
                          unit: u as ServicePricing['unit'],
                        }))
                      }
                    >
                      <SelectTrigger aria-label="Jednostka ceny">
                        <SelectValue placeholder="Wybierz jednostkę" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Cena min (netto)
                      {formData.type === 'hourly'
                        ? ' · zł/h'
                        : priceTypeChoice === 'unit' && formData.unit
                          ? ` · za ${formData.unit}`
                          : ''}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.min || ''}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          min: e.target.value ? parseFloat(e.target.value) : undefined,
                        });
                      }}
                      onBlur={recalculateGrossFromForm}
                      placeholder="0"
                    />
                  </div>

                  {(formData.type === 'range' || formData.type === 'hourly') && (
                    <div className="space-y-2">
                      <Label>
                        Cena max (netto)
                        {formData.type === 'hourly'
                          ? ' · zł/h'
                          : priceTypeChoice === 'unit' && formData.unit
                            ? ` · za ${formData.unit}`
                            : ''}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.max || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, max: e.target.value ? parseFloat(e.target.value) : undefined });
                        }}
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stawka VAT</Label>
                    <Select
                      value={String(formData.vatRate ?? 23)}
                      onValueChange={(value) => {
                        const vatRate = Number(value);
                        setFormData((prev) => {
                          const grossPrice = computeGrossFromNet(prev.min, vatRate);
                          return { ...prev, vatRate, grossPrice };
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="VAT" />
                      </SelectTrigger>
                      <SelectContent>
                        {VAT_OPTIONS.map((rate) => (
                          <SelectItem key={rate} value={String(rate)}>
                            {rate}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cena brutto</Label>
                    <Input
                      readOnly
                      disabled
                      className="bg-muted"
                      placeholder="Uzupełni się po podaniu netto"
                      value={
                        formData.grossPrice !== undefined
                          ? `${formData.grossPrice.toFixed(2)} PLN`
                          : ''
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSaveService} disabled={saving || !(serviceFormData.name || formData.serviceName)?.trim()}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                editingServiceName || editingService ? 'Zapisz zmiany' : 'Zapisz'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

