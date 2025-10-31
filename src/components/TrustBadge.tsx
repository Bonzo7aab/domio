import React from 'react';
import { Shield, Award, CheckCircle, Crown, Star, Clock } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TrustBadgeProps {
  type: 'verified' | 'premium' | 'insurance' | 'certificates' | 'rating' | 'experience';
  value?: string | number;
  tooltip?: string;
  className?: string;
}

export default function TrustBadge({ type, value, tooltip, className = "" }: TrustBadgeProps) {
  const getBadgeContent = () => {
    switch (type) {
      case 'verified':
        return (
          <Badge variant="secondary" className={`text-xs flex items-center gap-1 ${className}`}>
            <Shield className="w-3 h-3" />
            Zweryfikowane
          </Badge>
        );
      
      case 'premium':
        return (
          <Badge className={`text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white flex items-center gap-1 ${className}`}>
            <Crown className="w-3 h-3" />
            Premium
          </Badge>
        );
      
      case 'insurance':
        return (
          <div className={`flex items-center space-x-1 text-green-600 text-xs ${className}`}>
            <CheckCircle className="w-3 h-3" />
            <span>Ubezpieczenie OC</span>
          </div>
        );
      
      case 'certificates':
        return (
          <div className={`flex items-center space-x-1 text-blue-600 text-xs ${className}`}>
            <Award className="w-3 h-3" />
            <span>Certyfikaty</span>
          </div>
        );
      
      case 'rating':
        return (
          <div className={`flex items-center space-x-1 text-xs ${className}`}>
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{value}</span>
          </div>
        );
      
      case 'experience':
        return (
          <div className={`flex items-center space-x-1 text-gray-600 text-xs ${className}`}>
            <Clock className="w-3 h-3" />
            <span>{value} zleceń</span>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              {getBadgeContent()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <>{getBadgeContent()}</>;
}