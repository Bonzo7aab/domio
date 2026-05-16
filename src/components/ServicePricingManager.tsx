'use client';

import { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
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

const UNIT_OPTIONS = [
  'm2',
  'szt.',
  'mb',
  'kg',
  '1 godzina',
  'miesiąc',
] as const;

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
  const [editingServiceName, setEditingServiceName] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServicePricing & { serviceName?: string }>({
    type: 'fixed',
    min: undefined,
    max: undefined,
    currency: 'PLN',
    unit: undefined,
    vatRate: 23,
    serviceName: undefined,
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

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollable, setTableScrollable] = useState(false);

  const updateTableScrollable = useCallback(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    setTableScrollable(el.scrollWidth > el.clientWidth + 2);
  }, []);

  useLayoutEffect(() => {
    updateTableScrollable();
  }, [services, servicePricing, loading, updateTableScrollable]);

  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateTableScrollable());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateTableScrollable]);

  const scrollTableBy = useCallback((delta: number) => {
    tableScrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  // Update services when props change
  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  const selectedMarketCategory = useMemo(
    () => categoriesFromDb.find((c) => c.name === jobMarketCategoryName),
    [categoriesFromDb, jobMarketCategoryName]
  );

  const unitSelectOptions = useMemo(() => {
    const u = formData.unit?.trim();
    const base = [...UNIT_OPTIONS] as string[];
    if (u && !base.includes(u)) {
      return [u, ...base];
    }
    return base;
  }, [formData.unit]);

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
    setJobMarketCategoryName('');
    setJobMarketSubcategoryName('');
    setServiceFormData({
      name: '',
      category: 'primary',
    });
    setFormData({
      type: 'fixed',
      min: undefined,
      max: undefined,
      currency: 'PLN',
      unit: undefined,
      serviceName: undefined,
      netPrice: undefined,
      vatRate: 23,
      grossPrice: undefined,
    });
    setShowDialog(true);
  };

  const handleEditService = (serviceName: string) => {
    let category: 'primary' | 'secondary' | 'specializations' = 'primary';
    if (services.primary.includes(serviceName)) {
      category = 'primary';
    } else if (services.secondary.includes(serviceName)) {
      category = 'secondary';
    } else if (services.specializations.includes(serviceName)) {
      category = 'specializations';
    }

    const pricingSnapshot = servicePricing[serviceName];

    setEditingServiceName(serviceName);
    setServiceFormData({
      name: serviceName,
      category,
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

    const p = pricingSnapshot;
    const netBase = p?.netPrice ?? p?.min;
    const vat = p?.vatRate ?? 23;
    const gross = p?.grossPrice ?? computeGrossFromNet(netBase, vat);
    setFormData({
      type: 'fixed',
      min: netBase,
      max: undefined,
      currency: p?.currency ?? 'PLN',
      unit: p?.unit,
      category: p?.category,
      subcategory: p?.subcategory,
      workDescription: p?.workDescription,
      netPrice: p?.netPrice,
      vatRate: vat,
      grossPrice: gross,
      serviceName: serviceName,
    });
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
    if (editingServiceName) {
      const nameTrim = (serviceFormData.name || formData.serviceName)?.trim();
      if (!nameTrim) {
        toast.error('Podaj nazwę usługi');
        return;
      }
    }

    if (categoriesFromDb.length === 0) {
      toast.error('Ładowanie kategorii — poczekaj chwilę i spróbuj ponownie');
      return;
    }

    if (!jobMarketCategoryName.trim() || !jobMarketSubcategoryName.trim()) {
      toast.error('Wybierz kategorię i podkategorię usługi');
      return;
    }

    const categoryMatch = categoriesFromDb.find((c) => c.name === jobMarketCategoryName);
    const subcategoryValid = categoryMatch?.subcategories.some((s) => s.name === jobMarketSubcategoryName);
    if (!categoryMatch || !subcategoryValid) {
      toast.error('Wybierz prawidłową parę kategoria i podkategoria');
      return;
    }

    if (!formData.unit?.trim()) {
      toast.error('Wybierz jednostkę miary');
      return;
    }

    const netInput = formData.min ?? formData.netPrice;
    if (netInput === undefined || !Number.isFinite(netInput) || netInput <= 0) {
      toast.error('Podaj prawidłową cenę netto');
      return;
    }

    try {
      setSaving(true);

      const finalServiceName = editingServiceName
        ? (serviceFormData.name || formData.serviceName || '').trim()
        : jobMarketSubcategoryName.trim();
      const serviceCategory = editingServiceName ? serviceFormData.category : 'primary';

      const updatedServices = { ...services };

      if (editingServiceName) {
        updatedServices.primary = updatedServices.primary.filter((s) => s !== editingServiceName);
        updatedServices.secondary = updatedServices.secondary.filter((s) => s !== editingServiceName);
        updatedServices.specializations = updatedServices.specializations.filter((s) => s !== editingServiceName);

        const allServicesList = [
          ...updatedServices.primary,
          ...updatedServices.secondary,
          ...updatedServices.specializations,
        ];
        if (finalServiceName !== editingServiceName && allServicesList.includes(finalServiceName)) {
          toast.error('Usługa o tej nazwie już istnieje');
          return;
        }
      } else {
        if (hasMonetaryPricing(servicePricing[finalServiceName])) {
          toast.error('Ta usługa ma już wpisaną cenę w cenniku');
          return;
        }
      }

      if (!updatedServices[serviceCategory].includes(finalServiceName)) {
        updatedServices[serviceCategory] = [...updatedServices[serviceCategory], finalServiceName].sort();
      }

      const { error } = await updateContractorServices(companyId, updatedServices);
      if (error) {
        throw error;
      }
      setServices(updatedServices);
      const nextPricing = { ...servicePricing };

      if (editingServiceName && editingServiceName !== finalServiceName) {
        delete nextPricing[editingServiceName];
      }

      const netPrice = Number(netInput);
      const vatRate = formData.vatRate ?? 23;
      const grossPrice =
        formData.grossPrice ??
        computeGrossFromNet(netPrice, vatRate) ??
        Number((netPrice * (1 + vatRate / 100)).toFixed(2));

      const { serviceName: _sn, category: _c, subcategory: _s, netPrice: _n, ...restForm } = formData;

      const updatedPricing: Record<string, ServicePricing> = {
        ...nextPricing,
        [finalServiceName]: {
          ...(restForm as ServicePricing),
          type: 'fixed',
          min: netPrice,
          max: undefined,
          currency: 'PLN',
          unit: formData.unit,
          category: jobMarketCategoryName,
          subcategory: jobMarketSubcategoryName,
          workDescription: finalServiceName,
          netPrice,
          vatRate,
          grossPrice,
        },
      };

      const { error: pricingError } = await updateContractorServicePricing(companyId, updatedPricing);
      if (pricingError) {
        throw pricingError;
      }

      setServicePricing(updatedPricing);
      toast.success(editingServiceName ? 'Usługa została zaktualizowana' : 'Usługa została dodana');
      setShowDialog(false);

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
      <div className="flex items-center justify-end mb-4">
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
            <div className="relative">
              {tableScrollable ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute left-1 top-1/2 z-10 h-9 w-9 -translate-y-1/2 shadow-md"
                    aria-label="Przewiń tabelę w lewo"
                    onClick={() => scrollTableBy(-240)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-1 top-1/2 z-10 h-9 w-9 -translate-y-1/2 shadow-md"
                    aria-label="Przewiń tabelę w prawo"
                    onClick={() => scrollTableBy(240)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              ) : null}
              <div
                ref={tableScrollRef}
                className="max-h-[min(70vh,560px)] overflow-auto rounded-md border"
              >
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Kategoria usługi</TableHead>
                  <TableHead>Podkategoria usługi</TableHead>
                  <TableHead>Jednostka miary</TableHead>
                  <TableHead>Cena netto</TableHead>
                  <TableHead>Stawka VAT</TableHead>
                  <TableHead>Cena brutto</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allServices.map((service) => {
                  const pricing = servicePricing[service];
                  const marketCategory =
                    pricing?.category && !isLegacyPricingCategory(pricing.category)
                      ? pricing.category
                      : null;
                  const netDisplay = pricing?.netPrice ?? pricing?.min;
                  return (
                    <TableRow key={service}>
                      <TableCell>{marketCategory || '—'}</TableCell>
                      <TableCell>{pricing?.subcategory || '—'}</TableCell>
                      <TableCell>{pricing?.unit || '—'}</TableCell>
                      <TableCell>
                        {netDisplay !== undefined && Number(netDisplay) > 0
                          ? `${Number(netDisplay).toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} PLN`
                          : '—'}
                      </TableCell>
                      <TableCell>{pricing?.vatRate !== undefined ? `${pricing.vatRate}%` : '—'}</TableCell>
                      <TableCell>
                        {pricing?.grossPrice !== undefined
                          ? `${pricing.grossPrice.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLN`
                          : '—'}
                      </TableCell>
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unified Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) {
          setEditingServiceName(null);
          setJobMarketCategoryName('');
          setJobMarketSubcategoryName('');
          setFormData({
            type: 'fixed',
            min: undefined,
            max: undefined,
            currency: 'PLN',
            unit: undefined,
            serviceName: undefined,
            netPrice: undefined,
            vatRate: 23,
            grossPrice: undefined,
          });
          setServiceFormData({
            name: '',
            category: 'primary',
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingServiceName ? 'Edytuj pozycję cennika' : 'Dodaj pozycję cennika'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kategoria usługi</Label>
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
              <Label>Podkategoria usługi</Label>
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

            {editingServiceName ? (
              <div className="space-y-2">
                <Label>Nazwa usługi</Label>
                <Input
                  type="text"
                  value={serviceFormData.name || formData.serviceName || ''}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setServiceFormData({ ...serviceFormData, name: newName });
                    setFormData({ ...formData, serviceName: newName });
                  }}
                  placeholder="np. Malowanie ścian w mieszkaniu"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Jednostka miary</Label>
              <Select
                value={
                  formData.unit && unitSelectOptions.includes(formData.unit)
                    ? formData.unit
                    : undefined
                }
                onValueChange={(u) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: 'fixed',
                    unit: u,
                  }))
                }
              >
                <SelectTrigger aria-label="Jednostka miary">
                  <SelectValue placeholder="Wybierz jednostkę" />
                </SelectTrigger>
                <SelectContent>
                  {unitSelectOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
              <div className="space-y-2">
                <Label>Cena netto (PLN)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min ?? ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      min: e.target.value ? parseFloat(e.target.value) : undefined,
                    });
                  }}
                  onBlur={recalculateGrossFromForm}
                  placeholder="0,00"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    placeholder="Obliczana z netto i VAT"
                    value={
                      formData.grossPrice !== undefined
                        ? `${formData.grossPrice.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLN`
                        : ''
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Anuluj
            </Button>
            <Button
              onClick={handleSaveService}
              disabled={
                saving ||
                (editingServiceName && !(serviceFormData.name || formData.serviceName)?.trim())
              }
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                editingServiceName ? 'Zapisz zmiany' : 'Zapisz'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

