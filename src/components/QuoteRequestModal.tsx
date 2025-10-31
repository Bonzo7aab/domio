"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, DollarSign, MapPin, Clock, FileText, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUserProfile } from '../contexts/AuthContext';
import { createClient } from '../lib/supabase/client';
import { submitQuoteRequest, QuoteRequestData } from '../lib/database/messaging';

interface QuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractorId: string;
  contractorName: string;
}

const PROJECT_TYPES = [
  'Remont elewacji',
  'Termomodernizacja',
  'Prace wysokościowe',
  'Izolacje',
  'Rusztowania',
  'Malowanie',
  'Renowacja dachu',
  'Instalacje elektryczne',
  'Instalacje hydrauliczne',
  'Remont łazienki',
  'Remont kuchni',
  'Remont mieszkania',
  'Budowa domu',
  'Rozbudowa',
  'Inne'
];

const BUDGET_RANGES = [
  { label: 'Do 5 000 zł', min: 0, max: 5000 },
  { label: '5 000 - 10 000 zł', min: 5000, max: 10000 },
  { label: '10 000 - 25 000 zł', min: 10000, max: 25000 },
  { label: '25 000 - 50 000 zł', min: 25000, max: 50000 },
  { label: '50 000 - 100 000 zł', min: 50000, max: 100000 },
  { label: 'Powyżej 100 000 zł', min: 100000, max: 1000000 },
  { label: 'Wycena indywidualna', min: 0, max: 0 }
];

const TIMELINE_OPTIONS = [
  'Jak najszybciej',
  'W ciągu miesiąca',
  'W ciągu 2-3 miesięcy',
  'W ciągu pół roku',
  'Za rok',
  'Elastyczny termin'
];

export const QuoteRequestModal: React.FC<QuoteRequestModalProps> = ({
  isOpen,
  onClose,
  contractorId,
  contractorName
}) => {
  const { user } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userJobs, setUserJobs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    projectType: '',
    budgetRange: '',
    timeline: '',
    location: '',
    message: '',
    jobReference: 'none'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load user's jobs for optional reference
  useEffect(() => {
    async function loadUserJobs() {
      if (!user?.id) return;
      
      try {
        const supabase = createClient();
        const { data: jobs, error } = await (supabase as any)
          .from('jobs')
          .select('id, title, company')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && jobs) {
          setUserJobs(jobs);
        }
      } catch (error) {
        console.error('Error loading user jobs:', error);
      }
    }

    if (isOpen && user?.id) {
      loadUserJobs();
    }
  }, [isOpen, user?.id]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectType) {
      newErrors.projectType = 'Wybierz typ projektu';
    }
    if (!formData.budgetRange) {
      newErrors.budgetRange = 'Wybierz zakres budżetu';
    }
    if (!formData.timeline) {
      newErrors.timeline = 'Wybierz termin realizacji';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Podaj lokalizację';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Opisz szczegóły projektu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Wypełnij wszystkie wymagane pola');
      return;
    }

    if (!user) {
      toast.error('Musisz być zalogowany aby wysłać zapytanie o wycenę');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedBudgetRange = BUDGET_RANGES.find(range => 
        `${range.min}-${range.max}` === formData.budgetRange
      );

      if (!selectedBudgetRange) {
        throw new Error('Nieprawidłowy zakres budżetu');
      }

      const quoteData: QuoteRequestData = {
        projectType: formData.projectType,
        budgetRange: {
          min: selectedBudgetRange.min,
          max: selectedBudgetRange.max
        },
        timeline: formData.timeline,
        location: formData.location.trim(),
        jobReference: formData.jobReference === 'none' ? null : formData.jobReference
      };

      const supabase = createClient();
      const result = await submitQuoteRequest(
        supabase,
        user.id,
        contractorId, // This is the contractor company ID
        contractorName,
        formData.message.trim(),
        quoteData
      );

      if (result.success) {
        if (result.note) {
          // Contractor has no user account
          toast.warning('Informacja', {
            description: result.note,
            duration: 8000
          });
        } else {
          // Normal success
          toast.success('Zapytanie o wycenę zostało wysłane!', {
            description: `${contractorName} otrzyma powiadomienie o Twoim zapytaniu.`
          });
        }
        
        // Reset form
        setFormData({
          projectType: '',
          budgetRange: '',
          timeline: '',
          location: '',
          message: '',
          jobReference: 'none'
        });
        setErrors({});
        onClose();
      } else {
        console.error('Quote request failed:', result.error);
        
        // Check if this is a specific error about contractor not having a user account
        if (result.error?.message?.includes('nie ma przypisanego aktywnego konta użytkownika')) {
          toast.error('Nie można wysłać zapytania', {
            description: 'Ten wykonawca nie ma aktywnego konta w systemie. Skontaktuj się z nim bezpośrednio poprzez kontakt podany w profilu.',
            duration: 6000
          });
        } else {
          const errorMessage = result.error?.message || 'Wystąpił błąd podczas wysyłania zapytania';
          toast.error(errorMessage);
        }
        throw new Error(result.error?.message || 'Wystąpił błąd podczas wysyłania zapytania');
      }
    } catch (error) {
      console.error('Error submitting quote request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas wysyłania zapytania o wycenę';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        projectType: '',
        budgetRange: '',
        timeline: '',
        location: '',
        message: '',
        jobReference: 'none'
      });
      setErrors({});
      onClose();
    }
  };

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Zapytaj o wycenę
            </DialogTitle>
            <DialogDescription>
              Musisz być zalogowany aby wysłać zapytanie o wycenę do {contractorName}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Zamknij
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Zapytaj o wycenę
          </DialogTitle>
          <DialogDescription>
            Wyślij szczegółowe zapytanie o wycenę do: <strong>{contractorName}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Project Type */}
          <div className="space-y-2">
            <Label htmlFor="projectType">Typ projektu *</Label>
            <Select 
              value={formData.projectType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, projectType: value }))}
            >
              <SelectTrigger className={errors.projectType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Wybierz typ projektu" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.projectType && (
              <p className="text-sm text-red-500">{errors.projectType}</p>
            )}
          </div>

          {/* Budget Range */}
          <div className="space-y-2">
            <Label htmlFor="budgetRange">Zakres budżetu *</Label>
            <Select 
              value={formData.budgetRange} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, budgetRange: value }))}
            >
              <SelectTrigger className={errors.budgetRange ? 'border-red-500' : ''}>
                <SelectValue placeholder="Wybierz zakres budżetu" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_RANGES.map((range) => (
                  <SelectItem key={`${range.min}-${range.max}`} value={`${range.min}-${range.max}`}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.budgetRange && (
              <p className="text-sm text-red-500">{errors.budgetRange}</p>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <Label htmlFor="timeline">Termin realizacji *</Label>
            <Select 
              value={formData.timeline} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, timeline: value }))}
            >
              <SelectTrigger className={errors.timeline ? 'border-red-500' : ''}>
                <SelectValue placeholder="Wybierz termin realizacji" />
              </SelectTrigger>
              <SelectContent>
                {TIMELINE_OPTIONS.map((timeline) => (
                  <SelectItem key={timeline} value={timeline}>
                    {timeline}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.timeline && (
              <p className="text-sm text-red-500">{errors.timeline}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Lokalizacja *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="location"
                placeholder="np. Warszawa, ul. Główna 123"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className={`pl-10 ${errors.location ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location}</p>
            )}
          </div>

          {/* Job Reference */}
          {userJobs.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="jobReference">Odniesienie do ogłoszenia (opcjonalne)</Label>
              <Select 
                value={formData.jobReference} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, jobReference: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz ogłoszenie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Brak - ogólne zapytanie</SelectItem>
                  {userJobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} - {job.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Szczegóły projektu *</Label>
            <Textarea
              id="message"
              placeholder="Opisz szczegółowo swój projekt, wymagania, oczekiwania..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              className={`resize-none ${errors.message ? 'border-red-500' : ''}`}
            />
            {errors.message && (
              <p className="text-sm text-red-500">{errors.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Im więcej szczegółów podasz, tym dokładniejszą wycenę otrzymasz.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Anuluj
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Wyślij zapytanie
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
