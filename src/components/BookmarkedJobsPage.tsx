import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bookmark, Calendar, MapPin, Building, Trash2, Eye, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { getBookmarkedJobs, removeBookmark, BookmarkedJob } from '../utils/bookmarkStorage';
import { formatBudget, type Budget } from '../types/budget';
import { toast } from 'sonner';

interface BookmarkedJobsPageProps {
  onBack: () => void;
  onJobSelect: (jobId: string) => void;
}

export const BookmarkedJobsPage: React.FC<BookmarkedJobsPageProps> = ({
  onBack,
  onJobSelect
}) => {
  const [bookmarks, setBookmarks] = useState<BookmarkedJob[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<BookmarkedJob[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBookmarks();
  }, []);

  // Helper function to format location as string
  const formatLocation = (location: string | { city?: string; sublocality_level_1?: string } | undefined): string => {
    if (!location) return 'Nieznana lokalizacja';
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location !== null) {
      if (location.sublocality_level_1) {
        return `${location.city || 'Unknown'}, ${location.sublocality_level_1}`;
      }
      return location.city || 'Unknown';
    }
    return 'Nieznana lokalizacja';
  };

  // Helper function to format budget (handles both string and object formats)
  const formatBudgetValue = (budget: string | Budget | undefined): string => {
    if (!budget) return '';
    if (typeof budget === 'string') return budget;
    return formatBudget(budget);
  };

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = bookmarks.filter(bookmark => {
        const locationString = formatLocation(bookmark.location);
        return (
          bookmark.title.toLowerCase().includes(query) ||
          bookmark.company.toLowerCase().includes(query) ||
          locationString.toLowerCase().includes(query)
        );
      });
      setFilteredBookmarks(filtered);
    } else {
      setFilteredBookmarks(bookmarks);
    }
  }, [bookmarks, searchQuery]);

  const loadBookmarks = () => {
    const savedBookmarks = getBookmarkedJobs();
    setBookmarks(savedBookmarks);
  };

  const handleRemoveBookmark = (jobId: string, jobTitle: string) => {
    removeBookmark(jobId);
    loadBookmarks();
    toast.success(`Usunięto z zapisanych: ${jobTitle}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPostTypeBadge = (postType: 'job' | 'tender') => {
    if (postType === 'tender') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Przetarg</Badge>;
    }
    return <Badge variant="outline">Zlecenie</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onBack} className="hidden md:flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Powrót
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Zapisane ogłoszenia</h1>
                <p className="text-sm text-muted-foreground">
                  {bookmarks.length} {bookmarks.length === 1 ? 'ogłoszenie' : 'ogłoszeń'}
                </p>
              </div>
            </div>
            <Bookmark className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {bookmarks.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Szukaj w zapisanych ogłoszeniach..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {filteredBookmarks.length === 0 && bookmarks.length > 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Brak wyników</h3>
            <p className="text-muted-foreground">
              Nie znaleziono ogłoszeń pasujących do wyszukiwania "{searchQuery}"
            </p>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Brak zapisanych ogłoszeń</h3>
            <p className="text-muted-foreground mb-6">
              Nie masz jeszcze żadnych zapisanych ogłoszeń.
              <br />
              Możesz zapisywać interesujące Cię oferty klikając ikonę zakładki.
            </p>
            <Button onClick={onBack}>
              Przeglądaj ogłoszenia
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPostTypeBadge(bookmark.postType)}
                        <span className="text-sm text-muted-foreground">
                          Zapisano: {formatDate(bookmark.bookmarkedAt)}
                        </span>
                      </div>
                      <CardTitle className="text-lg line-clamp-2 cursor-pointer hover:text-primary"
                        onClick={() => onJobSelect(bookmark.id)}>
                        {bookmark.title}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBookmark(bookmark.id, bookmark.title)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {bookmark.company}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {formatLocation(bookmark.location)}
                    </div>
                    {bookmark.deadline && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Termin: {bookmark.deadline}
                      </div>
                    )}
                  </div>
                  
                  {bookmark.budget && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-success">
                        Budżet: {formatBudgetValue(bookmark.budget)}
                      </span>
                    </div>
                  )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onJobSelect(bookmark.id)}
                      className="w-full md:w-auto"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Zobacz szczegóły
                    </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};