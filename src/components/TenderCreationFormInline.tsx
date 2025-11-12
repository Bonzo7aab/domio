"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Plus, 
  Minus,
  FileText, 
  AlertCircle, 
  CheckCircle,
  Calculator,
  Award,
  ArrowLeft,
  ArrowRight,
  Save,
  Send
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import { TenderWithCompany } from '../lib/database/jobs';

interface TenderCreationFormInlineProps {
  onClose: () => void;
  onSubmit: (tender: NewTender, tenderId?: string) => void;
  tenderId?: string;
  initialData?: TenderWithCompany;
}

interface NewTender {
  title: string;
  description: string;
  category: string;
  location: string;
  estimatedValue: string;
  currency: string;
  submissionDeadline: Date;
  evaluationDeadline: Date;
  requirements: string[];
  evaluationCriteria: EvaluationCriterion[];
  documents: TenderDocument[];
  isPublic: boolean;
  allowQuestions: boolean;
  questionsDeadline?: Date;
  minimumExperience: number;
  requiredCertificates: string[];
  insuranceRequired: string;
  advancePayment: boolean;
  performanceBond: boolean;
  status?: 'draft' | 'active';
}

interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  type: 'price' | 'quality' | 'time' | 'experience';
}

interface TenderDocument {
  id: string;
  name: string;
  type: 'specification' | 'requirements' | 'drawings' | 'other';
  file: File;
}

const categories = [
  'Utrzymanie Czystości i Zieleni',
  'Roboty Remontowo-Budowlane', 
  'Instalacje i systemy',
  'Utrzymanie techniczne i konserwacja',
  'Specjalistyczne usługi'
];

const defaultCriteria: EvaluationCriterion[] = [
  {
    id: 'price',
    name: 'Cena oferty',
    description: 'Łączna cena realizacji zamówienia',
    weight: 40,
    type: 'price'
  },
  {
    id: 'quality',
    name: 'Jakość wykonania',
    description: 'Doświadczenie, referencje i portfolio wykonawcy',
    weight: 30,
    type: 'quality'
  },
  {
    id: 'time',
    name: 'Termin realizacji',
    description: 'Proponowany czas wykonania prac',
    weight: 20,
    type: 'time'
  },
  {
    id: 'warranty',
    name: 'Gwarancja i serwis',
    description: 'Okres gwarancji i jakość serwisu posprzedażowego',
    weight: 10,
    type: 'quality'
  }
];

export const TenderCreationFormInline: React.FC<TenderCreationFormInlineProps> = ({
  onClose,
  onSubmit,
  tenderId,
  initialData
}) => {
  const isEditMode = !!tenderId && !!initialData;

  const [formData, setFormData] = useState<NewTender>({
    title: '',
    description: '',
    category: '',
    location: '',
    estimatedValue: '',
    currency: 'PLN',
    submissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dni od teraz
    evaluationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dni od teraz
    requirements: [''],
    evaluationCriteria: defaultCriteria,
    documents: [],
    isPublic: true,
    allowQuestions: true,
    questionsDeadline: undefined,
    minimumExperience: 1,
    requiredCertificates: [],
    insuranceRequired: '500000',
    advancePayment: false,
    performanceBond: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Populate form with initial data when editing
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category?.name || '',
        location: initialData.location || '',
        estimatedValue: initialData.estimated_value?.toString() || '',
        currency: initialData.currency || 'PLN',
        submissionDeadline: initialData.submission_deadline ? new Date(initialData.submission_deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        evaluationDeadline: initialData.evaluation_deadline ? new Date(initialData.evaluation_deadline) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        requirements: initialData.requirements && initialData.requirements.length > 0 
          ? initialData.requirements 
          : [''],
        evaluationCriteria: initialData.evaluation_criteria && Array.isArray(initialData.evaluation_criteria)
          ? initialData.evaluation_criteria.map((criterion: any) => ({
              id: criterion.id || `criterion-${Date.now()}-${Math.random()}`,
              name: criterion.name || '',
              description: criterion.description || '',
              weight: criterion.weight || 0,
              type: criterion.type || 'quality'
            }))
          : defaultCriteria,
        documents: [], // Documents from DB are not File objects, so we start fresh
        isPublic: initialData.is_public ?? true,
        allowQuestions: true, // Not stored in DB, default to true
        questionsDeadline: undefined,
        minimumExperience: 1,
        requiredCertificates: [],
        insuranceRequired: '500000',
        advancePayment: false,
        performanceBond: false,
        status: initialData.status as 'draft' | 'active' || 'draft'
      });
    }
  }, [isEditMode, initialData]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Tytuł jest wymagany';
      if (!formData.description.trim()) newErrors.description = 'Opis jest wymagany';
      if (!formData.category) newErrors.category = 'Kategoria jest wymagana';
      if (!formData.location.trim()) newErrors.location = 'Lokalizacja jest wymagana';
    }

    if (step === 2) {
      if (!formData.estimatedValue) newErrors.estimatedValue = 'Szacowana wartość jest wymagana';
      if (isNaN(Number(formData.estimatedValue))) newErrors.estimatedValue = 'Wartość musi być liczbą';
      if (formData.submissionDeadline <= new Date()) newErrors.submissionDeadline = 'Termin składania ofert musi być w przyszłości';
      if (formData.evaluationDeadline <= formData.submissionDeadline) newErrors.evaluationDeadline = 'Termin oceny musi być po terminie składania ofert';
    }

    if (step === 3) {
      const totalWeight = formData.evaluationCriteria.reduce((sum, criteria) => sum + criteria.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.1) {
        newErrors.criteria = 'Suma wag kryteriów musi wynosić 100%';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (asDraft: boolean = false) => {
    if (!asDraft && !validateStep(currentStep)) return;

    const tender: NewTender = {
      ...formData,
      requirements: formData.requirements.filter(req => req.trim() !== ''),
      status: asDraft ? 'draft' : 'active'
    };

    onSubmit(tender, tenderId);
    toast.success(
      isEditMode 
        ? (asDraft ? 'Przetarg zaktualizowany jako szkic' : 'Przetarg został zaktualizowany i opublikowany')
        : (asDraft ? 'Przetarg zapisany jako szkic' : 'Przetarg został opublikowany')
    );
    onClose();
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const updateCriterion = (id: string, field: keyof EvaluationCriterion, value: any) => {
    setFormData(prev => ({
      ...prev,
      evaluationCriteria: prev.evaluationCriteria.map(criterion => 
        criterion.id === id ? { ...criterion, [field]: value } : criterion
      )
    }));
  };

  const addCriterion = () => {
    const newCriterion: EvaluationCriterion = {
      id: `custom-${Date.now()}`,
      name: '',
      description: '',
      weight: 0,
      type: 'quality'
    };
    
    setFormData(prev => ({
      ...prev,
      evaluationCriteria: [...prev.evaluationCriteria, newCriterion]
    }));
  };

  const removeCriterion = (id: string) => {
    setFormData(prev => ({
      ...prev,
      evaluationCriteria: prev.evaluationCriteria.filter(c => c.id !== id)
    }));
  };

  const totalWeight = formData.evaluationCriteria.reduce((sum, criteria) => sum + criteria.weight, 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4 mb-4">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                i + 1 <= currentStep 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`h-1 w-16 mx-2 ${
                  i + 1 < currentStep ? 'bg-primary' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600 px-8">
          <span>Podstawowe informacje</span>
          <span>Warunki i terminy</span>
          <span>Kryteria oceny</span>
          <span>Podsumowanie</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-8">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Podstawowe informacje o przetargu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Tytuł przetargu *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="np. Kompleksowy remont elewacji budynku mieszkalnego"
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Szczegółowy opis przetargu *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Opisz szczegółowo zakres prac, wymagania techniczne, warunki realizacji..."
                  rows={6}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Kategoria usług *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Wybierz kategorię" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive mt-1">{errors.category}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="location">Lokalizacja realizacji *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="np. Warszawa, Mokotów"
                    className={errors.location ? 'border-destructive' : ''}
                  />
                  {errors.location && (
                    <p className="text-sm text-destructive mt-1">{errors.location}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Terms and Deadlines */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Warunki finansowe i terminowe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedValue">Szacowana wartość zamówienia *</Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    value={formData.estimatedValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: e.target.value }))}
                    placeholder="450000"
                    className={errors.estimatedValue ? 'border-destructive' : ''}
                  />
                  {errors.estimatedValue && (
                    <p className="text-sm text-destructive mt-1">{errors.estimatedValue}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="currency">Waluta</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLN">PLN - Złoty Polski</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="USD">USD - Dolar Amerykański</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="submissionDeadline">Termin składania ofert *</Label>
                  <Input
                    id="submissionDeadline"
                    type="datetime-local"
                    value={formData.submissionDeadline.toISOString().slice(0, 16)}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      submissionDeadline: new Date(e.target.value) 
                    }))}
                    className={errors.submissionDeadline ? 'border-destructive' : ''}
                  />
                  {errors.submissionDeadline && (
                    <p className="text-sm text-destructive mt-1">{errors.submissionDeadline}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="evaluationDeadline">Termin oceny ofert *</Label>
                  <Input
                    id="evaluationDeadline"
                    type="datetime-local"
                    value={formData.evaluationDeadline.toISOString().slice(0, 16)}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      evaluationDeadline: new Date(e.target.value) 
                    }))}
                    className={errors.evaluationDeadline ? 'border-destructive' : ''}
                  />
                  {errors.evaluationDeadline && (
                    <p className="text-sm text-destructive mt-1">{errors.evaluationDeadline}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Wymagania dla wykonawców</Label>
                <div className="space-y-3 mt-2">
                  {formData.requirements.map((requirement, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={requirement}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        placeholder="np. Minimum 5 lat doświadczenia w remontach elewacji"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeRequirement(index)}
                        disabled={formData.requirements.length === 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRequirement}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Dodaj wymaganie
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Evaluation Criteria */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Kryteria oceny ofert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Suma wag wszystkich kryteriów musi wynosić dokładnie 100%. 
                  Aktualna suma: <strong>{totalWeight}%</strong>
                  {Math.abs(totalWeight - 100) > 0.1 && (
                    <span className="text-destructive ml-2">
                      (różnica: {(100 - totalWeight).toFixed(1)}%)
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {formData.evaluationCriteria.map((criterion) => (
                  <Card key={criterion.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                        <div>
                          <Label>Nazwa kryterium</Label>
                          <Input
                            value={criterion.name}
                            onChange={(e) => updateCriterion(criterion.id, 'name', e.target.value)}
                            placeholder="np. Cena oferty"
                          />
                        </div>
                        
                        <div>
                          <Label>Typ kryterium</Label>
                          <Select 
                            value={criterion.type} 
                            onValueChange={(value) => updateCriterion(criterion.id, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="price">Cena</SelectItem>
                              <SelectItem value="quality">Jakość</SelectItem>
                              <SelectItem value="time">Czas</SelectItem>
                              <SelectItem value="experience">Doświadczenie</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Waga (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={criterion.weight}
                            onChange={(e) => updateCriterion(criterion.id, 'weight', Number(e.target.value))}
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeCriterion(criterion.id)}
                            disabled={formData.evaluationCriteria.length === 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Label>Opis kryterium</Label>
                        <Textarea
                          value={criterion.description}
                          onChange={(e) => updateCriterion(criterion.id, 'description', e.target.value)}
                          placeholder="Szczegółowy opis sposobu oceny tego kryterium"
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addCriterion}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Dodaj kryterium oceny
              </Button>

              {errors.criteria && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-destructive">
                    {errors.criteria}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Summary */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {isEditMode ? 'Podsumowanie i aktualizacja przetargu' : 'Podsumowanie i publikacja przetargu'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Podstawowe informacje</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Tytuł:</strong> {formData.title}</div>
                    <div><strong>Kategoria:</strong> {formData.category}</div>
                    <div><strong>Lokalizacja:</strong> {formData.location}</div>
                    <div><strong>Wartość:</strong> {parseInt(formData.estimatedValue || '0').toLocaleString('pl-PL')} {formData.currency}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Terminy realizacji</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Składanie ofert do:</strong> {formData.submissionDeadline.toLocaleString('pl-PL')}</div>
                    <div><strong>Ocena ofert do:</strong> {formData.evaluationDeadline.toLocaleString('pl-PL')}</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Wymagania dla wykonawców</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {formData.requirements.filter(req => req.trim()).map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Kryteria oceny ofert</h4>
                <div className="space-y-2">
                  {formData.evaluationCriteria.map((criterion) => (
                    <div key={criterion.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="font-medium">{criterion.name}</span>
                      <Badge variant="secondary">{criterion.weight}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Poprzedni krok
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          {currentStep < totalSteps ? (
            <Button onClick={handleNext}>
              Następny krok
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleSubmit(true)}>
                <Save className="h-4 w-4 mr-2" />
                Zapisz jako szkic
              </Button>
              <Button onClick={() => handleSubmit(false)}>
                <Send className="h-4 w-4 mr-2" />
                Opublikuj przetarg
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};