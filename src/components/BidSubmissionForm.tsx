import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { 
  Upload, 
  X, 
  Plus, 
  Minus,
  FileText, 
  Image, 
  AlertCircle, 
  CheckCircle,
  Calculator,
  Calendar,
  Clock,
  Shield,
  Award,
  DollarSign,
  Download,
  Eye
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useUserProfile } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface BidSubmissionFormProps {
  tenderId: string;
  tenderTitle: string;
  tenderDeadline: Date;
  tenderValue: string;
  tenderCurrency: string;
  evaluationCriteria: EvaluationCriterion[];
  tenderRequirements: string[];
  onClose: () => void;
  onSubmit: (bid: NewBid) => void;
}

interface NewBid {
  tenderId: string;
  contractorId: string;
  totalPrice: number;
  currency: string;
  proposedTimeline: number; // days
  proposedStartDate: Date;
  guaranteePeriod: number; // months
  description: string;
  technicalProposal: string;
  qualityAssurance: string;
  riskMitigation: string;
  teamDescription: string;
  attachments: BidAttachment[];
  criteriaResponses: CriteriaResponse[];
  acceptTerms: boolean;
  validUntil: Date;
}

interface BidAttachment {
  id: string;
  name: string;
  type: 'portfolio' | 'references' | 'certificates' | 'technical' | 'financial' | 'other';
  file: File;
  description: string;
}

interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  type: 'price' | 'quality' | 'time' | 'experience';
}

interface CriteriaResponse {
  criterionId: string;
  response: string;
  supportingDocuments: string[];
}

const attachmentTypes = [
  { value: 'portfolio', label: 'Portfolio/Galeria prac', icon: '🎨' },
  { value: 'references', label: 'Referencje', icon: '⭐' },
  { value: 'certificates', label: 'Certyfikaty', icon: '🏆' },
  { value: 'technical', label: 'Dokumentacja techniczna', icon: '📋' },
  { value: 'financial', label: 'Dokumenty finansowe', icon: '💰' },
  { value: 'other', label: 'Inne', icon: '📄' }
];

