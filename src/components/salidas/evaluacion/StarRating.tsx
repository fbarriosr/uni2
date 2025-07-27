
'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
  starCount?: number;
  disabled?: boolean;
}

export default function StarRating({ rating, setRating, starCount = 5, disabled = false }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex space-x-1">
      {[...Array(starCount)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            type="button"
            key={ratingValue}
            className={cn(
              "p-1 transition-colors duration-200",
              ratingValue <= (hover || rating) ? "text-yellow-400" : "text-gray-300",
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            )}
            onClick={() => !disabled && setRating(ratingValue)}
            onMouseEnter={() => !disabled && setHover(ratingValue)}
            onMouseLeave={() => !disabled && setHover(0)}
            aria-label={`Rate ${ratingValue} out of ${starCount}`}
            disabled={disabled}
          >
            <Star className="w-8 h-8 fill-current" />
          </button>
        );
      })}
    </div>
  );
}
