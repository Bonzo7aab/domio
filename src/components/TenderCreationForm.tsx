import {
  AlertCircle,
  Award,
  Calculator,
  CheckCircle,
  FileText,
  Minus,
  Plus,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';

interface TenderCreationFormProps {
  onClose: () => void;
  onSubmit: (tender: NewTender) => void;
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

const availableCertificates = [
  'ISO 9001 - System zarządzania jakością',
  'ISO 14001 - System zarządzania środowiskowego',
  'OHSAS 18001 - Bezpieczeństwo i higiena pracy',
  'Certyfikat DDD - Dezynfekcja, Dezynsekcja, Deratyzacja',
  'Uprawnienia budowlane',
  'Uprawnienia SEP',
  'Certyfikat spawacza',
  'Uprawnienia UDT',
  'Certyfikat energetyczny',
  'Certyfikat ekologiczny'
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

export const TenderCreationForm: React.FC<TenderCreationFormProps> = ({
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<NewTender>({
    title: '',
    description: '',
    category: '',
    location: '',
    estimatedValue: '',
    currency: 'PLN',
    submissionDeadline: new Date(),
    evaluationDeadline: new Date(),
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
      requirements: formData.requirements.filter(req => req.trim() !== '')
    };

    onSubmit(tender);
    toast.success(asDraft ? 'Przetarg zapisany jako szkic' : 'Przetarg został opublikowany');
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const document: TenderDocument = {
        id: `doc-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: 'other',
        file
      };

      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, document]
      }));
    });
  };

  const removeDocument = (id: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(doc => doc.id !== id)
    }));
  };

  const totalWeight = formData.evaluationCriteria.reduce((sum, criteria) => sum + criteria.weight, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold">Nowy przetarg</h2>
              <p className="text-gray-600">Krok {currentStep} z {totalSteps}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pt-4">
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i + 1 <= currentStep 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div className={`h-1 w-12 ${
                      i + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Podstawowe</span>
              <span>Warunki</span>
              <span>Kryteria</span>
              <span>Podsumowanie</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Podstawowe informacje
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Tytuł przetargu *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="np. Kompleksowy remont elewacji budynku"
                        className={errors.title ? 'border-red-500' : ''}
                      />
                      {errors.title && (
                        <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Opis szczegółowy *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Szczegółowy opis zakresu prac, wymagań i oczekiwań..."
                        rows={4}
                        className={errors.description ? 'border-red-500' : ''}
                      />
                      {errors.description && (
                        <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Kategoria *</Label>
                        <Select 
                          value={formData.category} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
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
                          <p className="text-sm text-red-600 mt-1">{errors.category}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="location">Lokalizacja *</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="np. Warszawa, Mokotów"
                          className={errors.location ? 'border-red-500' : ''}
                        />
                        {errors.location && (
                          <p className="text-sm text-red-600 mt-1">{errors.location}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 2: Terms and Deadlines */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Warunki finansowe i terminowe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="estimatedValue">Szacowana wartość *</Label>
                        <Input
                          id="estimatedValue"
                          type="number"
                          value={formData.estimatedValue}
                          onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: e.target.value }))}
                          placeholder="450000"
                          className={errors.estimatedValue ? 'border-red-500' : ''}
                        />
                        {errors.estimatedValue && (
                          <p className="text-sm text-red-600 mt-1">{errors.estimatedValue}</p>
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
                            <SelectItem value="PLN">PLN</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                          className={errors.submissionDeadline ? 'border-red-500' : ''}
                        />
                        {errors.submissionDeadline && (
                          <p className="text-sm text-red-600 mt-1">{errors.submissionDeadline}</p>
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
                          className={errors.evaluationDeadline ? 'border-red-500' : ''}
                        />
                        {errors.evaluationDeadline && (
                          <p className="text-sm text-red-600 mt-1">{errors.evaluationDeadline}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Wymagania dla wykonawców</Label>
                      <div className="space-y-2">
                        {formData.requirements.map((requirement, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={requirement}
                              onChange={(e) => updateRequirement(index, e.target.value)}
                              placeholder="np. Doświadczenie min. 3 lata w remontach elewacji"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
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
                          size="sm"
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
              </div>
            )}

            {/* Step 3: Evaluation Criteria */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Kryteria oceny ofert
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Suma wag wszystkich kryteriów musi wynosić 100%. 
                        Aktualna suma: <strong>{totalWeight}%</strong>
                        {Math.abs(totalWeight - 100) > 0.1 && (
                          <span className="text-red-600 ml-2">
                            (różnica: {(100 - totalWeight).toFixed(1)}%)
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      {formData.evaluationCriteria.map((criterion) => (
                        <Card key={criterion.id} className="border">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-4 gap-4 items-start">
                              <div>
                                <Label>Nazwa kryterium</Label>
                                <Input
                                  value={criterion.name}
                                  onChange={(e) => updateCriterion(criterion.id, 'name', e.target.value)}
                                  placeholder="np. Cena oferty"
                                />
                              </div>
                              
                              <div>
                                <Label>Typ</Label>
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
                                  size="sm"
                                  onClick={() => removeCriterion(criterion.id)}
                                  disabled={formData.evaluationCriteria.length === 1}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <Label>Opis</Label>
                              <Textarea
                                value={criterion.description}
                                onChange={(e) => updateCriterion(criterion.id, 'description', e.target.value)}
                                placeholder="Szczegółowy opis kryterium oceny"
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
                      Dodaj kryterium
                    </Button>

                    {errors.criteria && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-600">
                          {errors.criteria}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 4: Summary */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Podsumowanie przetargu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Podstawowe informacje</h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>Tytuł:</strong> {formData.title}</div>
                          <div><strong>Kategoria:</strong> {formData.category}</div>
                          <div><strong>Lokalizacja:</strong> {formData.location}</div>
                          <div><strong>Wartość:</strong> {parseInt(formData.estimatedValue).toLocaleString('pl-PL')} {formData.currency}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Terminy</h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>Składanie ofert do:</strong> {formData.submissionDeadline.toLocaleString('pl-PL')}</div>
                          <div><strong>Ocena ofert do:</strong> {formData.evaluationDeadline.toLocaleString('pl-PL')}</div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Wymagania</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {formData.requirements.filter(req => req.trim()).map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Kryteria oceny</h4>
                      <div className="space-y-2">
                        {formData.evaluationCriteria.map((criterion) => (
                          <div key={criterion.id} className="flex justify-between items-center text-sm">
                            <span>{criterion.name}</span>
                            <Badge variant="outline">{criterion.weight}%</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Przetarg jest gotowy do publikacji. Po opublikowaniu wykonawcy będą mogli składać oferty.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Anuluj
              </Button>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePrevious}>
                  Poprzedni
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {currentStep === totalSteps && (
                <Button variant="outline" onClick={() => handleSubmit(true)}>
                  Zapisz jako szkic
                </Button>
              )}
              
              {currentStep < totalSteps ? (
                <Button onClick={handleNext}>
                  Następny
                </Button>
              ) : (
                <Button onClick={() => handleSubmit(false)}>
                  Opublikuj przetarg
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenderCreationForm;