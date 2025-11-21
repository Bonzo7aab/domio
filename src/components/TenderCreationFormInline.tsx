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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
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
  Send,
  ChevronDown,
  ChevronUp,
  X
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
  type: 'price' | 'quality' | 'time' | 'experience' | 'other';
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

// Generate unique colors for criteria based on their position in sorted list
const getAllColors = (): string[] => {
  return [
    'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500', 
    'bg-cyan-500', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500',
    'bg-rose-500', 'bg-sky-500', 'bg-lime-500', 'bg-fuchsia-500',
    'bg-stone-500', 'bg-slate-500', 'bg-zinc-500', 'bg-neutral-500'
  ];
};

// Get color for a criterion based on its index in sorted list (ensures uniqueness)
const getCriterionColor = (index: number): string => {
  const allColors = getAllColors();
  return allColors[index % allColors.length];
};

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
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set()
  );

  // Populate form with initial data when editing
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category?.name || '',
        location: typeof initialData.location === 'string' 
          ? initialData.location 
          : initialData.location && typeof initialData.location === 'object' && 'city' in initialData.location
            ? initialData.location.city + (initialData.location.sublocality_level_1 ? `, ${initialData.location.sublocality_level_1}` : '')
            : '',
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

  const handleStepClick = (step: number) => {
    // In edit mode, allow clicking any step without validation
    if (isEditMode) {
      setCurrentStep(step);
      return;
    }
    
    // Allow going backward without validation
    if (step < currentStep) {
      setCurrentStep(step);
      return;
    }
    
    // For going forward, validate all previous steps
    if (step > currentStep) {
      let canProceed = true;
      for (let i = 1; i < step; i++) {
        if (!validateStep(i)) {
          canProceed = false;
          break;
        }
      }
      if (canProceed) {
        setCurrentStep(step);
      }
    }
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
      evaluationCriteria: prev.evaluationCriteria.map(criterion => {
        if (criterion.id === id) {
          // Round weight to nearest 0.5% if it's a weight update
          if (field === 'weight' && typeof value === 'number') {
            return { ...criterion, [field]: Math.round(value * 2) / 2 };
          }
          return { ...criterion, [field]: value };
        }
        return criterion;
      })
    }));
  };

  const addCriterion = () => {
    const newCriterion: EvaluationCriterion = {
      id: `custom-${Date.now()}`,
      name: '',
      description: '',
      weight: 5,
      type: 'quality'
    };
    
    setFormData(prev => ({
      ...prev,
      evaluationCriteria: [...prev.evaluationCriteria, newCriterion]
    }));
  };

  const removeCriterion = (id: string) => {
    const removedCriterion = formData.evaluationCriteria.find(c => c.id === id);
    const remainingCriteria = formData.evaluationCriteria.filter(c => c.id !== id);
    
    if (remainingCriteria.length === 0) {
      setFormData(prev => ({
        ...prev,
        evaluationCriteria: []
      }));
      setExpandedDescriptions(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }
    
    setFormData(prev => {
      const newCriteria = prev.evaluationCriteria.filter(c => c.id !== id);
      const remainingTotal = newCriteria.reduce((sum, c) => sum + c.weight, 0);
      
      // Always redistribute to 100% proportionally, ensuring we never exceed 100%
      if (remainingTotal > 0) {
        // Scale all weights proportionally to sum to 100%
        const scaleFactor = 100 / remainingTotal;
        
        const redistributedCriteria = newCriteria.map(criterion => {
          const scaledWeight = criterion.weight * scaleFactor;
          // Round to nearest 0.5
          const roundedWeight = Math.round(scaledWeight * 2) / 2;
          return {
            ...criterion,
            weight: Math.max(5, Math.min(100, roundedWeight))
          };
        });
        
        // Ensure total doesn't exceed 100% (shouldn't happen, but safety check)
        const finalTotal = redistributedCriteria.reduce((sum, c) => sum + c.weight, 0);
        if (finalTotal > 100) {
          // Scale down proportionally to ensure we don't exceed 100%
          const scale = 100 / finalTotal;
          return {
            ...prev,
            evaluationCriteria: redistributedCriteria.map(criterion => ({
              ...criterion,
              weight: Math.max(5, Math.round(criterion.weight * scale * 2) / 2)
            }))
          };
        }
        
        // If total is less than 100%, distribute the difference proportionally
        const difference = 100 - finalTotal;
        if (Math.abs(difference) > 0.25) {
          const adjustmentPerCriterion = difference / redistributedCriteria.length;
          return {
            ...prev,
            evaluationCriteria: redistributedCriteria.map(criterion => {
              const adjustedWeight = criterion.weight + adjustmentPerCriterion;
              return {
                ...criterion,
                weight: Math.max(5, Math.min(100, Math.round(adjustedWeight * 2) / 2))
              };
            })
          };
        }
        
        return {
          ...prev,
          evaluationCriteria: redistributedCriteria
        };
      }
      
      // If remaining total is 0, set equal weights
      const equalWeight = 100 / newCriteria.length;
      return {
        ...prev,
        evaluationCriteria: newCriteria.map(criterion => ({
          ...criterion,
          weight: Math.round(equalWeight * 2) / 2
        }))
      };
    });
    
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const normalizeWeights = () => {
    const currentTotal = formData.evaluationCriteria.reduce((sum, c) => sum + c.weight, 0);
    if (currentTotal === 0) {
      return;
    }
    
    setFormData(prev => {
      // First, normalize and round to 0.5%
      const normalizedCriteria = prev.evaluationCriteria.map(criterion => {
        const normalizedWeight = (criterion.weight / currentTotal) * 100;
        // Round to nearest 0.5
        return {
          ...criterion,
          weight: Math.round(normalizedWeight * 2) / 2
        };
      });
      
      // Calculate the actual total after rounding
      const roundedTotal = normalizedCriteria.reduce((sum, c) => sum + c.weight, 0);
      
      // If total exceeds 100%, scale down proportionally
      if (roundedTotal > 100) {
        const scale = 100 / roundedTotal;
        return {
          ...prev,
          evaluationCriteria: normalizedCriteria.map(criterion => ({
            ...criterion,
            weight: Math.max(5, Math.round(criterion.weight * scale * 2) / 2)
          }))
        };
      }
      
      // If total is less than 100%, distribute the difference proportionally
      const difference = 100 - roundedTotal;
      if (Math.abs(difference) > 0.25) {
        const adjustmentPerCriterion = difference / normalizedCriteria.length;
        return {
          ...prev,
          evaluationCriteria: normalizedCriteria.map(criterion => {
            const adjustedWeight = criterion.weight + adjustmentPerCriterion;
            return {
              ...criterion,
              weight: Math.max(5, Math.min(100, Math.round(adjustedWeight * 2) / 2))
            };
          })
        };
      }
      
      return {
        ...prev,
        evaluationCriteria: normalizedCriteria
      };
    });
  };

  const autoFillTo100 = () => {
    const currentTotal = formData.evaluationCriteria.reduce((sum, c) => sum + c.weight, 0);
    const difference = 100 - currentTotal;
    
    if (Math.abs(difference) < 0.1) {
      toast.info('Suma wag już wynosi 100%');
      return;
    }
    
    if (currentTotal === 0) {
      // If all weights are 0, distribute equally
      const equalWeight = 100 / formData.evaluationCriteria.length;
      setFormData(prev => ({
        ...prev,
        evaluationCriteria: prev.evaluationCriteria.map(criterion => ({
          ...criterion,
          weight: Math.round(equalWeight * 2) / 2 // Round to nearest 0.5
        }))
      }));
      // Normalize to ensure exactly 100%
      setTimeout(() => {
        normalizeWeights();
      }, 0);
      toast.success('Wagi zostały automatycznie dostosowane do 100%');
      return;
    }
    
    // Distribute the difference proportionally based on current weights
    // Ensure minimum of 5% per criterion and never exceed 100%
    setFormData(prev => {
      const newCriteria = prev.evaluationCriteria.map(criterion => {
        // Calculate proportional adjustment
        const proportion = criterion.weight / currentTotal;
        const adjustment = difference * proportion;
        const newWeight = criterion.weight + adjustment;
        // Round to nearest 0.5
        const roundedWeight = Math.round(newWeight * 2) / 2;
        return {
          ...criterion,
          weight: Math.max(5, Math.min(100, roundedWeight))
        };
      });
      
      // Calculate new total and adjust if needed
      const newTotal = newCriteria.reduce((sum, c) => sum + c.weight, 0);
      const finalDifference = 100 - newTotal;
      
      // Ensure we never exceed 100%
      if (newTotal > 100) {
        // Scale down proportionally to ensure we don't exceed 100%
        const scale = 100 / newTotal;
        return {
          ...prev,
          evaluationCriteria: newCriteria.map(criterion => ({
            ...criterion,
            weight: Math.max(5, Math.round(criterion.weight * scale * 2) / 2)
          }))
        };
      }
      
      // Distribute final difference if needed
      if (Math.abs(finalDifference) > 0.25) {
        const adjustmentPerCriterion = finalDifference / newCriteria.length;
        return {
          ...prev,
          evaluationCriteria: newCriteria.map(criterion => {
            const adjustedWeight = criterion.weight + adjustmentPerCriterion;
            return {
              ...criterion,
              weight: Math.max(5, Math.min(100, Math.round(adjustedWeight * 2) / 2))
            };
          })
        };
      }
      
      return {
        ...prev,
        evaluationCriteria: newCriteria
      };
    });
    
    // Final normalization to ensure exactly 100%
    setTimeout(() => {
      normalizeWeights();
    }, 50);
    
    toast.success('Wagi zostały automatycznie dostosowane do 100%');
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalWeight = formData.evaluationCriteria.reduce((sum, criteria) => sum + criteria.weight, 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-start">
          {Array.from({ length: totalSteps }, (_, i) => {
            const labels = ['Podstawowe', 'Warunki', 'Kryteria', 'Podsumowanie'];
            const stepNumber = i + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            // In edit mode, all steps are clickable; otherwise only completed/current steps
            const isClickable = isEditMode || stepNumber <= currentStep || isCompleted;
            
            return (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center" style={{ flex: '0 0 auto' }}>
                  <button
                    type="button"
                    onClick={() => handleStepClick(stepNumber)}
                    disabled={!isClickable && !isEditMode && stepNumber > currentStep}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-white cursor-pointer hover:bg-primary/90'
                        : isCompleted
                        ? 'bg-primary text-white cursor-pointer hover:bg-primary/90'
                        : isClickable || isEditMode
                        ? 'bg-gray-200 text-gray-600 cursor-pointer hover:bg-gray-300'
                        : 'bg-gray-200 text-gray-600 cursor-not-allowed opacity-50'
                    }`}
                    title={isClickable || isEditMode ? `Przejdź do kroku ${stepNumber}: ${labels[i]}` : 'Najpierw uzupełnij poprzednie kroki'}
                  >
                    {stepNumber}
                  </button>
                  <span className={`text-xs mt-2 whitespace-nowrap ${
                    isActive ? 'text-primary font-medium' : 'text-gray-500'
                  }`}>
                    {labels[i]}
                  </span>
                </div>
                {i < totalSteps - 1 && (
                  <div className={`h-1 flex-1 mt-4 mx-2 ${
                    isCompleted ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
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
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Kryteria oceny ofert
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 min-h-0">
              {(() => {
                // Sort criteria by weight (highest first)
                const sortedCriteria = [...formData.evaluationCriteria].sort((a, b) => b.weight - a.weight);
                const totalWeight = formData.evaluationCriteria.reduce((sum, criteria) => sum + criteria.weight, 0);
                const isWeightValid = Math.abs(totalWeight - 100) < 0.1;
                
                return (
                  <>
                    {/* Prominent Weight Total Banner */}
                    <div className={`mb-6 p-4 rounded-lg border-2 ${
                      isWeightValid 
                        ? 'bg-green-50 border-green-300' 
                        : 'bg-red-50 border-red-300'
                    }`}>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            isWeightValid ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            <Calculator className={`h-5 w-5 ${
                              isWeightValid ? 'text-green-700' : 'text-red-700'
                            }`} />
                          </div>
                          <div>
                            <div className={`text-lg font-bold ${
                              isWeightValid ? 'text-green-700' : 'text-red-700'
                            }`}>
                              Suma wag: {totalWeight.toFixed(1)}% / 100%
                            </div>
                            {!isWeightValid && (
                              <div className="text-sm text-red-600 font-medium mt-1">
                                Suma wag kryteriów musi wynosić 100%
                              </div>
                            )}
                            {isWeightValid && (
                              <div className="text-sm text-green-600 font-medium mt-1">
                                ✓ Wszystkie kryteria mają poprawną sumę wag
                              </div>
                            )}
                          </div>
                        </div>
                        {!isWeightValid && (
                          <Button
                            type="button"
                            onClick={autoFillTo100}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Calculator className="h-4 w-4 mr-2" />
                            Automatycznie uzupełnij do 100%
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Weight Distribution - Main Slider */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Rozkład wag:</Label>
                      <div className="space-y-3">
                        {/* Main Combined Slider */}
                        <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                          {sortedCriteria.map((criterion, index) => {
                            const colorClass = getCriterionColor(index);
                            const totalWeight = sortedCriteria.reduce((sum, c) => sum + c.weight, 0);
                            const scaleFactor = totalWeight > 0 ? Math.min(100 / totalWeight, 1) : 0;
                            
                            const previousWeights = sortedCriteria
                              .slice(0, index)
                              .reduce((sum, c) => sum + c.weight, 0);
                            
                            const scaledWidth = criterion.weight * scaleFactor;
                            const scaledLeft = previousWeights * scaleFactor;
                            const width = Math.max(0, scaledWidth);
                            const left = Math.max(0, scaledLeft);
                            
                            return (
                              <div
                                key={criterion.id}
                                className={`absolute h-full ${colorClass} transition-all duration-300`}
                                style={{
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  minWidth: criterion.weight > 0 ? '2px' : '0'
                                }}
                                title={`${criterion.name || `Kryterium ${index + 1}`}: ${criterion.weight.toFixed(1)}%`}
                              />
                            );
                          })}
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap gap-3 text-xs">
                          {sortedCriteria.map((criterion, index) => {
                            const colorClass = getCriterionColor(index);
                            return (
                              <div key={criterion.id} className="flex items-center gap-1.5">
                                <div className={`w-3 h-3 rounded ${colorClass}`} />
                                <span className="font-medium">{criterion.name || `Kryterium ${index + 1}`}</span>
                                <span className="text-muted-foreground">({criterion.weight.toFixed(1)}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Criteria List */}
                    <div className="space-y-6">
                      {sortedCriteria.map((criterion, index) => {
                        const isExpanded = expandedDescriptions.has(criterion.id);
                        const colorClass = getCriterionColor(index);
                        return (
                          <div key={criterion.id} className={`rounded-lg p-4 space-y-4 bg-white border border-gray-100`}>
                            {/* Main Criterion Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                              <div className="md:col-span-4">
                                <Label htmlFor={`name-${criterion.id}`}>Nazwa kryterium</Label>
                                <Input
                                  id={`name-${criterion.id}`}
                                  value={criterion.name}
                                  required
                                  onChange={(e) => updateCriterion(criterion.id, 'name', e.target.value)}
                                  placeholder="np. Cena oferty"
                                />
                              </div>
                              
                              <div className="md:col-span-3">
                                <Label htmlFor={`type-${criterion.id}`}>Typ</Label>
                                <Select 
                                  value={criterion.type} 
                                  onValueChange={(value) => updateCriterion(criterion.id, 'type', value)}
                                >
                                  <SelectTrigger id={`type-${criterion.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="price">Cena</SelectItem>
                                    <SelectItem value="quality">Jakość</SelectItem>
                                    <SelectItem value="time">Czas</SelectItem>
                                    <SelectItem value="experience">Doświadczenie</SelectItem>
                                    <SelectItem value="other">Inne</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="md:col-span-3">
                                <Label htmlFor={`weight-${criterion.id}`}>Waga (%)</Label>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      id={`weight-${criterion.id}`}
                                      type="number"
                                      min="5"
                                      max="100"
                                      step="0.5"
                                      value={criterion.weight}
                                      onChange={(e) => {
                                        const value = Number(e.target.value);
                                        // Round to nearest 0.5
                                        const roundedValue = Math.round(value * 2) / 2;
                                        updateCriterion(criterion.id, 'weight', Math.max(5, Math.min(100, roundedValue)));
                                      }}
                                      className="flex-1"
                                    />
                                    <Badge className={`min-w-[50px] justify-center ${colorClass} text-white`}>
                                      {criterion.weight.toFixed(1)}%
                                    </Badge>
                                  </div>
                                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${colorClass} transition-all duration-300 rounded-full`}
                                      style={{ width: `${Math.min(100, Math.max(0, criterion.weight))}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="md:col-span-2 flex items-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleDescription(criterion.id)}
                                  className="flex-1"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-4 w-4 mr-1" />
                                      <span className="text-xs">Ukryj</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4 mr-1" />
                                      <span className="text-xs">Opis</span>
                                    </>
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeCriterion(criterion.id)}
                                  disabled={formData.evaluationCriteria.length === 1}
                                  className="px-2"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Collapsible Description */}
                            <Collapsible open={isExpanded} onOpenChange={() => toggleDescription(criterion.id)}>
                              <CollapsibleContent>
                                <div className="pt-2">
                                  <Label htmlFor={`desc-${criterion.id}`}>Opis (opcjonalny)</Label>
                                  <Textarea
                                    id={`desc-${criterion.id}`}
                                    value={criterion.description}
                                    onChange={(e) => updateCriterion(criterion.id, 'description', e.target.value)}
                                    placeholder="Szczegółowy opis kryterium oceny"
                                    rows={2}
                                    className="mt-1"
                                  />
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        );
                      })}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCriterion}
                      className="flex items-center gap-2 w-full"
                    >
                      <Plus className="h-4 w-4" />
                      Dodaj kryterium
                    </Button>
                  </>
                );
              })()}
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