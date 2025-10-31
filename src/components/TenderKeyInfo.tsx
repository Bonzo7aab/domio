import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Calendar, 
  DollarSign, 
  Scale, 
  AlertTriangle,
  CheckCircle,
  Timer,
  Building2,
  Info,
  Award
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface TenderKeyInfoProps {
  tender: {
    title: string;
    company: string;
    tenderInfo?: {
      tenderType: string;
      currentPhase: string;
      submissionDeadline: string;
      wadium: string;
      evaluationCriteria: { name: string; weight: number }[];
      projectDuration: string;
    };
    budget: string;
    buildingType: string;
    surface: string;
    contactPerson: string;
  };
}

const TenderKeyInfo: React.FC<TenderKeyInfoProps> = ({ tender }) => {
  const { tenderInfo } = tender;
  
  if (!tenderInfo) return null;

  // Obliczenie dni do deadline
  const deadline = new Date(tenderInfo.submissionDeadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const getDeadlineStatus = () => {
    if (daysLeft < 0) return { status: 'Zamknięty', color: 'destructive', icon: AlertTriangle };
    if (daysLeft <= 3) return { status: 'Zamyka się wkrótce', color: 'warning', icon: Timer };
    return { status: 'Otwarty', color: 'success', icon: CheckCircle };
  };
  
  const deadlineStatus = getDeadlineStatus();
  const StatusIcon = deadlineStatus.icon;

  return (
    <Card className="mb-6 border-warning bg-warning/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-warning">
            <Scale className="h-5 w-5" />
            Kluczowe informacje przetargu
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`border-${deadlineStatus.color} text-${deadlineStatus.color} bg-${deadlineStatus.color}/10`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {deadlineStatus.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Podstawowe dane */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Zamawiający
            </div>
            <div className="font-semibold">{tender.company}</div>
            <div className="text-sm text-muted-foreground">{tender.contactPerson}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Budżet projektu
            </div>
            <div className="font-semibold text-success">{tender.budget}</div>
            <div className="text-sm text-muted-foreground">Szacowana wartość</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Termin składania ofert
            </div>
            <div className="font-semibold text-warning">
              {deadline.toLocaleDateString('pl-PL', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="text-sm text-muted-foreground">
              {daysLeft > 0 ? `${daysLeft} dni pozostało` : 'Termin minął'}
            </div>
          </div>
        </div>

        <Separator />

        {/* Szczegóły przetargu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Typ przetargu:</span>
              <div className="font-semibold">{tenderInfo.tenderType}</div>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Aktualna faza:</span>
              <Badge variant="secondary" className="ml-2">
                {tenderInfo.currentPhase}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Czas realizacji:</span>
              <div className="font-semibold">{tenderInfo.projectDuration}</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Wadium:</span>
              <div className="font-semibold text-warning">{tenderInfo.wadium}</div>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Zakres:</span>
              <div className="font-semibold">{tender.surface}</div>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Typ budynku:</span>
              <div className="text-sm">{tender.buildingType}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Kryteria oceny */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4" />
            <span className="text-sm font-medium text-muted-foreground">
              Kryteria oceny ofert:
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {tenderInfo.evaluationCriteria.map((criterion, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-background rounded border">
                <span className="text-xs font-medium">{criterion.name}</span>
                <Badge variant="outline" className="text-xs">
                  {criterion.weight}%
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Dodatkowa informacja */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Szczegółowe informacje o wymaganiach, procedurze składania ofert i regulaminie 
            przetargu znajdziesz w odpowiednich zakładkach poniżej.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default TenderKeyInfo;