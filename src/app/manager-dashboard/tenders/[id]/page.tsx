"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';
import { fetchTenderById, fetchTenderBidsByTenderId } from '../../../../lib/database/jobs';
import { toast } from 'sonner';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import BidEvaluationPanel from '../../../../components/BidEvaluationPanel';

export default function TenderBidEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const tenderId = params.id as string;
  const [tenderBids, setTenderBids] = useState<any[]>([]);
  const [isLoadingTenderBids, setIsLoadingTenderBids] = useState(false);
  const [selectedTenderData, setSelectedTenderData] = useState<{ title: string } | null>(null);

  useEffect(() => {
    async function loadTenderBids() {
      if (!tenderId) {
        return;
      }

      setIsLoadingTenderBids(true);
      try {
        const supabase = createClient();
        
        // Fetch tender data to get title
        const { data: tenderData, error: tenderError } = await fetchTenderById(supabase, tenderId);
        
        if (tenderError || !tenderData) {
          console.error('Error fetching tender data:', tenderError);
          toast.error('Nie udało się załadować danych przetargu');
          setSelectedTenderData(null);
        } else {
          setSelectedTenderData({
            title: tenderData.title
          });
        }
        
        // Fetch bids
        const { data: bidsData, error: bidsError } = await fetchTenderBidsByTenderId(
          supabase,
          tenderId
        );
        
        if (bidsError) {
          console.error('Error fetching tender bids:', bidsError);
          toast.error('Nie udało się załadować ofert');
          setTenderBids([]);
        } else {
          setTenderBids(bidsData || []);
        }
      } catch (err) {
        console.error('Error loading tender bids:', err);
        toast.error('Wystąpił błąd podczas ładowania ofert');
        setTenderBids([]);
      } finally {
        setIsLoadingTenderBids(false);
      }
    }

    loadTenderBids();
  }, [tenderId]);

  const handleAwardTender = (bidId: string, notes: string) => {
    // In real app, this would award the tender
    router.push('/manager-dashboard/tenders');
  };

  const handleRejectBid = (bidId: string, reason: string) => {
    // In real app, this would reject the bid
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Button 
        variant="outline" 
        onClick={() => router.push('/manager-dashboard/tenders')}
        className="mb-4"
      >
        ← Powrót do listy przetargów
      </Button>
      
      {isLoadingTenderBids ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-2 text-sm text-muted-foreground">Ładowanie ofert...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <BidEvaluationPanel
          tenderId={tenderId}
          tenderTitle={selectedTenderData?.title || 'Przetarg'}
          evaluationCriteria={[
            { id: 'price', name: 'Cena oferty', description: 'Łączna cena realizacji', weight: 40, type: 'price' },
            { id: 'quality', name: 'Jakość wykonania', description: 'Doświadczenie i referencje', weight: 30, type: 'quality' },
            { id: 'time', name: 'Termin realizacji', description: 'Czas wykonania prac', weight: 20, type: 'time' },
            { id: 'warranty', name: 'Gwarancja', description: 'Okres gwarancji i serwis', weight: 10, type: 'quality' }
          ]}
          bids={tenderBids}
          onClose={() => {
            router.push('/manager-dashboard/tenders');
          }}
          onAwardTender={handleAwardTender}
          onRejectBid={handleRejectBid}
        />
      )}
    </div>
  );
}
