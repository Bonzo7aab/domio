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
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold">
            {postType === 'tender' ? 'Złóż ofertę w przetargu' : 'Złóż ofertę'}
          </DialogTitle>
        </DialogHeader>

        {/* Job Information Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="p-6">
            <div className="flex items-start gap-4">
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
              
              {/* Job Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {jobTitle}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {/* Company & Location */}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{companyName}</span>
                  </div>
                  
                  {jobData?.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{formatLocation(jobData.location)}</span>
                    </div>
                  )}
                  
                  {/* Salary/Budget */}
                  {jobData?.salary && (
                    <div className="flex items-center gap-2 text-green-600">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-medium">{jobData.salary}</span>
                    </div>
                  )}
                  
                  {/* Posted Time */}
                  {jobData?.postedTime && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{jobData.postedTime}</span>
                    </div>
                  )}
                  
                  {/* Applications Count */}
                  {jobData?.applications && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{jobData.applications} {jobData.applications === 1 ? 'oferta' : 'oferty'}</span>
                    </div>
                  )}
                  
                  {/* Visits and Bookmarks */}
                  {(jobData?.visits_count || jobData?.bookmarks_count) && (
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      {jobData.visits_count !== undefined && jobData.visits_count > 0 && (
                        <span>{jobData.visits_count} wyświetleń</span>
                      )}
                      {jobData.bookmarks_count !== undefined && jobData.bookmarks_count > 0 && (
                        <span>{jobData.bookmarks_count} zapisów</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Category & Type */}
                {(jobData?.category || jobData?.type) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {jobData?.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {jobData.category}
                      </span>
                    )}
                    {jobData?.type && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {jobData.type}
                      </span>
                    )}
                    {postType === 'tender' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Przetarg
                      </span>
                    )}
                  </div>
                )}
                
                {/* Job Description */}
                {jobData?.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {jobData.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
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
                <div className="grid grid-cols-2 gap-4">
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