import React, { useMemo, useCallback } from 'react';
import { MapPin, Clock, BookmarkIcon, Eye, Gavel, Wrench, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { TenderStatusBadge } from './TenderStatusBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    postType?: string; // 'job' | 'tender'
    salary: string;
    description: string;
    skills?: string[];
    postedTime: string;
    applications: number;
    rating: number;
    verified: boolean;
    urgent: boolean;
    companyLogo?: string;
    clientType?: string;
    category?: string;
    subcategory?: string;
    isPremium?: boolean;
    premium?: boolean;
    hasInsurance?: boolean;
    completedJobs?: number;
    certificates?: string[];
    distance?: number;
    tenderInfo?: {
      tenderType: string;
      phases: string[];
      currentPhase: string;
      wadium: string;
      evaluationCriteria: { name: string; weight: number }[];
      documentsRequired: string[];
      submissionDeadline: string;
      projectDuration: string;
    };
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
  
  // Helper function to get days remaining for tenders
  const getDaysRemaining = useCallback((deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, []);

  // Render tender card with new design
  const daysRemaining = useMemo(() => {
    return isTender && job.tenderInfo?.submissionDeadline 
      ? getDaysRemaining(job.tenderInfo.submissionDeadline)
      : 0;
  }, [isTender, job.tenderInfo?.submissionDeadline, getDaysRemaining]);

  if (isTender) {

    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow bg-white"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-warning" />
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                  </div>
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
                
                {/* Action buttons in top right block */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`text-muted-foreground hover:text-foreground ${isBookmarked ? 'text-primary' : ''}`}
                    onClick={handleBookmarkClick}
                  >
                    <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  </Button>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span className="font-medium">{job.company}</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
                <Badge variant="outline">{job.category || job.type}</Badge>
              </div>
              
              <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                {job.description}
              </p>

              <div className="flex items-center gap-6 text-sm justify-between">
                <div className='flex gap-4'>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-medium">💰</span>
                  <span>Wartość: {job.salary}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{job.applications} ofert</span>
                </div>
                
                {daysRemaining > 0 && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Clock className="h-4 w-4" />
                    <span>{daysRemaining} {daysRemaining === 1 ? 'dzień' : 'dni'} do końca</span>
                  </div>
                )}
                </div>
                <Button 
                    onClick={handleApplyClick}
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
      className="cursor-pointer hover:shadow-lg transition-shadow bg-white"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                </div>
                {job.urgent && (
                  <Badge variant="destructive" className="text-xs">
                    Pilne
                  </Badge>
                )}
                
              </div>
              
              {/* Action buttons in top right block */}
              <div className="flex gap-2">
                {job.rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-xs">{job.rating.toFixed(1)}</span>
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
            
            <div className="flex justify-between items-center gap-4 text-xs text-gray-600 mb-3">
              <div className='flex gap-4 items-center'>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
                <span className="h-4 border-gray-300 border-r-2" />
                <span className="font-normal text-gray-500">{job.company}</span>
              </div>
              <Badge variant="secondary">{job.category || job.type}</Badge>
            </div>
            
            <p className="text-gray-700 text-sm mb-4 line-clamp-2">
              {job.description}
            </p>



            <div className='flex justify-between'>
              <div className="space-y-3 mt-4">
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
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-medium">💰</span>
                    <span>Stawka: {job.salary}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{job.applications} ofert</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="h-4 w-4" />
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
              <div className="flex flex-wrap content-end">
                <Button
                  className="bg-blue-800 hover:bg-blue-900 text-white"
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