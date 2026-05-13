"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "../../../../../lib/supabase/client";
import { fetchJobById, fetchJobApplicationsByJobId } from "../../../../../lib/database/jobs";
import { Card, CardContent } from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import JobApplicationsList from "../../../../../components/JobApplicationsList";
import type { Application } from "../../../../../types/application";
import { budgetFromDatabase, formatBudget } from "../../../../../types/budget";

interface SelectedJobData {
  title: string;
  budget: string;
}

export default function JobApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [jobData, setJobData] = useState<SelectedJobData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!jobId) {
        return;
      }

      setIsLoading(true);

      try {
        const supabase = createClient();

        const [{ data: job, error: jobError }, { data: applicationsData, error: applicationsError }] =
          await Promise.all([
            fetchJobById(supabase, jobId),
            fetchJobApplicationsByJobId(supabase, jobId),
          ]);

        if (jobError || !job) {
          console.error("Error fetching job data:", {
            message: jobError?.message,
            code: jobError?.code,
            details: jobError?.details,
            hint: jobError?.hint,
            rawError: jobError,
          });
          toast.error("Nie udało się załadować danych zlecenia");
          setJobData(null);
        } else {
          const budget = job.budget
            ? formatBudget(job.budget)
            : formatBudget(
                budgetFromDatabase({
                  budget_min: job.budget_min ?? null,
                  budget_max: job.budget_max ?? null,
                  budget_type: (job.budget_type || "fixed") as "fixed" | "hourly" | "negotiable" | "range",
                  currency: job.currency || "PLN",
                }),
              );

          setJobData({
            title: job.title,
            budget,
          });
        }

        if (applicationsError) {
          console.error("Error fetching job applications:", {
            message: applicationsError.message,
            code: applicationsError.code,
            details: applicationsError.details,
            hint: applicationsError.hint,
            rawError: applicationsError,
          });
          toast.error("Nie udało się załadować ofert");
          setApplications([]);
        } else {
          setApplications(applicationsData || []);
        }
      } catch (error: unknown) {
        console.error("Error loading applications page data:", error);
        toast.error("Wystąpił błąd podczas ładowania ofert");
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [jobId]);

  const handleStatusChange = (applicationId: string, status: string, notes?: string) => {
    // Persisting status changes is not implemented in the current DB layer.
    setApplications((prev) =>
      prev.map((application) =>
        application.id === applicationId
          ? { ...application, status: status as Application["status"], reviewNotes: notes }
          : application,
      ),
    );
  };

  const handleStartConversation = (_contractorId: string) => {
    toast.info("Czat będzie dostępny w kolejnej iteracji.");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Button
        variant="outline"
        onClick={() => router.push("/manager-dashboard/zgloszenia")}
        className="mb-4"
      >
        ← Powrót do listy zgłoszeń
      </Button>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-2 text-sm text-muted-foreground">Ładowanie ofert...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <JobApplicationsList
          jobId={jobId}
          jobTitle={jobData?.title || "Zlecenie"}
          jobBudget={jobData?.budget}
          applications={applications}
          onStatusChange={handleStatusChange}
          onStartConversation={handleStartConversation}
        />
      )}
    </div>
  );
}
