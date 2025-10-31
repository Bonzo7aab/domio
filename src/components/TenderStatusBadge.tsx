import React from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Clock, 
  Play, 
  Eye, 
  Trophy, 
  X, 
  Users,
  Calendar,
  DollarSign,
  FileText,
  Award
} from 'lucide-react';
import { TenderStatus } from '../types';

export interface TenderStatusInfo {
  status: TenderStatus;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  nextAction?: string;
}

interface TenderStatusBadgeProps {
  status: TenderStatus;
  className?: string;
}

interface TenderStatusCardProps {
  status: TenderStatus;
  bidCount?: number;
  daysRemaining?: number;
  estimatedValue?: string;
  nextDeadline?: Date;
  className?: string;
}

const tenderStatusConfig: Record<TenderStatus, TenderStatusInfo> = {
  draft: {
    status: 'draft',
    label: 'Wersja robocza',
    description: 'Przetarg jest w przygotowaniu i nie został jeszcze opublikowany',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: <FileText className="h-4 w-4" />,
    nextAction: 'Opublikuj przetarg'
  },
  active: {
    status: 'active',
    label: 'Aktywny',
    description: 'Przetarg jest otwarty na składanie ofert',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: <Play className="h-4 w-4" />,
    nextAction: 'Składaj oferty'
  },
  evaluation: {
    status: 'evaluation',
    label: 'Ocena ofert',
    description: 'Trwa proces oceny złożonych ofert',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: <Eye className="h-4 w-4" />,
    nextAction: 'Oceń oferty'
  },
  awarded: {
    status: 'awarded',
    label: 'Rozstrzygnięty',
    description: 'Przetarg został rozstrzygnięty i wybrano wykonawcę',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: <Trophy className="h-4 w-4" />,
    nextAction: 'Zobacz wyniki'
  },
  cancelled: {
    status: 'cancelled',
    label: 'Anulowany',
    description: 'Przetarg został anulowany',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: <X className="h-4 w-4" />,
    nextAction: null
  }
};

export const TenderStatusBadge: React.FC<TenderStatusBadgeProps> = ({ 
  status, 
  className 
}) => {
  const config = tenderStatusConfig[status] || tenderStatusConfig.active;
  
  if (!config) {
    console.warn(`Unknown tender status: ${status}, falling back to 'active'`);
  }
  
  return (
    <Badge 
      className={`${config.bgColor} ${config.color} border-0 ${className}`}
    >
      <span className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </span>
    </Badge>
  );
};

export const TenderStatusCard: React.FC<TenderStatusCardProps> = ({
  status,
  bidCount = 0,
  daysRemaining,
  estimatedValue,
  nextDeadline,
  className
}) => {
  const config = tenderStatusConfig[status] || tenderStatusConfig.active;
  
  if (!config) {
    console.warn(`Unknown tender status: ${status}, falling back to 'active'`);
  }

  const formatDeadline = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {config.icon}
            <span className="text-base">{config.label}</span>
          </div>
          <TenderStatusBadge status={status} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">{config.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          {status === 'active' && (
            <>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span>Oferty: {bidCount}</span>
              </div>
              {daysRemaining !== undefined && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{daysRemaining} dni do końca</span>
                </div>
              )}
            </>
          )}
          
          {status === 'evaluation' && (
            <>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span>Oferty: {bidCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>W ocenie</span>
              </div>
            </>
          )}
          
          {status === 'awarded' && (
            <>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gray-500" />
                <span>Wygrany</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span>{bidCount} ofert</span>
              </div>
            </>
          )}

          {estimatedValue && (
            <div className="flex items-center gap-2 col-span-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span>Wartość: {estimatedValue}</span>
            </div>
          )}
        </div>

        {nextDeadline && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">
                Termin: {formatDeadline(nextDeadline)}
              </span>
            </div>
          </div>
        )}

        {config.nextAction && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500">
              Następna akcja: {config.nextAction}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to get status info
export const getTenderStatusInfo = (status: TenderStatus): TenderStatusInfo => {
  return tenderStatusConfig[status];
};

// Helper function to determine if bids can be submitted
export const canSubmitBid = (status: TenderStatus): boolean => {
  return status === 'active';
};

// Helper function to determine if tender can be evaluated
export const canEvaluate = (status: TenderStatus): boolean => {
  return status === 'evaluation';
};

// Helper function to check if tender is completed
export const isTenderCompleted = (status: TenderStatus): boolean => {
  return status === 'awarded' || status === 'cancelled';
};

export default TenderStatusBadge;