export const BidSubmissionForm: React.FC<BidSubmissionFormProps> = ({
  tenderId,
  tenderTitle,
  tenderDeadline,
  tenderValue,
  tenderCurrency,
  evaluationCriteria,
  tenderRequirements,
  onClose,
  onSubmit
}) => {
  const { user } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<NewBid>({
    tenderId,
    contractorId: user?.id || '',
    totalPrice: 0,
    currency: tenderCurrency,
    proposedTimeline: 30,
    proposedStartDate: new Date(),
    guaranteePeriod: 12,
    description: '',
    technicalProposal: '',
    qualityAssurance: '',
    riskMitigation: '',
    teamDescription: '',
    attachments: [],
    criteriaResponses: evaluationCriteria.map(criterion => ({
      criterionId: criterion.id,
      response: '',
      supportingDocuments: []
    })),
    acceptTerms: false,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (formData.totalPrice <= 0) newErrors.totalPrice = 'Cena musi być większa od 0';
      if (formData.proposedTimeline <= 0) newErrors.proposedTimeline = 'Czas realizacji musi być większy od 0';
      if (formData.proposedStartDate <= new Date()) newErrors.proposedStartDate = 'Data rozpoczęcia musi być w przyszłości';
      if (!formData.description.trim()) newErrors.description = 'Opis oferty jest wymagany';
    }

    if (step === 2) {
      if (!formData.technicalProposal.trim()) newErrors.technicalProposal = 'Propozycja techniczna jest wymagana';
      if (!formData.teamDescription.trim()) newErrors.teamDescription = 'Opis zespołu jest wymagany';
    }

    if (step === 3) {
      evaluationCriteria.forEach(criterion => {
        const response = formData.criteriaResponses.find(r => r.criterionId === criterion.id);
        if (!response?.response.trim()) {
          newErrors[`criteria_${criterion.id}`] = `Odpowiedź na kryterium "${criterion.name}" jest wymagana`;
        }
      });
    }

    if (step === 4) {
      if (!formData.acceptTerms) newErrors.acceptTerms = 'Musisz zaakceptować warunki przetargu';
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

    onSubmit(formData);
    toast.success(asDraft ? 'Oferta zapisana jako szkic' : 'Oferta została złożona pomyślnie');
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const attachment: BidAttachment = {
        id: `attachment-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: type as any,
        file,
        description: ''
      };

      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, attachment]
      }));
    });
  };

  const removeAttachment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== id)
    }));
  };

  const updateAttachmentDescription = (id: string, description: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.map(att => 
        att.id === id ? { ...att, description } : att
      )
    }));
  };

  const updateCriteriaResponse = (criterionId: string, response: string) => {
    setFormData(prev => ({
      ...prev,
      criteriaResponses: prev.criteriaResponses.map(cr =>
        cr.criterionId === criterionId ? { ...cr, response } : cr
      )
    }));
  };

  const daysUntilDeadline = Math.ceil((tenderDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold">Złóż ofertę w przetargu</h2>
              <p className="text-gray-600">{tenderTitle}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-orange-500" />
                  {daysUntilDeadline} dni do końca
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Wartość: {parseInt(tenderValue).toLocaleString('pl-PL')} {tenderCurrency}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="px-6 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Postęp: Krok {currentStep} z {totalSteps}</span>
              <span className="text-sm text-gray-500">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Oferta</span>
              <span>Propozycja</span>
              <span>Kryteria</span>
              <span>Podsumowanie</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step 1: Basic Offer */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Podstawowe parametry oferty
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="totalPrice">Łączna cena oferty *</Label>
                        <div className="flex">
                          <Input
                            id="totalPrice"
                            type="number"
                            value={formData.totalPrice || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, totalPrice: Number(e.target.value) }))}
                            placeholder="450000"
                            className={errors.totalPrice ? 'border-red-500' : ''}
                          />
                          <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            {formData.currency}
                          </span>
                        </div>
                        {errors.totalPrice && (
                          <p className="text-sm text-red-600 mt-1">{errors.totalPrice}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Wartość zamawiającego: {parseInt(tenderValue).toLocaleString('pl-PL')} {tenderCurrency}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="proposedTimeline">Czas realizacji (dni) *</Label>
                        <Input
                          id="proposedTimeline"
                          type="number"
                          value={formData.proposedTimeline}
                          onChange={(e) => setFormData(prev => ({ ...prev, proposedTimeline: Number(e.target.value) }))}
                          className={errors.proposedTimeline ? 'border-red-500' : ''}
                        />
                        {errors.proposedTimeline && (
                          <p className="text-sm text-red-600 mt-1">{errors.proposedTimeline}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="proposedStartDate">Planowana data rozpoczęcia *</Label>
                        <Input
                          id="proposedStartDate"
                          type="date"
                          value={formData.proposedStartDate.toISOString().split('T')[0]}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            proposedStartDate: new Date(e.target.value) 
                          }))}
                          className={errors.proposedStartDate ? 'border-red-500' : ''}
                        />
                        {errors.proposedStartDate && (
                          <p className="text-sm text-red-600 mt-1">{errors.proposedStartDate}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="guaranteePeriod">Okres gwarancji (miesiące)</Label>
                        <Input
                          id="guaranteePeriod"
                          type="number"
                          value={formData.guaranteePeriod}
                          onChange={(e) => setFormData(prev => ({ ...prev, guaranteePeriod: Number(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Opis oferty *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Krótki opis Twojej oferty, kluczowych zalet i podejścia do realizacji..."
                        rows={4}
                        className={errors.description ? 'border-red-500' : ''}
                      />
                      {errors.description && (
                        <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Requirements Check */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Wymagania przetargu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Upewnij się, że spełniasz wszystkie wymagania przetargu
                      </AlertDescription>
                    </Alert>
                    
                    <ul className="space-y-2">
                      {tenderRequirements.map((requirement, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 2: Technical Proposal */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Propozycja techniczna
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="technicalProposal">Opis techniczny realizacji *</Label>
                      <Textarea
                        id="technicalProposal"
                        value={formData.technicalProposal}
                        onChange={(e) => setFormData(prev => ({ ...prev, technicalProposal: e.target.value }))}
                        placeholder="Szczegółowy opis sposobu realizacji zadania, technologii, materiałów..."
                        rows={5}
                        className={errors.technicalProposal ? 'border-red-500' : ''}
                      />
                      {errors.technicalProposal && (
                        <p className="text-sm text-red-600 mt-1">{errors.technicalProposal}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="qualityAssurance">Zapewnienie jakości</Label>
                      <Textarea
                        id="qualityAssurance"
                        value={formData.qualityAssurance}
                        onChange={(e) => setFormData(prev => ({ ...prev, qualityAssurance: e.target.value }))}
                        placeholder="Procedury kontroli jakości, standardy, certyfikaty..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="riskMitigation">Zarządzanie ryzykiem</Label>
                      <Textarea
                        id="riskMitigation"
                        value={formData.riskMitigation}
                        onChange={(e) => setFormData(prev => ({ ...prev, riskMitigation: e.target.value }))}
                        placeholder="Identyfikacja potencjalnych ryzyk i sposoby ich mitygacji..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="teamDescription">Zespół realizujący *</Label>
                      <Textarea
                        id="teamDescription"
                        value={formData.teamDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, teamDescription: e.target.value }))}
                        placeholder="Opis zespołu, kwalifikacje kluczowych osób, doświadczenie..."
                        rows={4}
                        className={errors.teamDescription ? 'border-red-500' : ''}
                      />
                      {errors.teamDescription && (
                        <p className="text-sm text-red-600 mt-1">{errors.teamDescription}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Attachments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Załączniki
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {attachmentTypes.map((type) => (
                        <div key={type.value} className="border rounded-lg p-4 text-center">
                          <div className="text-2xl mb-2">{type.icon}</div>
                          <h4 className="font-medium text-sm mb-2">{type.label}</h4>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e, type.value)}
                            className="hidden"
                            id={`upload-${type.value}`}
                          />
                          <Label 
                            htmlFor={`upload-${type.value}`}
                            className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Dodaj
                          </Label>
                        </div>
                      ))}
                    </div>

                    {formData.attachments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Dodane załączniki:</h4>
                        {formData.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span className="font-medium">{attachment.name}</span>
                                <Badge variant="outline">{attachment.type}</Badge>
                              </div>
                              <Input
                                placeholder="Opis załącznika..."
                                value={attachment.description}
                                onChange={(e) => updateAttachmentDescription(attachment.id, e.target.value)}
                                className="mt-2 text-sm"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(attachment.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Evaluation Criteria Responses */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Odpowiedzi na kryteria oceny
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Odpowiedz szczegółowo na każde kryterium oceny. Twoje odpowiedzi będą podstawą do oceny oferty.
                      </AlertDescription>
                    </Alert>

                    {evaluationCriteria.map((criterion) => {
                      const response = formData.criteriaResponses.find(r => r.criterionId === criterion.id);
                      const error = errors[`criteria_${criterion.id}`];
                      
                      return (
                        <Card key={criterion.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium">{criterion.name}</h4>
                                <p className="text-sm text-gray-600">{criterion.description}</p>
                              </div>
                              <Badge variant="outline">{criterion.weight}%</Badge>
                            </div>
                            
                            <Textarea
                              value={response?.response || ''}
                              onChange={(e) => updateCriteriaResponse(criterion.id, e.target.value)}
                              placeholder={`Opisz jak Twoja oferta spełnia kryterium "${criterion.name}"...`}
                              rows={4}
                              className={error ? 'border-red-500' : ''}
                            />
                            
                            {error && (
                              <p className="text-sm text-red-600 mt-1">{error}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 4: Summary and Submit */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Podsumowanie oferty
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Parametry finansowe</h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>Cena:</strong> {formData.totalPrice.toLocaleString('pl-PL')} {formData.currency}</div>
                          <div><strong>Czas realizacji:</strong> {formData.proposedTimeline} dni</div>
                          <div><strong>Start:</strong> {formData.proposedStartDate.toLocaleDateString('pl-PL')}</div>
                          <div><strong>Gwarancja:</strong> {formData.guaranteePeriod} miesięcy</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Załączniki</h4>
                        <div className="space-y-1 text-sm">
                          {formData.attachments.length === 0 ? (
                            <p className="text-gray-500">Brak załączników</p>
                          ) : (
                            formData.attachments.map(att => (
                              <div key={att.id}>• {att.name}</div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Warunki i akceptacja</h4>
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="acceptTerms"
                          checked={formData.acceptTerms}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            acceptTerms: checked as boolean 
                          }))}
                          className={errors.acceptTerms ? 'border-red-500' : ''}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="acceptTerms" className="text-sm font-medium">
                            Akceptuję warunki przetargu
                          </Label>
                          <p className="text-xs text-gray-600">
                            Potwierdzam, że zapoznałem się z warunkami przetargu i akceptuję wszystkie wymagania.
                            Oferta jest ważna do {formData.validUntil.toLocaleDateString('pl-PL')}.
                          </p>
                        </div>
                      </div>
                      {errors.acceptTerms && (
                        <p className="text-sm text-red-600 mt-1">{errors.acceptTerms}</p>
                      )}
                    </div>

                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Oferta jest gotowa do złożenia. Po wysłaniu nie będzie możliwa jej edycja.
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
                  Zapisz szkic
                </Button>
              )}
              
              {currentStep < totalSteps ? (
                <Button onClick={handleNext}>
                  Następny
                </Button>
              ) : (
                <Button onClick={() => handleSubmit(false)}>
                  Złóż ofertę
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidSubmissionForm;