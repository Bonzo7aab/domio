"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, UserCheck } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { formatBudget } from '../../../types/budget';
import { getStatusBadgeConfig } from '../../../components/manager-dashboard/shared/utils';
import type { Budget } from '../../../types/budget';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { fetchJobById } from '../../../lib/database/jobs';
import { createClient } from '../../../lib/supabase/client';
import { toast } from 'sonner';
import { budgetFromDatabase } from '../../../types/budget';
import { Phone, Mail } from 'lucide-react';
import type { JobWithCompany } from '../../../lib/database/jobs';

interface Job {
  id: string;
  title: string;
  category: string;
  status: string;
  budget: Budget;
  applications: number;
  deadline: string;
  address: string;
}

interface JobsContentProps {
  jobs: Job[];
  companyId: string;
}

export function JobsContent({ jobs, companyId }: JobsContentProps) {
  const router = useRouter();
  const [selectedJobForApplications, setSelectedJobForApplications] = useState<string | null>(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<string | null>(null);
  const [jobDetailsData, setJobDetailsData] = useState<JobWithCompany | null>(null);
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false);
  const [showJobDetailsDialog, setShowJobDetailsDialog] = useState(false);

  const handleTenderCreate = () => {
    router.push('/manager-dashboard/tenders?create=true');
  };

  const handlePostJob = () => {
    router.push('/post-job');
  };

  const handleViewJobDetails = async (jobId: string) => {
    setSelectedJobForDetails(jobId);
    setShowJobDetailsDialog(true);
    setIsLoadingJobDetails(true);
    
    try {
      const supabase = createClient();
      const { data: jobData, error: jobError } = await fetchJobById(supabase, jobId);
      
      if (jobError || !jobData) {
        console.error('Error fetching job details:', jobError);
        toast.error('Nie udało się załadować szczegółów zlecenia');
        setJobDetailsData(null);
      } else {
        setJobDetailsData(jobData);
      }
    } catch (err) {
      console.error('Error loading job details:', err);
      toast.error('Wystąpił błąd podczas ładowania szczegółów zlecenia');
      setJobDetailsData(null);
    } finally {
      setIsLoadingJobDetails(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Zarządzanie zleceniami</h2>
        </div>

        <div className="grid gap-4">
          {jobs.length > 0 ? jobs.map((job) => {
            const statusConfig = getStatusBadgeConfig(job.status);
            return (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{job.category}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Termin: {job.deadline}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-4 h-4" />
                          <span>{job.applications} ofert</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatBudget(job.budget)}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewJobDetails(job.id)}
                        >
                          Szczegóły
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => setSelectedJobForApplications(job.id)}
                        >
                          Zobacz oferty
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Brak zleceń</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Job Details Dialog */}
      <Dialog open={showJobDetailsDialog} onOpenChange={(open) => {
        setShowJobDetailsDialog(open);
        if (!open) {
          setSelectedJobForDetails(null);
          setJobDetailsData(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Szczegóły zlecenia</DialogTitle>
            <DialogDescription>
              Pełne informacje o zleceniu
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingJobDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-2 text-sm text-muted-foreground">Ładowanie szczegółów...</p>
            </div>
          ) : jobDetailsData ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{jobDetailsData.title}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    {(() => {
                      const statusConfig = getStatusBadgeConfig(jobDetailsData.status);
                      return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>;
                    })()}
                    <span className="text-sm text-gray-600">
                      {jobDetailsData.category?.name || 'Inne'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">
                  {jobDetailsData.budget 
                    ? formatBudget(jobDetailsData.budget)
                    : formatBudget(budgetFromDatabase({
                        budget_min: jobDetailsData.budget_min ?? null,
                        budget_max: jobDetailsData.budget_max ?? null,
                        budget_type: (jobDetailsData.budget_type || 'fixed') as 'fixed' | 'hourly' | 'negotiable' | 'range',
                        currency: jobDetailsData.currency || 'PLN',
                      }))}
                </span>
              </div>

              {typeof jobDetailsData.location === 'string' 
                ? jobDetailsData.location 
                : jobDetailsData.location?.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {typeof jobDetailsData.location === 'string' 
                        ? jobDetailsData.location 
                        : jobDetailsData.location?.city || 'Nieznana lokalizacja'}
                    </span>
                  </div>
              )}

              {jobDetailsData.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    Termin: {new Date(jobDetailsData.deadline).toLocaleDateString('pl-PL')}
                  </span>
                </div>
              )}

              {jobDetailsData.description && (
                <div>
                  <h3 className="font-semibold mb-2">Opis zlecenia</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{jobDetailsData.description}</p>
                </div>
              )}

              {jobDetailsData.requirements && jobDetailsData.requirements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Wymagania</h3>
                  <ul className="space-y-1">
                    {jobDetailsData.requirements.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {jobDetailsData.responsibilities && jobDetailsData.responsibilities.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Zakres prac</h3>
                  <ul className="space-y-1">
                    {jobDetailsData.responsibilities.map((resp, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-gray-700">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(jobDetailsData.contact_person || jobDetailsData.contact_phone || jobDetailsData.contact_email) && (
                <div>
                  <h3 className="font-semibold mb-2">Informacje kontaktowe</h3>
                  <div className="space-y-1 text-sm">
                    {jobDetailsData.contact_person && (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{jobDetailsData.contact_person}</span>
                      </div>
                    )}
                    {jobDetailsData.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{jobDetailsData.contact_phone}</span>
                      </div>
                    )}
                    {jobDetailsData.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{jobDetailsData.contact_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nie udało się załadować szczegółów zlecenia</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
