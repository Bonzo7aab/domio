import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Clock, Euro, Star, Share, Heart, Phone, Mail, Calendar, Users, Camera, FileText, Bookmark, HelpCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { AskQuestionModal } from '../AskQuestionModal';
import { addBookmark, removeBookmark, isJobBookmarked } from '../../utils/bookmarkStorage';
import { toast } from 'sonner';

// Mock job data
const mockJobDetails = {
  id: '1',
  title: 'Remont łazienki w bloku z lat 80-tych',
  category: 'Remonty mieszkań',
  budget: '15000-25000',
  location: 'Warszawa, Mokotów',
  fullAddress: 'ul. Puławska 123, 02-595 Warszawa',
  distance: 2.3,
  postedTime: '2 godz. temu',
  deadline: '15 marca 2024',
  company: 'WSM Mokotów',
  companyLogo: '',
  urgent: true,
  applicants: 12,
  rating: 4.8,
  reviewsCount: 47,
  description: `Poszukujemy doświadczonego wykonawcy do kompleksowego remontu łazienki w mieszkaniu komunalnym. 

Zakres prac:
• Demontaż starej instalacji
• Wymiana instalacji wodno-kanalizacyjnej
 Wymiana instalacji elektrycznej
• Ułożenie glazury i terakoty
• Montaż sanitariów
• Malowanie sufitu

Powierzchnia łazienki: około 6 m²
Budynek z lat 80-tych, 4 piętro, winda.`,
  requirements: [
    'Doświadczenie min. 5 lat w remontach łazienek',
    'Własne narzędzia i transport',
    'Ubezpieczenie OC',
    'Referencje z podobnych prac',
    'Znajomość przepisów budowlanych'
  ],
  tags: ['Hydraulika', 'Glazura', 'Elektryka', 'Remonty', 'Sanitariaty'],
  images: [
    '/api/placeholder/400/300',
    '/api/placeholder/400/300',
    '/api/placeholder/400/300'
  ],
  documents: [
    { name: 'Projekt_lazienka.pdf', size: '2.1 MB' },
    { name: 'Specyfikacja_materialow.xlsx', size: '1.3 MB' }
  ],
  contactPerson: {
    name: 'Anna Kowalska',
    position: 'Zarządca nieruchomości',
    phone: '+48 123 456 789',
    email: 'a.kowalska@wsm-mokotow.pl',
    avatar: ''
  }
};

interface MobileJobDetailsProps {
  jobId: string;
  onBack: () => void;
  onApply: () => void;
}

export const MobileJobDetails: React.FC<MobileJobDetailsProps> = ({
  jobId,
  onBack,
  onApply
}) => {
  const [job] = useState(mockJobDetails);
  const [isLiked, setIsLiked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showAskQuestionModal, setShowAskQuestionModal] = useState(false);

  const formatBudget = (budget: string) => {
    const [min, max] = budget.split('-');
    return `${parseInt(min).toLocaleString()}-${parseInt(max).toLocaleString()} zł`;
  };

  const formatDistance = (distance: number) => {
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `Sprawdź to zlecenie: ${job.title}`,
          url: window.location.href,
        });
      } catch (error) {
        toast.error('Nie udało się udostępnić');
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link skopiowany do schowka');
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Usunięto z ulubionych' : 'Dodano do ulubionych');
  };

  const handleCall = () => {
    window.location.href = `tel:${job.contactPerson.phone}`;
  };

  const handleEmail = () => {
    window.location.href = `mailto:${job.contactPerson.email}`;
  };

  const handleBookmark = () => {
    if (isBookmarked) {
      removeBookmark(jobId);
      setIsBookmarked(false);
      toast.success('Usunięto z zapisanych');
    } else {
      const bookmarkData = {
        id: jobId,
        title: job.title,
        company: job.company,
        location: job.location,
        postType: 'job' as const,
        budget: job.budget,
        deadline: job.deadline
      };
      addBookmark(bookmarkData);
      setIsBookmarked(true);
      toast.success('Dodano do zapisanych');
    }
  };

  useEffect(() => {
    const bookmarked = isJobBookmarked(jobId);
    setIsBookmarked(bookmarked);
  }, [jobId]);

  return (
    <div className="mobile-job-details flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground truncate">
              Szczegóły zlecenia
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-9 w-9"
            >
              <Share className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              className="h-9 w-9"
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBookmark}
              className="h-9 w-9"
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Title and Basic Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-3">
              <div className="flex items-center gap-2 mb-2">
                {job.urgent && (
                  <Badge variant="destructive" className="text-xs">
                    Pilne
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {job.category}
                </Badge>
              </div>
              <h2 className="text-xl font-bold leading-tight mb-2">
                {job.title}
              </h2>
              <div className="flex items-center text-warning mb-2">
                <Star className="h-4 w-4 fill-current mr-1" />
                <span className="font-medium">{job.rating}</span>
                <span className="text-sm text-muted-foreground ml-1">
                  ({job.reviewsCount} opinii)
                </span>
              </div>
            </div>
          </div>

          {/* Key Info Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card>
              <CardContent className="p-3 text-center">
                <Euro className="h-5 w-5 text-success mx-auto mb-1" />
                <div className="text-sm font-medium text-success">
                  {formatBudget(job.budget)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Budżet
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 text-center">
                <MapPin className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-sm font-medium">
                  {formatDistance(job.distance)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Odległość
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 text-center">
                <Calendar className="h-5 w-5 text-warning mx-auto mb-1" />
                <div className="text-sm font-medium">
                  {job.deadline}
                </div>
                <div className="text-xs text-muted-foreground">
                  Termin
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 text-center">
                <Users className="h-5 w-5 text-info mx-auto mb-1" />
                <div className="text-sm font-medium">
                  {job.applicants}
                </div>
                <div className="text-xs text-muted-foreground">
                  Aplikacji
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Location */}
        <Card className="mx-4 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <MapPin className="h-5 w-5 mr-2" />
              Lokalizacja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{job.fullAddress}</p>
            <p className="text-sm text-muted-foreground">{job.location}</p>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="mx-4 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Opis zlecenia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-sm leading-relaxed ${!showFullDescription ? 'line-clamp-6' : ''}`}>
              {job.description.split('\n').map((line, index) => (
                <p key={index} className="mb-2">
                  {line}
                </p>
              ))}
            </div>
            {!showFullDescription && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullDescription(true)}
                className="mt-2 p-0 h-auto"
              >
                Pokaż więcej
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="mx-4 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Wymagania</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {job.requirements.map((req, index) => (
                <li key={index} className="flex items-start text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Tags */}
        <div className="px-4 mb-4">
          <div className="flex flex-wrap gap-2">
            {job.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-sm">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Images */}
        {job.images.length > 0 && (
          <Card className="mx-4 mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Camera className="h-5 w-5 mr-2" />
                Zdjęcia ({job.images.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto">
                {job.images.map((image, index) => (
                  <div key={index} className="flex-shrink-0">
                    <img
                      src={image}
                      alt={`Zdjęcie ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border cursor-pointer"
                      onClick={() => {
                        // Open image in fullscreen or modal
                        toast.info('Otwieranie galerii...');
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        {job.documents.length > 0 && (
          <Card className="mx-4 mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <FileText className="h-5 w-5 mr-2" />
                Załączniki ({job.documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {job.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-muted-foreground mr-3" />
                      <div>
                        <div className="text-sm font-medium">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">{doc.size}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Pobierz
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Person */}
        <Card className="mx-4 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Osoba kontaktowa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-3">
                  <AvatarImage src={job.contactPerson.avatar} />
                  <AvatarFallback>
                    {job.contactPerson.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{job.contactPerson.name}</div>
                  <div className="text-sm text-muted-foreground">{job.contactPerson.position}</div>
                  <div className="text-sm text-muted-foreground">{job.company}</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="icon" onClick={handleCall}>
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleEmail}>
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spacing for bottom button */}
        <div className="pb-20" />
      </div>

      {/* Bottom Action */}
      <div className="sticky bottom-0 bg-white border-t border-border p-4">
        {/* Primary Action Button */}
        <Button 
          onClick={onApply}
          className="w-full mb-3"
          size="lg"
        >
          Złóż ofertę
        </Button>
        
        {/* Secondary Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleBookmark}
            className="flex-1"
          >
            <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
            Zapisz zlecenie
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAskQuestionModal(true)}
            className="flex-1"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Zadaj pytanie
          </Button>
        </div>
        
        <div className="flex items-center justify-center mt-2 space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {job.postedTime}
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {job.applicants} aplikacji
          </div>
        </div>
      </div>

      {/* Ask Question Modal */}
      <AskQuestionModal
        isOpen={showAskQuestionModal}
        onClose={() => setShowAskQuestionModal(false)}
        jobId={jobId}
        jobTitle={job.title}
        companyName={job.company}
      />
    </div>
  );
};