"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';
import { createTender, updateTender, fetchTenderById } from '../../../lib/database/jobs';
import { fetchUserPrimaryCompany } from '../../../lib/database/companies';
import { useUserProfile } from '../../../contexts/AuthContext';
import { toast } from 'sonner';
import TenderSystem from '../../../components/TenderSystem';
import TenderCreationForm from '../../../components/TenderCreationForm';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import type { TenderWithCompany } from '../../../lib/database/jobs';

export default function TendersPage() {
  const { user } = useUserProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showTenderCreation, setShowTenderCreation] = useState(false);
  const [editingTenderId, setEditingTenderId] = useState<string | null>(null);
  const [editingTenderData, setEditingTenderData] = useState<TenderWithCompany | null>(null);
  const [hasCompany, setHasCompany] = useState<boolean | null>(null);
  const [isCheckingCompany, setIsCheckingCompany] = useState(true);
  const pendingCreateRef = React.useRef(false);

  // Check if user has a company
  useEffect(() => {
    const checkCompany = async () => {
      if (!user?.id) {
        setIsCheckingCompany(false);
        return;
      }
      
      try {
        const supabase = createClient();
        const { data: company } = await fetchUserPrimaryCompany(supabase, user.id);
        setHasCompany(!!company);
      } catch (error) {
        console.error('Error checking company:', error);
        setHasCompany(false);
      } finally {
        setIsCheckingCompany(false);
      }
    };
    
    checkCompany();
  }, [user]);

  // Check if we should open tender form from URL
  useEffect(() => {
    const shouldCreate = searchParams.get('create') === 'true';
    if (shouldCreate) {
      pendingCreateRef.current = true;
      // Remove query param from URL
      router.replace('/manager-dashboard/tenders', { scroll: false });
    }
  }, [searchParams, router]);

  // Handle pending create action after company check completes
  useEffect(() => {
    // Wait for company check to complete
    if (isCheckingCompany || !pendingCreateRef.current) return;
    
    // Clear the pending flag
    pendingCreateRef.current = false;
    
    // Handle the create action based on company status
    if (hasCompany) {
      setShowTenderCreation(true);
    } else {
      // Show error toast if trying to create without company
      toast.error('Najpierw musisz dodać dane firmy w profilu');
    }
  }, [hasCompany, isCheckingCompany]);

  const handleTenderCreate = () => {
    // Check if company exists before allowing creation
    if (!hasCompany) {
      toast.error('Najpierw musisz dodać dane firmy w profilu');
      router.push('/account?tab=company');
      return;
    }
    setEditingTenderId(null);
    setEditingTenderData(null);
    setShowTenderCreation(true);
  };

  const handleTenderEdit = async (tenderId: string) => {
    // Check if company exists before allowing edit
    if (!hasCompany) {
      toast.error('Najpierw musisz dodać dane firmy w profilu');
      router.push('/account?tab=company');
      return;
    }

    try {
      const supabase = createClient();
      const { data: tenderData, error } = await fetchTenderById(supabase, tenderId);
      
      if (error || !tenderData) {
        toast.error('Nie udało się załadować danych przetargu');
        console.error('Error fetching tender:', error);
        return;
      }

      // Verify it's a draft tender
      if (tenderData.status !== 'draft') {
        toast.error('Tylko przetargi w statusie szkicu mogą być edytowane');
        return;
      }

      setEditingTenderId(tenderId);
      setEditingTenderData(tenderData);
      setShowTenderCreation(true);
    } catch (error) {
      toast.error('Wystąpił błąd podczas ładowania przetargu');
      console.error('Error in handleTenderEdit:', error);
    }
  };

  const handleTenderSubmit = async (tender: any, tenderId?: string) => {
    if (!user?.id) {
      toast.error('Musisz być zalogowany, aby utworzyć przetarg');
      return;
    }

    // Ensure company exists before any tender operation
    if (!hasCompany) {
      toast.error('Najpierw musisz dodać dane firmy w profilu');
      router.push('/account?tab=company');
      return;
    }

    try {
      const supabase = createClient();
      
      // Check if we're editing or creating
      const isEditing = !!tenderId;
      
      if (isEditing) {
        // Update existing tender
        const { data: updatedTender, error: updateError } = await updateTender(supabase, tenderId, tender);
        
        if (updateError) {
          toast.error('Nie udało się zaktualizować przetargu: ' + (updateError.message || 'Nieznany błąd'));
          console.error('Error updating tender:', updateError);
          return;
        }

        toast.success(tender.status === 'draft' ? 'Przetarg zaktualizowany jako szkic' : 'Przetarg został zaktualizowany i opublikowany');
      } else {
        // Create new tender
        // Get user's primary company
        const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, user.id);
        
        if (companyError || !company) {
          toast.error('Nie znaleziono firmy. Proszę najpierw uzupełnić dane firmy w profilu.');
          console.error('Error fetching company:', companyError);
          return;
        }

        // Save tender to database
        const { data: savedTender, error: saveError } = await createTender(supabase, {
          ...tender,
          managerId: user.id,
          companyId: company.id,
        });

        if (saveError) {
          toast.error('Nie udało się zapisać przetargu: ' + (saveError.message || 'Nieznany błąd'));
          console.error('Error saving tender:', saveError);
          return;
        }

        toast.success(tender.status === 'draft' ? 'Przetarg zapisany jako szkic' : 'Przetarg został opublikowany');
      }

      // Reset editing state
      setEditingTenderId(null);
      setEditingTenderData(null);
      setShowTenderCreation(false);
      
      // Refresh the page to show the updated/new tender
      router.refresh();
    } catch (error) {
      toast.error('Wystąpił błąd podczas zapisywania przetargu');
      console.error('Error in handleTenderSubmit:', error);
    }
  };

  const handleTenderSelect = (tenderId: string) => {
    router.push(`/manager-dashboard/tenders/${tenderId}`);
  };

  // Show loading while checking company
  if (isCheckingCompany) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-2 text-sm text-muted-foreground">Ładowanie...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show message with button if no company
  if (!hasCompany) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center space-y-4 gap-2 flex flex-col justify-center">
            <p className="text-muted-foreground">Nie znaleziono firmy. Proszę najpierw uzupełnić dane firmy w profilu.</p>
            <Link href="/account?tab=company">
              <Button>Dodaj dane firmy w profilu</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Suspense fallback={
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-2 text-sm text-muted-foreground">Ładowanie przetargów...</p>
            </div>
          </CardContent>
        </Card>
      }>
        <TenderSystem 
          userRole="manager"
          onTenderCreate={handleTenderCreate}
          onTenderSelect={handleTenderSelect}
          onTenderEdit={handleTenderEdit}
          onViewBids={(tenderId) => {
            router.push(`/manager-dashboard/tenders/${tenderId}`);
          }}
        />
      </Suspense>

      {/* Tender Creation Modal */}
      {showTenderCreation && hasCompany && (
        <TenderCreationForm
          onClose={() => {
            setShowTenderCreation(false);
            setEditingTenderId(null);
            setEditingTenderData(null);
          }}
          onSubmit={handleTenderSubmit}
          tenderId={editingTenderId || undefined}
          initialData={editingTenderData || undefined}
        />
      )}
    </div>
  );
}
