import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { 
  X, 
  Send, 
  Calculator,
  AlertCircle,
  MapPin,
  Clock,
  Users,
  Star,
  Building2,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useUserProfile } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  jobData?: any; // Full job data for additional info
  onApplicationSubmit: (applicationData: any) => void;
  applicationForm: any;
  setApplicationForm: (form: any) => void;
  postType?: 'job' | 'tender';
}

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  isOpen,
  onClose,
  jobTitle,
  companyName,
  jobData,
  onApplicationSubmit,
  applicationForm,
  setApplicationForm,
  postType
}) => {
  const { user } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper function to format location (string or object)
  const formatLocation = (location: string | { city: string; sublocality_level_1?: string } | undefined): string => {
    if (!location) return 'Nieznana lokalizacja';
    
    if (typeof location === 'string') {
      return location;
    }
    
    if (typeof location === 'object' && location !== null && 'city' in location) {
      if (location.sublocality_level_1) {
        return `${location.city || 'Nieznana'}, ${location.sublocality_level_1}`;
      }
      return location.city || 'Nieznana lokalizacja';
    }
    
    return 'Nieznana lokalizacja';
  };

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setApplicationForm((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!applicationForm.proposedPrice) {
      newErrors.proposedPrice = 'Podaj proponowaną cenę';
    } else if (isNaN(Number(applicationForm.proposedPrice)) || Number(applicationForm.proposedPrice) <= 0) {
      newErrors.proposedPrice = 'Podaj prawidłową kwotę';
    }

    if (!applicationForm.estimatedCompletion) {
      newErrors.estimatedCompletion = 'Podaj przewidywany czas realizacji';
    }

    if (!applicationForm.coverLetter || applicationForm.coverLetter.length < 50) {
      newErrors.coverLetter = 'Opis oferty musi mieć min. 50 znaków';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Wypełnij wszystkie wymagane pola');
      return;
    }

    setIsSubmitting(true);

    try {
      const applicationData = {
        id: Math.random().toString(36).substr(2, 9),
        contractorId: user?.id || '',
        contractorName: user?.firstName || '',
        proposedPrice: Number(applicationForm.proposedPrice),
        estimatedCompletion: applicationForm.estimatedCompletion,
        coverLetter: applicationForm.coverLetter,
        additionalNotes: applicationForm.additionalNotes,
        submittedAt: new Date(),
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onApplicationSubmit(applicationData);
    } catch (error) {
      toast.error('Wystąpił błąd podczas wysyłania oferty');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-full lg:min-w-[800px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-3 pb-2 border-b">
          <DialogTitle className="text-xl font-semibold">
            {postType === 'tender' ? 'Złóż ofertę w przetargu' : 'Złóż ofertę'}
          </DialogTitle>
        </DialogHeader>

        {/* Job Information Section */}
        <div className="bg-white border-b">
          <div className="px-6 py-4">
            {/* Icon and Title Row */}
            <div className="flex items-center gap-3 mb-3">
              {/* Job Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  {postType === 'tender' ? (
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Building2 className="w-6 h-6 text-blue-600" />
                  )}
                </div>
              </div>
              
              {/* Job Title */}
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
                {jobTitle}
              </h3>
            </div>
            
            {/* Info Cards Row - left aligned */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* Company */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-100">
                <Building2 className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-700 font-medium truncate">{companyName}</span>
              </div>
              
              {/* Location */}
              {jobData?.location && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-100">
                  <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700 font-medium truncate">{formatLocation(jobData.location)}</span>
                </div>
              )}
              
              {/* Salary/Budget */}
              {jobData?.salary && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 rounded-md border border-green-100">
                  <DollarSign className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-green-700 font-medium">{jobData.salary}</span>
                </div>
              )}
              
              {/* Posted Time */}
              {jobData?.postedTime && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-100">
                  <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700 font-medium">{jobData.postedTime}</span>
                </div>
              )}
              
              {/* Applications Count */}
              {jobData?.applications && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-100">
                  <Users className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700 font-medium">{jobData.applications} {jobData.applications === 1 ? 'oferta' : 'oferty'}</span>
                </div>
              )}
              
              {/* Visits */}
              {jobData?.visits_count !== undefined && jobData.visits_count > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-100">
                  <span className="text-xs sm:text-sm text-gray-700 font-medium">{jobData.visits_count} wyświetleń</span>
                </div>
              )}
            </div>
            
            {/* Category & Type Badges - left aligned */}
            {(jobData?.category || jobData?.type || postType === 'tender') && (
              <div className="flex flex-wrap gap-2 mb-2">
                {jobData?.category && (
                  <Badge variant="outline" className="text-xs px-2.5 py-1">
                    {jobData.category}
                  </Badge>
                )}
                {jobData?.type && (
                  <Badge variant="outline" className="text-xs px-2.5 py-1">
                    {jobData.type}
                  </Badge>
                )}
                {postType === 'tender' && (
                  <Badge variant="outline" className="text-xs px-2.5 py-1 bg-orange-50 text-orange-800 border-orange-200">
                    Przetarg
                  </Badge>
                )}
              </div>
            )}
            
            {/* Job Description - left aligned */}
            {jobData?.description && (
              <div>
                <p className="text-sm text-gray-700 line-clamp-3">
                  {jobData.description}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Podstawowe informacje o ofercie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Szczegóły oferty
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="proposedPrice">Proponowana cena (zł) *</Label>
                    <Input
                      id="proposedPrice"
                      type="number"
                      placeholder="np. 5000"
                      value={applicationForm.proposedPrice}
                      onChange={(e) => handleInputChange('proposedPrice', e.target.value)}
                      className={errors.proposedPrice ? 'border-red-500' : ''}
                    />
                    {errors.proposedPrice && (
                      <p className="text-red-500 text-sm mt-1">{errors.proposedPrice}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="estimatedCompletion">Czas realizacji *</Label>
                    <Select onValueChange={(value) => handleInputChange('estimatedCompletion', value)}>
                      <SelectTrigger className={errors.estimatedCompletion ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Wybierz czas realizacji" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-3 dni">1-3 dni</SelectItem>
                        <SelectItem value="1 tydzień">1 tydzień</SelectItem>
                        <SelectItem value="2 tygodnie">2 tygodnie</SelectItem>
                        <SelectItem value="1 miesiąc">1 miesiąc</SelectItem>
                        <SelectItem value="2-3 miesiące">2-3 miesiące</SelectItem>
                        <SelectItem value="więcej niż 3 miesiące">Więcej niż 3 miesiące</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.estimatedCompletion && (
                      <p className="text-red-500 text-sm mt-1">{errors.estimatedCompletion}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opis oferty */}
            <Card>
              <CardHeader>
                <CardTitle>Opis oferty *</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Opisz swoją ofertę, podejście do realizacji zlecenia, doświadczenie i to co wyróżnia Cię na tle konkurencji..."
                  value={applicationForm.coverLetter}
                  onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                  className={`min-h-[120px] ${errors.coverLetter ? 'border-red-500' : ''}`}
                />
                <div className="flex justify-between items-center mt-2">
                  {errors.coverLetter && (
                    <p className="text-red-500 text-sm">{errors.coverLetter}</p>
                  )}
                  <p className="text-gray-500 text-sm ml-auto">
                    {applicationForm.coverLetter.length}/500 znaków
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dodatkowe uwagi */}
            <Card>
              <CardHeader>
                <CardTitle>Dodatkowe uwagi</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Dodatkowe informacje, pytania lub uwagi dotyczące zlecenia..."
                  value={applicationForm.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>
          </form>
        </div>

        <DialogFooter className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2" />
                Wysyłanie...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {postType === 'tender' ? 'Wyślij ofertę w przetargu' : 'Wyślij ofertę'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobApplicationModal;