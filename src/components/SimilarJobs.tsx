import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Clock, DollarSign, Building } from 'lucide-react';
import { getStoredJobs } from '../utils/jobStorage';
// Removed mock import - now using database data via props

interface SimilarJobsProps {
  currentJobId: string;
  currentJobCategory: string;
  currentJobType: 'job' | 'tender';
  onJobSelect: (jobId: string) => void;
}

interface SimilarJob {
  id: string;
  title: string;
  company: string;
  location: string;
  budget: string;
  postedTime: string;
  postType: 'job' | 'tender';
  category: string;
}

const SimilarJobs: React.FC<SimilarJobsProps> = ({
  currentJobId,
  currentJobCategory, 
  currentJobType,
  onJobSelect
}) => {
  
  // Get similar jobs from localStorage and mock data
  const getSimilarJobs = (): SimilarJob[] => {
    const storedJobs = getStoredJobs();
    
    // Use only stored jobs (which come from database)
    const allJobs = storedJobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      budget: job.budget || job.salary,
      postedTime: job.postedTime,
      postType: job.postType || 'job' as 'job' | 'tender',
      category: job.category
    }));

    // Filter similar jobs
    return allJobs
      .filter(job => 
        job.id !== currentJobId && // Exclude current job
        job.postType === currentJobType && // Same type (job/tender)
        job.category === currentJobCategory // Same category
      )
      .slice(0, 3); // Limit to 3 similar jobs
  };

  const similarJobs = getSimilarJobs();

  if (similarJobs.length === 0) {
    return null; // Don't show widget if no similar jobs
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Podobne {currentJobType === 'tender' ? 'przetargi' : 'zlecenia'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {similarJobs.map((job) => (
          <div 
            key={job.id}
            className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onJobSelect(job.id)}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-sm line-clamp-2 flex-1 mr-2">
                  {job.title}
                </h4>
                {job.postType === 'tender' && (
                  <Badge variant="secondary" className="text-xs">
                    Przetarg
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building className="w-3 h-3" />
                  <span className="truncate">{job.company}</span>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{job.location}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{job.postedTime}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-green-600 font-medium">
                    <DollarSign className="w-3 h-3" />
                    <span>{job.budget}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <Button variant="outline" className="w-full text-xs" size="sm">
          Zobacz więcej podobnych {currentJobType === 'tender' ? 'przetargów' : 'zleceń'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SimilarJobs;