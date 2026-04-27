'use client';

import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';

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

const VAT_OPTIONS = [0, 5, 8, 23];

export default function ServicePricingManager({ companyId, services: initialServices, onServicesUpdate }: ServicePricingManagerProps) {
  const [servicePricing, setServicePricing] = useState<Record<string, ServicePricing>>({});
  const [services, setServices] = useState(initialServices);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [enablePricing, setEnablePricing] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editingServiceName, setEditingServiceName] = useState<string | null>(null);
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

  // Debug: log services to help diagnose - MUST be before any conditional returns
  useEffect(() => {
    const allServicesCount = [
      ...new Set([
        ...services.primary,
        ...services.secondary,
        ...services.specializations
      ])
    ].length;
    
    console.log('ServicePricingManager - Services:', {
      primary: services.primary,
      secondary: services.secondary,
      specializations: services.specializations,
      totalServices: allServicesCount
    });
  }, [services.primary, services.secondary, services.specializations]);

  // Service management handlers
  const handleAddService = () => {
    setEditingServiceName(null);
    setEditingService(null);
    setEnablePricing(false);
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
      serviceName: undefined
    });
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
    
    const hasPricing = !!servicePricing[serviceName];
    
    setEditingServiceName(serviceName);
    setEditingService(null);
    setEnablePricing(hasPricing);
    setServiceFormData({
      name: serviceName,
      category
    });
    if (hasPricing) {
      setFormData({
        ...servicePricing[serviceName],
        serviceName: serviceName
      });
    } else {
      setFormData({
        type: 'hourly',
        min: undefined,
        max: undefined,
        currency: 'PLN',
        unit: undefined,
        serviceName: serviceName
      });
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
        
        // Save pricing
        const netPrice = formData.netPrice ?? formData.min ?? 0;
        const vatRate = formData.vatRate ?? 23;
        const grossPrice = Number((netPrice * (1 + vatRate / 100)).toFixed(2));
        const { serviceName: _serviceName, ...pricingData } = formData;
        const updatedPricing = {
          ...servicePricing,
          [finalServiceName]: {
            ...(pricingData as ServicePricing),
            category: serviceFormData.category,
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
        // Remove pricing if disabled
        if (servicePricing[finalServiceName]) {
          const updatedPricing = { ...servicePricing };
          delete updatedPricing[finalServiceName];
          setServicePricing(updatedPricing);
          await updateContractorServicePricing(companyId, updatedPricing);
        }
        
        // Also handle service name change (only if not just editing pricing)
        if (!editingService && editingServiceName && editingServiceName !== serviceFormData.name) {
          if (servicePricing[editingServiceName]) {
            const updatedPricing = { ...servicePricing };
            delete updatedPricing[editingServiceName];
            setServicePricing(updatedPricing);
            await updateContractorServicePricing(companyId, updatedPricing);
          }
        }
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
                  <TableHead>Kategoria usługi</TableHead>
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
                  return (
                    <TableRow key={service}>
                      <TableCell>
                        {category && (
                          <Badge variant={category === 'primary' ? 'default' : category === 'secondary' ? 'outline' : 'secondary'}>
                            {category === 'primary' ? 'Usługa podstawowa' : category === 'secondary' ? 'Usługa dodatkowa' : 'Specjalizacja'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{pricing?.subcategory || '-'}</TableCell>
                      <TableCell>{pricing?.workDescription || service}</TableCell>
                      <TableCell>{pricing?.unit || '-'}</TableCell>
                      <TableCell>{pricing?.netPrice !== undefined ? `${pricing.netPrice} PLN` : '-'}</TableCell>
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
          setFormData({
            type: 'hourly',
            min: undefined,
            max: undefined,
            currency: 'PLN',
            unit: undefined,
            serviceName: undefined
          });
          setServiceFormData({
            name: '',
            category: 'primary'
          });
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
                {allServices.filter(s => !servicePricing[s]).length > 0 ? (
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
                        .filter(s => !servicePricing[s])
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

            {/* Service Category */}
            <div className="space-y-2">
              <Label>Kategoria</Label>
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
                  <Label>Typ ceny</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'hourly' | 'fixed' | 'range') => {
                      setFormData({ ...formData, type: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Stawka godzinowa</SelectItem>
                      <SelectItem value="fixed">Cena stała</SelectItem>
                      <SelectItem value="range">Zakres cen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cena min {formData.type === 'hourly' && '(zł/h)'}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.min || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, min: e.target.value ? parseFloat(e.target.value) : undefined });
                      }}
                      placeholder="0"
                    />
                  </div>

                  {(formData.type === 'range' || formData.type === 'hourly') && (
                    <div className="space-y-2">
                      <Label>Cena max {formData.type === 'hourly' && '(zł/h)'}</Label>
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

                <div className="space-y-2">
                  <Label>Jednostka (opcjonalnie)</Label>
                  <Select
                    value={formData.unit || ''}
                    onValueChange={(value) => setFormData({ ...formData, unit: value as ServicePricing['unit'] })}
                  >
                    <SelectTrigger>
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cena netto</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.netPrice ?? formData.min ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        setFormData({ ...formData, netPrice: value, min: value });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stawka VAT</Label>
                    <Select
                      value={String(formData.vatRate ?? 23)}
                      onValueChange={(value) => setFormData({ ...formData, vatRate: Number(value) })}
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
                      disabled
                      value={
                        formData.netPrice !== undefined
                          ? `${(formData.netPrice * (1 + (formData.vatRate ?? 23) / 100)).toFixed(2)} PLN`
                          : '-'
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

