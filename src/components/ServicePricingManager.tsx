'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
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
    unit: '',
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

  // Helper function to format pricing
  const formatPrice = (pricing: ServicePricing): string => {
    if (!pricing) return 'Brak ceny';

    const currency = pricing.currency || 'PLN';
    const unit = pricing.unit ? ` ${pricing.unit}` : '';

    switch (pricing.type) {
      case 'hourly':
        if (pricing.min && pricing.max && pricing.min !== pricing.max) {
          return `${pricing.min} - ${pricing.max} ${currency}/h${unit}`;
        }
        return `${pricing.min || 0} ${currency}/h${unit}`;
      case 'fixed':
        return `${pricing.min || 0} ${currency}${unit}`;
      case 'range':
        return `${pricing.min || 0} - ${pricing.max || 0} ${currency}${unit}`;
      default:
        return 'Brak ceny';
    }
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
      unit: '',
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
        unit: '',
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
        const { serviceName: _, ...pricingData } = formData;
        const updatedPricing = {
          ...servicePricing,
          [finalServiceName]: pricingData as ServicePricing
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

      {/* Services as Cards */}
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
              Nie masz jeszcze dodanych usług. Kliknij "Dodaj usługę" powyżej, aby rozpocząć.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allServices.map((service) => {
            const category = getServiceCategory(service);
            const pricing = servicePricing[service];
            
            return (
              <Card key={service} className="flex flex-col h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{service}</CardTitle>
                      {category && (
                        <Badge 
                          variant={
                            category === 'primary' ? 'default' : 
                            category === 'secondary' ? 'outline' : 
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {category === 'primary' ? 'Usługa podstawowa' : 
                           category === 'secondary' ? 'Usługa dodatkowa' : 
                           'Specjalizacja'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 space-y-4">
                  <div className="space-y-3 flex-1">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">Cena:</span>
                        <span className={pricing ? 'text-gray-900 font-semibold' : 'text-gray-500'}>
                          {pricing ? formatPrice(pricing) : 'Brak ceny'}
                        </span>
                      </div>
                      {pricing && (
                        <div className="text-xs text-gray-600 space-y-1.5 border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Typ ceny:</span>
                            <span className="font-medium">
                              {pricing.type === 'hourly' ? 'Stawka godzinowa' :
                               pricing.type === 'fixed' ? 'Cena stała' :
                               'Zakres cen'}
                            </span>
                          </div>
                          {pricing.min !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Cena min:</span>
                              <span className="font-medium">{pricing.min} {pricing.currency || 'PLN'}</span>
                            </div>
                          )}
                          {pricing.max !== undefined && pricing.max !== pricing.min && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Cena max:</span>
                              <span className="font-medium">{pricing.max} {pricing.currency || 'PLN'}</span>
                            </div>
                          )}
                          {pricing.unit && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Jednostka:</span>
                              <span className="font-medium">{pricing.unit}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 mt-auto border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditService(service)}
                      disabled={saving}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edytuj
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDeleteService(service)}
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
            unit: '',
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
                  <Input
                    type="text"
                    value={formData.unit || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, unit: e.target.value });
                    }}
                    placeholder="np. per m², per projekt"
                  />
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

