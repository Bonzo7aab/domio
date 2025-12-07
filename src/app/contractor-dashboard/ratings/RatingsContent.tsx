"use client";

import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { getCategoryLabel } from '../../../components/contractor-dashboard/shared/utils';

interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: { '5': number; '4': number; '3': number; '2': number; '1': number };
  categoryRatings: { quality: number; timeliness: number; communication: number; pricing: number };
}

interface Review {
  id: string;
  reviewerName: string;
  reviewerType: string;
  rating: number;
  title: string;
  comment: string;
  categories: {
    quality: number;
    timeliness: number;
    communication: number;
    pricing: number;
  };
  createdAt: string;
  helpfulCount: number;
}

interface RatingsContentProps {
  ratingSummary: RatingSummary | null;
  reviews: Review[];
}

export function RatingsContent({ ratingSummary, reviews }: RatingsContentProps) {
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
                {Object.entries(ratingSummary.categoryRatings || {}).map(([category, rating]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{getCategoryLabel(category)}:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: `${(Number(rating) / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{Number(rating).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {Object.keys(ratingSummary.ratingBreakdown).length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="text-sm font-semibold mb-3">Rozkład ocen:</div>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = ratingSummary.ratingBreakdown[stars.toString() as keyof typeof ratingSummary.ratingBreakdown] || 0;
                    const percentage = ratingSummary.totalReviews > 0 
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
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
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
                
                {/* Category Ratings */}
                {review.categories && Object.keys(review.categories).length > 0 && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium mb-2">Szczegółowe oceny:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(review.categories).map(([category, rating]) => (
                        <div key={category} className="flex items-center justify-between text-xs">
                          <span>{getCategoryLabel(category)}:</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span>{Number(rating).toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
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
      </div>
    </div>
  );
}

