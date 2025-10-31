import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  ScrollText, 
  FileText, 
  Users, 
  Scale, 
  AlertCircle, 
  CheckCircle, 
  Shield,
  FileCheck,
  Clock,
  Award,
  X,
  Info,
  AlertTriangle
} from 'lucide-react';

interface TenderRegulationsProps {
  tender: {
    title: string;
    description: string;
    requirements: string[];
    tenderInfo?: {
      tenderType: string;
      evaluationCriteria: { name: string; weight: number }[];
      documentsRequired: string[];
      submissionDeadline: string;
      projectDuration: string;
      wadium: string;
    };
    contractDetails?: {
      contractType: string;
      paymentTerms: string;
      warrantyPeriod: string;
      terminationConditions: string;
    };
  };
}

const TenderRegulations: React.FC<TenderRegulationsProps> = ({ tender }) => {
  const { tenderInfo, contractDetails } = tender;
  
  if (!tenderInfo) return null;

  return (
    <div className="space-y-6">
      {/* Przedmiot zamówienia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Przedmiot zamówienia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Szczegółowy opis zakresu prac</h4>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {tender.description}
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Czas realizacji</h4>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{tenderInfo.projectDuration}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wymagania wobec wykonawców */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Wymagania wobec wykonawców
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Wykonawca musi spełnić wszystkie poniższe wymagania aby móc złożyć ofertę w przetargu.
            </AlertDescription>
          </Alert>

          <div>
            <h4 className="font-semibold mb-3">Wymagania kwalifikacyjne:</h4>
            <ul className="space-y-2">
              {tender.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3">Dokumenty wymagane do złożenia oferty:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {tenderInfo.documentsRequired.map((document, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <FileCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{document}</span>
                </div>
              ))}
            </div>
          </div>

          {tenderInfo.wadium !== "Brak" && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Wadium przetargowe
                </h4>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Wymagane wadium: {tenderInfo.wadium}</strong><br/>
                    Wadium musi zostać wniesione przed złożeniem oferty. W przypadku nieuczestniczenia 
                    w przetargu lub wycofania oferty, wadium zostanie zwrócone w terminie 14 dni.
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Procedura składania ofert */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Procedura składania ofert
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Termin składania ofert:</h4>
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="font-semibold text-warning">
                  {new Date(tenderInfo.submissionDeadline).toLocaleDateString('pl-PL', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  Oferty złożone po tym terminie nie będą rozpatrywane
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Typ przetargu:</h4>
              <Badge variant="outline" className="text-sm">
                {tenderInfo.tenderType}
              </Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Forma składania oferty:</h4>
            <ul className="space-y-1 text-sm">
              <li>• Oferta musi być złożona elektronicznie przez platformę Urbi.eu</li>
              <li>• Wszystkie wymagane dokumenty w formacie PDF</li>
              <li>• Oferta musi być podpisana kwalifikowanym podpisem elektronicznym</li>
              <li>• Maksymalny rozmiar załączników: 50MB</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Kryteria oceny ofert */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Kryteria oceny ofert
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Komisja przetargowa oceni oferty według poniższych kryteriów. Suma wszystkich wag wynosi 100%.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {tenderInfo.evaluationCriteria.map((criterion, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{criterion.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {criterion.name === 'Cena' && 'Najniższa cena otrzymuje maksymalną liczbę punktów'}
                    {criterion.name.includes('Doświadczenie') && 'Ocena na podstawie referencji i portfolio'}
                    {criterion.name.includes('Termin') && 'Krótszy termin realizacji = więcej punktów'}
                    {criterion.name.includes('Jakość') && 'Ocena rozwiązań technicznych i materiałów'}
                  </div>
                </div>
                <Badge variant="secondary" className="font-semibold">
                  {criterion.weight}%
                </Badge>
              </div>
            ))}
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Sposób oceny:</strong> Każde kryterium będzie oceniane w skali 0-100 punktów. 
              Końcowa ocena to suma ważona wszystkich kryteriów. Najwyższa ocena wygrywa przetarg.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Warunki prawne */}
      {contractDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Warunki umowy i płatności
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Typ umowy:</h4>
                <p className="text-sm">{contractDetails.contractType}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Warunki płatności:</h4>
                <p className="text-sm">{contractDetails.paymentTerms}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Gwarancja:</h4>
                <p className="text-sm">{contractDetails.warrantyPeriod}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Warunki odstąpienia:</h4>
                <p className="text-sm">{contractDetails.terminationConditions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informacje o unieważnieniu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <X className="h-5 w-5" />
            Warunki unieważnienia przetargu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Zamawiający zastrzega sobie prawo do unieważnienia przetargu w przypadku:</strong>
            </AlertDescription>
          </Alert>
          <ul className="mt-3 space-y-1 text-sm">
            <li>• Braku ofert lub złożenia ofert niespełniających wymagań formalnych</li>
            <li>• Wszystkie złożone oferty przekraczają dostępny budżet</li>
            <li>• Wystąpienia okoliczności niemożliwych do przewidzenia przy ogłaszaniu przetargu</li>
            <li>• Zmiany przepisów prawnych uniemożliwiających realizację zamówienia</li>
            <li>• Gdy unieważnienie leży w interesie zamawiającego</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenderRegulations;