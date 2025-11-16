import React, { useMemo, useCallback } from 'react';
import { MapPin, Clock, BookmarkIcon, Eye, Gavel, Wrench, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { TenderStatusBadge } from './TenderStatusBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { getDaysRemaining, formatDaysRemaining } from '../utils/tenderHelpers';
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
    applications: number;
    verified: boolean;
    urgent: boolean;
    distance?: number;
  };
  onClick?: () => void;
  onBookmark?: (jobId: string) => void;
  isBookmarked?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isHighlighted?: boolean;
  onApplyClick?: (jobId: string, jobData?: any) => void;
}

const JobCard = React.memo(function JobCard({ 
  job, 
  onClick, 
  onBookmark, 
  isBookmarked = false, 
  onMouseEnter, 
  onMouseLeave, 
  isHighlighted = false,
  onApplyClick
}: JobCardProps) {
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

  // Render tender card with new design
  const daysRemaining = useMemo(() => {
    return isTender && job.tenderInfo?.submissionDeadline 
      ? getDaysRemaining(new Date(job.tenderInfo.submissionDeadline))
      : 0;
  }, [isTender, job.tenderInfo?.submissionDeadline]);

  if (isTender) {

    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow bg-white w-full max-w-full"
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
                    <h3 className="font-semibold text-base md:text-lg truncate">{job.title}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
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
              
              <p className="text-gray-700 text-xs sm:text-sm mb-3 md:mb-4 line-clamp-2">
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
                    <span>{job.applications} ofert</span>
                  </div>
                  
                  {daysRemaining > 0 && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDaysRemaining(daysRemaining)} do końca</span>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleApplyClick}
                  className="w-full sm:w-auto"
                >
                  Złóż ofertę
                </Button>
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
      className="cursor-pointer hover:shadow-lg transition-shadow bg-white w-full max-w-full"
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
                  <Wrench className="w-4 h-4 text-primary flex-shrink-0" />
                  <h3 className="font-semibold text-base md:text-lg truncate">{job.title}</h3>
                </div>
                {job.urgent && (
                  <Badge variant="destructive" className="text-xs">
                    Pilne
                  </Badge>
                )}
              </div>
              
              {/* Action buttons in top right block */}
              <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
                {(job.visits_count !== undefined || job.bookmarks_count !== undefined) && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
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
                  </div>
                )}
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
              <div className='flex flex-wrap gap-2 sm:gap-4 items-center'>
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
                <span className="hidden sm:inline h-4 border-gray-300 border-r-2" />
                <span className="font-normal text-gray-500">{job.company}</span>
              </div>
              <Badge variant="secondary" className="w-fit">
                {typeof job.category === 'string' ? job.category : job.category?.name || job.type}
              </Badge>
            </div>
            
            <p className="text-gray-700 text-xs sm:text-sm mb-3 md:mb-4 line-clamp-2">
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
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-medium">💰</span>
                    <span>Stawka: {job.salary}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span>{job.applications} ofert</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>{job.postedTime}</span>
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
              <div className="flex md:flex-wrap md:content-end">
                <Button
                  className="bg-blue-800 hover:bg-blue-900 text-white w-full md:w-auto"
                  onClick={handleApplyClick}
                >
                  Złóż ofertę
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default JobCard;