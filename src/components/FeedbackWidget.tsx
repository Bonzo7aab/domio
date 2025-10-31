import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MessageSquare, Send, Star, Bug, Lightbulb, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackWidgetProps {
  currentPage?: string;
  userType?: 'contractor' | 'manager' | 'guest';
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ 
  currentPage = 'unknown', 
  userType = 'guest' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes = [
    { value: 'bug', label: 'Błąd/Problem', icon: Bug, color: 'text-destructive' },
    { value: 'feature', label: 'Sugestia funkcji', icon: Lightbulb, color: 'text-warning' },
    { value: 'usability', label: 'Problemy z użytkowaniem', icon: AlertCircle, color: 'text-info' },
    { value: 'general', label: 'Ogólna opinia', icon: MessageSquare, color: 'text-muted-foreground' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const feedbackData = {
      type: feedbackType,
      rating: rating,
      email: email,
      subject: subject,
      message: message,
      page: currentPage,
      userType: userType,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('Feedback submitted:', feedbackData);
    
    toast.success('Dziękujemy za feedback! Twoja opinią jest bardzo cenna dla nas.');
    
    // Reset form
    setFeedbackType('');
    setRating(0);
    setEmail('');
    setSubject('');
    setMessage('');
    setIsOpen(false);
    setIsSubmitting(false);
  };

  const selectedType = feedbackTypes.find(type => type.value === feedbackType);

  return (
    <>
      {/* Floating Feedback Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Feedback
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Podziel się opinią
            </DialogTitle>
            <DialogDescription>
              Twoja opinia pomaga nam ulepszać Urbi.eu. Wszystkie sugestie są bardzo cenne!
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Feedback Type */}
            <div className="space-y-2">
              <Label htmlFor="feedbackType">Typ feedback'u</Label>
              <Select value={feedbackType} onValueChange={setFeedbackType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz typ feedback'u" />
                </SelectTrigger>
                <SelectContent>
                  {feedbackTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${type.color}`} />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label>Ogólna ocena doświadczenia</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-colors"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating
                          ? 'fill-warning text-warning'
                          : 'text-muted-foreground hover:text-warning'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email (opcjonalnie)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.com"
              />
              <p className="text-sm text-muted-foreground">
                Podaj email jeśli chcesz otrzymać odpowiedź
              </p>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Temat</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Krótki opis problemu lub sugestii"
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Szczegóły</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Opisz szczegółowo swoje doświadczenie, problem lub sugestię..."
                rows={4}
                required
              />
            </div>

            {/* Context Info */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4 pb-3">
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Strona: {currentPage}</div>
                  <div>Typ użytkownika: {userType}</div>
                  <div>Data: {new Date().toLocaleString('pl-PL')}</div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Wyślij feedback
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};