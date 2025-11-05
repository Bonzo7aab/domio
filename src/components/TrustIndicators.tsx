import React from 'react';
import TrustBadge from './TrustBadge';
import { Badge } from './ui/badge';

interface TrustIndicatorsProps {
  verified?: boolean;
  isPremium?: boolean;
  hasInsurance?: boolean;
  certificates?: string[];
  rating?: number;
  visits_count?: number;
  bookmarks_count?: number;
  completedJobs?: number;
  clientType?: string;
  urgent?: boolean;
  showAll?: boolean;
  compact?: boolean;
  isContractorView?: boolean; // Nowa właściwość - czy to widok dla wykonawców
}

export default function TrustIndicators({
  verified = false,
  isPremium = false,
  hasInsurance = false,
  certificates = [],
  rating,
  visits_count,
  bookmarks_count,
  completedJobs,
  clientType,
  urgent = false,
  showAll = false,
  compact = false,
  isContractorView = true // Domyślnie true, dla widoku wykonawców
}: TrustIndicatorsProps) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${compact ? 'text-xs' : ''}`}>
      {/* Urgent badge */}
      {urgent && (
        <Badge variant="destructive" className="text-xs">
          Pilne
        </Badge>
      )}
      
      {/* Verification badge - tylko dla wykonawców */}
      {verified && isContractorView && (
        <TrustBadge 
          type="verified" 
          tooltip="Firma przeszła weryfikację tożsamości i referencji w Urbi.eu"
        />
      )}
      
      {/* Premium badge - tylko dla wykonawców */}
      {isPremium && isContractorView && (
        <TrustBadge 
          type="premium" 
          tooltip="Wykonawca premium z dostępem do dodatkowych funkcji"
        />
      )}
      
      {/* Client type */}
      {clientType && (
        <Badge variant="outline" className="text-xs">
          {clientType}
        </Badge>
      )}
      
      {/* Rating (for contractors) or visits/bookmarks (for jobs) */}
      {isContractorView && rating && (
        <div className="flex items-center space-x-2">
          <TrustBadge type="rating" value={rating} />
          {completedJobs && showAll && (
            <TrustBadge 
              type="experience" 
              value={completedJobs}
              tooltip={`Firma wykonała ${completedJobs} zleceń na platformie Urbi.eu`}
            />
          )}
        </div>
      )}
      {/* Visits and bookmarks for jobs */}
      {!isContractorView && (visits_count !== undefined || bookmarks_count !== undefined) && (
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          {visits_count !== undefined && visits_count > 0 && (
            <span>{visits_count} wyświetleń</span>
          )}
          {bookmarks_count !== undefined && bookmarks_count > 0 && (
            <span>{bookmarks_count} zapisów</span>
          )}
        </div>
      )}
      {!isContractorView && completedJobs && showAll && (
        <TrustBadge 
          type="experience" 
          value={completedJobs}
          tooltip={`Wspólnota/spółdzielnia opublikowała ${completedJobs} zleceń na platformie Urbi.eu`}
        />
      )}
      
      {/* Insurance and certificates - tylko dla wykonawców */}
      {(showAll || !compact) && isContractorView && (
        <>
          {hasInsurance && (
            <TrustBadge 
              type="insurance" 
              tooltip="Firma posiada aktywne ubezpieczenie OC"
            />
          )}
          
          {certificates.length > 0 && (
            <TrustBadge 
              type="certificates" 
              tooltip={`Certyfikaty: ${certificates.join(', ')}`}
            />
          )}
        </>
      )}
    </div>
  );
}