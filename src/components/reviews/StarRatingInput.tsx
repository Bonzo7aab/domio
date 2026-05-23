'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Label } from '../ui/label';

interface StarRatingInputProps {
  label: string;
  rating: number;
  onRatingChange: (rating: number) => void;
  required?: boolean;
}

export function StarRatingInput({
  label,
  rating,
  onRatingChange,
  required = true,
}: StarRatingInputProps): React.ReactElement {
  const [hovered, setHovered] = useState(0);

  return (
    <div>
      <Label className="text-base font-semibold mb-3 block">
        {label}
        {required ? ' *' : ''}
      </Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none"
            aria-label={`${star} gwiazdek`}
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= (hovered || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
