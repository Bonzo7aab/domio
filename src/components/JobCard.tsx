import React, { useMemo, useCallback } from 'react';
import { MapPin, Clock, BookmarkIcon, Eye, Gavel, Wrench, Users, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { TenderStatusBadge } from './TenderStatusBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { getDaysRemaining, formatDaysRemaining, isTenderEndingSoon } from '../utils/tenderHelpers';
import { useUserProfile } from '../contexts/AuthContext';
import type { Job, TenderInfo } from '../types/job';

interface JobCardProps {
  job: Partial<Job> & {
    id: string;
    title: string;
    company: string;
    location: string | { city: string; sublocality_level_1?: string };
    type: string;
    salary: string;
    description: string;
    postedTime: string;
    applications?: number;
    verified: boolean;
    urgent?: boolean;
    distance?: number;
  };
  onClick?: () => void;
  onBookmark?: (jobId: string) => void;
  isBookmarked?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isHighlighted?: boolean;
  onApplyClick?: (jobId: string, jobData?: any) => void;
  isExpired?: boolean;
}

const JobCard = React.memo(function JobCard({ 
  job, 
  onClick, 
  onBookmark, 
  isBookmarked = false, 
  onMouseEnter, 
  onMouseLeave, 
  isHighlighted = false,
  onApplyClick,
  isExpired = false
}: JobCardProps) {
  const { user } = useUserProfile();
  const isManager = user?.userType === 'manager';

  const handleBookmarkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onBookmark?.(job.id);
  }, [job.id, onBookmark]);

  const handleApplyClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApplyClick) {
      onApplyClick(job.id, job);
    }
  }, [job.id, job, onApplyClick]);

  const isTender = useMemo(() => job.postType === 'tender', [job.postType]);

  // Calculate days remaining for deadline
  const deadlineDaysRemaining = useMemo(() => {
    try {
      if (isTender && job.tenderInfo?.submissionDeadline) {
        const date = new Date(job.tenderInfo.submissionDeadline);
        if (isNaN(date.getTime())) return null;
        return getDaysRemaining(date);
      }
      if (job.deadline) {
        const date = new Date(job.deadline);
        if (isNaN(date.getTime())) return null;
        return getDaysRemaining(date);
      }
    } catch (error) {
      console.error('Error calculating days remaining:', error);
    }
    return null;
  }, [isTender, job.tenderInfo?.submissionDeadline, job.deadline]);

  // Check if deadline is ending soon (less than 7 days, including today)
  const isEndingSoon = useMemo(() => {
    if (deadlineDaysRemaining === null) return false;
    // Check if 7 days or less remaining (including 0 for today)
    return deadlineDaysRemaining >= 0 && deadlineDaysRemaining <= 6;
  }, [deadlineDaysRemaining]);

  // Format deadline for display
  const formattedDeadline = useMemo(() => {
    if (!job.deadline) return null;
    try {
      const deadlineDate = new Date(job.deadline);
      if (isNaN(deadlineDate.getTime())) return job.deadline; // Return as-is if invalid
      return deadlineDate.toLocaleDateString('pl-PL', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return job.deadline; // Return as-is if parsing fails
    }
  }, [job.deadline]);

  if (isTender) {

    return (
      <Card 
        className={`cursor-pointer hover:shadow-lg transition-shadow w-full max-w-full ${
          isExpired ? 'bg-gray-50 opacity-60' : 'bg-white'
        }`}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start md:items-center justify-between mb-2 gap-2">
                <div className="flex items-start md:items-center gap-2 md:gap-3 flex-wrap min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                    <Gavel className="w-4 h-4 text-warning flex-shrink-0" />
                    <h3 className={`font-semibold text-base md:text-lg truncate ${isExpired ? 'text-gray-500' : ''}`}>{job.title}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
                    {isExpired && (
                      <Badge variant="secondary" className="text-xs">
                        Wygasłe
                      </Badge>
                    )}
                    {/* Map current phase to valid tender status */}
                    <TenderStatusBadge status={
                      job.tenderInfo?.currentPhase?.toLowerCase().includes('ocena') || 
                      job.tenderInfo?.currentPhase?.toLowerCase().includes('evaluation') ? 'evaluation' :
                      job.tenderInfo?.currentPhase?.toLowerCase().includes('rozstrzyg') ||
                      job.tenderInfo?.currentPhase?.toLowerCase().includes('awarded') ? 'awarded' :
                      job.tenderInfo?.currentPhase?.toLowerCase().includes('anulo') ||
                      job.tenderInfo?.currentPhase?.toLowerCase().includes('cancel') ? 'cancelled' :
                      'active'
                    } />
                    {job.urgent && (
                      <Badge variant="destructive" className="text-xs">
                        Pilne
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Action buttons in top right block */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`text-muted-foreground hover:text-foreground flex-shrink-0 ${isBookmarked ? 'text-primary' : ''}`}
                  onClick={handleBookmarkClick}
                >
                  <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                <span className="font-medium">{job.company}</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {typeof job.location === 'string' 
                      ? job.location 
                      : (job.location && typeof job.location === 'object' && 'city' in job.location)
                        ? (job.location.sublocality_level_1
                            ? `${job.location.city || 'Unknown'}, ${job.location.sublocality_level_1}`
                            : job.location.city || 'Unknown')
                        : 'Unknown'}
                  </span>
                </div>
                <Badge variant="outline" className="w-fit">
                  {typeof job.category === 'string' ? job.category : job.category?.name || job.type}
                </Badge>
              </div>
              
              <p className="text-gray-700 text-xs sm:text-sm mb-3 md:mb-0 line-clamp-2">
                {job.description}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm sm:justify-between">
                <div className='flex flex-wrap gap-3 sm:gap-4'>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-medium">💰</span>
                    <span>Wartość: {job.salary}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span>{job.applications ?? job.metrics?.applications ?? 0} ofert</span>
                  </div>
                  
                  {isTender && job.tenderInfo?.submissionDeadline && (
                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>
                        Termin: {new Date(job.tenderInfo.submissionDeadline).toLocaleDateString('pl-PL')}
                        {isEndingSoon && deadlineDaysRemaining !== null && (
                          <span className="text-orange-600 ml-1">
                            ({formatDaysRemaining(deadlineDaysRemaining)} do końca)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                {!isManager && (
                  <Button 
                    onClick={handleApplyClick}
                    className="w-full sm:w-auto"
                  >
                    Złóż ofertę
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  // Updated job card design for regular jobs with action buttons
  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-shadow w-full max-w-full ${
        isExpired ? 'bg-gray-50 opacity-60' : 'bg-white'
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="flex-1 min-w-0">
            {/* Badges and bookmarks/visited on same level on mobile, separate on desktop */}
            <div className="flex items-center justify-between gap-1.5 md:gap-2 flex-wrap mb-2 md:mb-0 md:hidden">
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                {isExpired && (
                  <Badge variant="secondary" className="text-xs">
                    Wygasłe
                  </Badge>
                )}
                {job.urgent && (
                  <Badge variant="destructive" className="text-xs">
                    Pilne
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {(job.applications !== undefined || job.metrics?.applications !== undefined) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-default">
                          <Users className="w-3.5 h-3.5" />
                          <span>{job.applications ?? job.metrics?.applications ?? 0} ofert</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ofert</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {(job.visits_count !== undefined || job.bookmarks_count !== undefined) && (
                    <>
                      {job.visits_count !== undefined && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-default">
                              <Eye className="w-3.5 h-3.5" />
                              <span>{job.visits_count}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Odwiedzone</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {job.bookmarks_count !== undefined && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-default">
                              <BookmarkIcon className="w-3.5 h-3.5" />
                              <span>{job.bookmarks_count}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Zapisane</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`text-muted-foreground hover:text-foreground ${isBookmarked ? 'text-primary' : ''}`}
                  onClick={handleBookmarkClick}
                >
                  <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
            
            <div className="flex items-start md:items-center justify-between mb-2 gap-2">
              <div className="flex items-start md:items-center gap-2 md:gap-3 flex-wrap min-w-0 flex-1">
                <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                  <Wrench className="w-4 h-4 text-primary flex-shrink-0" />
                  <h3 className={`font-semibold text-base md:text-lg truncate ${isExpired ? 'text-gray-500' : ''}`}>{job.title}</h3>
                </div>
                <div className="hidden md:flex items-center gap-1.5 md:gap-2 flex-wrap">
                  {isExpired && (
                    <Badge variant="secondary" className="text-xs">
                      Wygasłe
                    </Badge>
                  )}
                  {job.urgent && (
                    <Badge variant="destructive" className="text-xs">
                      Pilne
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Action buttons in top right block - desktop only */}
              <div className="hidden md:flex gap-1.5 md:gap-2 flex-shrink-0">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {(job.applications !== undefined || job.metrics?.applications !== undefined) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-default">
                          <Users className="w-3.5 h-3.5" />
                          <span>{job.applications ?? job.metrics?.applications ?? 0} ofert</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ofert</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {(job.visits_count !== undefined || job.bookmarks_count !== undefined) && (
                    <>
                      {job.visits_count !== undefined && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-default">
                              <Eye className="w-3.5 h-3.5" />
                              <span>{job.visits_count}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Odwiedzone</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {job.bookmarks_count !== undefined && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-default">
                              <BookmarkIcon className="w-3.5 h-3.5" />
                              <span>{job.bookmarks_count}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Zapisane</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`text-muted-foreground hover:text-foreground ${isBookmarked ? 'text-primary' : ''}`}
                  onClick={handleBookmarkClick}
                >
                  <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button> 
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 text-xs text-gray-600 mb-3">
              <div className='flex items-center gap-2 sm:gap-4 min-w-0'>
                <div className="flex items-center gap-1 min-w-0">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {typeof job.location === 'string' 
                      ? job.location 
                      : (job.location && typeof job.location === 'object' && 'city' in job.location)
                        ? (job.location.sublocality_level_1
                            ? `${job.location.city || 'Unknown'}, ${job.location.sublocality_level_1}`
                            : job.location.city || 'Unknown')
                        : 'Unknown'}
                  </span>
                </div>
                <span className="hidden sm:inline h-4 border-gray-300 border-r-2 flex-shrink-0" />
                <span className="font-normal text-gray-500 truncate">{job.company}</span>
              </div>
              <Badge variant="secondary" className="w-fit">
                {typeof job.category === 'string' ? job.category : job.category?.name || job.type}
              </Badge>
            </div>
            
            <p className="text-gray-700 text-xs sm:text-sm mb-3 md:mb-0 line-clamp-2">
              {job.description}
            </p>

            <div className='flex flex-col md:flex-row md:justify-between gap-4 md:gap-6'>
              <div className="space-y-3 mt-0 md:mt-4 flex-1">
                {/* Skills/Tags */}
                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills.length > 3 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs cursor-help">
                            +{job.skills.length - 3} więcej
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className='bg-white rounded-sm'>
                            <div className="flex flex-wrap gap-1">
                              {job.skills.slice(3).map((skill, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )}

                {/* Job details */}
                <div className="flex flex-wrap items-start sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 mt-2 sm:mt-4">
                    <span className="text-green-600 font-medium">💰</span>
                    <span>Stawka: <span className="text-green-600">{job.salary}</span></span>
                  </div>
                  
                  <div className="flex items-start sm:items-center gap-4 text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Opublikowano: {job.postedTime}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      {formattedDeadline && (
                        <>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>Termin: {formattedDeadline}</span>
                          </div>
                          {deadlineDaysRemaining !== null && (
                            <span className={`pl-5 sm:pl-0 sm:ml-1 ${isEndingSoon ? 'text-orange-600 font-semibold bg-orange-50 px-1.5 py-0.5 rounded' : 'text-gray-500'}`}>
                              ({formatDaysRemaining(deadlineDaysRemaining)} do końca)
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {job.distance && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <span className="text-xs">
                        {job.distance < 1 ? `${Math.round(job.distance * 1000)}m` : `${job.distance.toFixed(1)}km`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Apply button at bottom */}
              {!isManager && (
                <div className="flex md:flex-wrap md:content-end">
                  <Button
                    className="bg-blue-800 hover:bg-blue-900 text-white w-full md:w-auto"
                    onClick={handleApplyClick}
                  >
                    Złóż ofertę
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default JobCard;