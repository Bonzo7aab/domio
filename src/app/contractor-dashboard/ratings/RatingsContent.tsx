"use client";

import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';

interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: { '5': number; '4': number; '3': number; '2': number; '1': number };
}

interface Review {
  id: string;
  reviewerName: string;
  reviewerType: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  helpfulCount: number;
}

interface WrittenReview {
  id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  counterpartyName: string;
  jobId: string | null;
}

interface RatingsContentProps {
  ratingSummary: RatingSummary | null;
  reviews: Review[];
  writtenReviews: WrittenReview[];
  writtenEmptyDescription?: string;
}

export function RatingsContent({
  ratingSummary,
  reviews,
  writtenReviews,
  writtenEmptyDescription = 'Brak wystawionych ocen konkursów. Oceń konkurs po ukończeniu projektu w sekcji Projekty.',
}: RatingsContentProps) {
  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {ratingSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Podsumowanie ocen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {ratingSummary.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-6 h-6 ${
                        i < Math.floor(ratingSummary.averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  {ratingSummary.totalReviews} {ratingSummary.totalReviews === 1 ? 'opinia' : 'opinii'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-semibold mb-3">Rozkład ocen</div>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count =
                    ratingSummary.ratingBreakdown[
                      stars.toString() as keyof typeof ratingSummary.ratingBreakdown
                    ] || 0;
                  const percentage =
                    ratingSummary.totalReviews > 0
                      ? (count / ratingSummary.totalReviews) * 100
                      : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-sm w-8">{stars}★</span>
                      <Progress value={percentage} className="flex-1 h-2" />
                      <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="received" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="issued">Wystawione</TabsTrigger>
          <TabsTrigger value="received">Otrzymane</TabsTrigger>
        </TabsList>

        <TabsContent value="issued" className="space-y-4">
          {writtenReviews.length > 0 ? (
            writtenReviews.map((w) => (
              <Card key={w.id}>
                <CardContent className="pt-6 space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{w.counterpartyName}</span>
                    <span className="text-amber-600 font-semibold">★ {w.rating}</span>
                  </div>
                  {w.title && <p className="text-sm font-medium">{w.title}</p>}
                  {w.comment && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{w.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(w.createdAt).toLocaleDateString('pl-PL')}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {writtenEmptyDescription}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium">{review.reviewerName}</h4>
                    <p className="text-sm text-gray-600">
                      {review.reviewerType === 'manager' ? 'Zarządca' : 'Klient prywatny'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${
                          i < review.rating 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
                
                {review.title && (
                  <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                )}
                
                <p className="text-gray-700 mb-3">{review.comment}</p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{new Date(review.createdAt).toLocaleDateString('pl-PL')}</span>
                </div>
              </CardContent>
            </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-gray-500 mb-4">
                  <Star className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Brak opinii</h3>
                  <p>Twoja firma nie ma jeszcze żadnych opinii od klientów.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

