import React, { useState } from 'react';
import { ArrowLeft, Upload, FileText, Shield, Check, AlertTriangle, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useUserProfile } from '../contexts/AuthContext';

interface VerificationPageProps {
  onBack: () => void;
}

interface DocumentUpload {
  type: string;
  file: File | null;
  description: string;
  required: boolean;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({ onBack }) => {
  const { user } = useUserProfile();
  const [uploads, setUploads] = useState<Record<string, DocumentUpload>>({});
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isContractor = user?.userType === 'contractor';

  const contractorDocuments = [
    { 
      type: 'company_registration', 
      name: 'Wypis z KRS/CEIDG', 
      description: 'Aktualny wypis potwierdzający rejestrację firmy',
      required: true 
    },
    { 
      type: 'insurance', 
      name: 'Ubezpieczenie OC', 
      description: 'Polisa ubezpieczenia odpowiedzialności cywilnej (ważna minimum 6 miesięcy)',
      required: true 
    },
    { 
      type: 'certifications', 
      name: 'Certyfikaty zawodowe', 
      description: 'Skany certyfikatów i uprawnień zawodowych',
      required: false 
    },
    { 
      type: 'references', 
      name: 'Referencje', 
      description: 'Opinie z poprzednich projektów, rekomendacje klientów',
      required: false 
    }
  ];

  const managerDocuments = [
    { 
      type: 'company_registration', 
      name: 'Wypis z KRS/CEIDG', 
      description: 'Aktualny wypis potwierdzający rejestrację firmy zarządzającej',
      required: true 
    },
    { 
      type: 'management_license', 
      name: 'Licencja zarządcy', 
      description: 'Certyfikat lub licencja zarządcy nieruchomości',
      required: false 
    },
    { 
      type: 'management_contracts', 
      name: 'Umowy zarządzania', 
      description: 'Przykłady umów zarządzania nieruchomościami (dane osobowe zamazane)',
      required: false 
    },
    { 
      type: 'insurance', 
      name: 'Ubezpieczenie OC zarządcy', 
      description: 'Polisa ubezpieczenia odpowiedzialności cywilnej zarządcy',
      required: true 
    }
  ];

  const documents = isContractor ? contractorDocuments : managerDocuments;

  const handleFileChange = (documentType: string, file: File | null) => {
    setUploads(prev => ({
      ...prev,
      [documentType]: {
        ...prev[documentType],
        file,
        type: documentType
      }
    }));
  };

  const handleDescriptionChange = (documentType: string, description: string) => {
    setUploads(prev => ({
      ...prev,
      [documentType]: {
        ...prev[documentType],
        description,
        type: documentType
      }
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 2000));

    setSubmitted(true);
    setIsSubmitting(false);
  };

  const requiredDocumentsUploaded = documents
    .filter(doc => doc.required)
    .every(doc => uploads[doc.type]?.file);

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-success text-success-foreground rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-success">Dokumenty przesłane!</h2>
            <p className="text-lg text-muted-foreground">
              Dziękujemy za przesłanie dokumentów weryfikacyjnych
            </p>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Co dalej?</strong>
              <br />
              • Sprawdzimy przesłane dokumenty w ciągu 1-3 dni roboczych
              <br />
              • Otrzymasz powiadomienie email o wyniku weryfikacji
              <br />
              • W przypadku pytań skontaktujemy się z Tobą
              <br />
              • Zweryfikowane konto otrzyma oznaczenie w profilu
            </AlertDescription>
          </Alert>

          <Button onClick={onBack} className="mt-6">
            Powrót do konta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót
            </Button>
            <div>
              <h1>Weryfikacja konta</h1>
              <p className="text-sm text-muted-foreground">
                Prześlij dokumenty aby zweryfikować swoje konto
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Info Header */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <Shield className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-primary mb-2">
                    Weryfikacja konta {isContractor ? 'wykonawcy' : 'zarządcy'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Zweryfikowane konto otrzymuje więcej {isContractor ? 'zleceń' : 'ofert'} i 
                    wyższą pozycję w wynikach wyszukiwania. Proces weryfikacji jest bezpłatny i dobrowolny.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-success" />
                        <span>Bezpłatna weryfikacja</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-success" />
                        <span>Pełna ochrona danych</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-success" />
                        <span>Weryfikacja w 1-3 dni</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-success" />
                        <span>Oznaczenie "Zweryfikowany"</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RODO Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Informacja o przetwarzaniu danych osobowych (RODO):</strong>
              <br />
              Przesłane dokumenty przetwarzamy wyłącznie w celu weryfikacji kwalifikacji i budowania zaufania na platformie. 
              Podstawą prawną jest uzasadniony interes (art. 6 ust. 1 lit. f RODO). Dokumenty przechowujemy bezpiecznie, 
              a dostęp mają tylko upoważnieni pracownicy. Po zakończeniu weryfikacji dokumenty są automatycznie usuwane.
            </AlertDescription>
          </Alert>

          {/* Documents Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dokumenty do przesłania</h3>
            
            {documents.map((doc) => (
              <Card key={doc.type}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>{doc.name}</span>
                        {doc.required && (
                          <span className="text-destructive text-sm">*</span>
                        )}
                      </CardTitle>
                      <CardDescription>{doc.description}</CardDescription>
                    </div>
                    {doc.required ? (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                        Wymagany
                      </span>
                    ) : (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        Opcjonalny
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`file-${doc.type}`}>Plik dokumentu</Label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        id={`file-${doc.type}`}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(doc.type, e.target.files?.[0] || null)}
                        className="flex-1 text-sm text-muted-foreground
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:bg-primary file:text-primary-foreground
                          file:hover:bg-primary/90
                          file:cursor-pointer cursor-pointer"
                      />
                      {uploads[doc.type]?.file && (
                        <div className="flex items-center space-x-2 text-success">
                          <Check className="h-4 w-4" />
                          <span className="text-sm">Przesłano</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Akceptowane formaty: PDF, JPG, PNG (maks. 10MB)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`desc-${doc.type}`}>Dodatkowe informacje (opcjonalnie)</Label>
                    <Textarea
                      id={`desc-${doc.type}`}
                      placeholder="Dodaj komentarz do dokumentu..."
                      value={uploads[doc.type]?.description || ''}
                      onChange={(e) => handleDescriptionChange(doc.type, e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Dodatkowe informacje</CardTitle>
              <CardDescription>
                Możesz dodać dodatkowe informacje które pomogą w procesie weryfikacji
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Opisz dodatkowe kwalifikacje, doświadczenie lub inne informacje które mogą być istotne dla weryfikacji..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Warnings */}
          <Alert variant="destructive" className="bg-red-50 border-red-200 border-2">
            <div className="flex gap-3 w-max">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <AlertDescription className="text-red-900">
                <strong className="text-base block mb-2">Ważne informacje:</strong>
                <ul className="space-y-1.5 text-sm">
                  <li>• Dokumenty muszą być aktualne (nie starsze niż 6 miesięcy)</li>
                  <li>• Wszystkie dane muszą być czytelne</li>
                  <li>• W przypadku dokumentów w językach obcych dołącz tłumaczenie</li>
                  <li className="font-semibold pt-1">• Przesłanie fałszywych dokumentów skutkuje trwałym zablokowaniem konta</li>
                </ul>
              </AlertDescription>
            </div>
          </Alert>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onBack}>
              Anuluj
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!requiredDocumentsUploaded || isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Przesyłanie...</span>
                </div>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Prześlij dokumenty
                </>
              )}
            </Button>
          </div>

          {!requiredDocumentsUploaded && (
            <Alert>
              <AlertDescription>
                Aby przesłać dokumenty, musisz załączyć wszystkie wymagane pliki oznaczone gwiazdką (*).
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};