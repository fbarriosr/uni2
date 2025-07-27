
'use client';

import { cn } from '@/lib/utils';

const emojis = [
  { emoji: '😞', label: 'No le gustó' },
  { emoji: '😐', label: 'Indiferente' },
  { emoji: '🙂', label: 'Le gustó' },
  { emoji: '😄', label: 'Le gustó mucho' },
  { emoji: '🤩', label: '¡Le encantó!' },
];

interface EmojiRatingProps {
  rating: number;
  setRating: (rating: number) => void;
  disabled?: boolean;
}

export default function EmojiRating({ rating, setRating, disabled = false }: EmojiRatingProps) {

  return (
    <div className="flex items-end space-x-2 md:space-x-4">
      {emojis.map((item, index) => {
        const ratingValue = index + 1;
        const isSelected = rating === ratingValue;
        return (
          <div key={ratingValue} className="flex flex-col items-center">
            <button
              type="button"
              className={cn(
                "text-4xl md:text-5xl rounded-full p-2 transition-transform duration-200 ease-in-out",
                isSelected ? 'transform scale-125 bg-primary/20' : 'grayscale opacity-60',
                !disabled && !isSelected && 'hover:opacity-100 hover:scale-110',
                disabled ? 'cursor-not-allowed' : 'cursor-pointer'
              )}
              onClick={() => !disabled && setRating(ratingValue)}
              aria-label={`Rate ${item.label}`}
              disabled={disabled}
            >
              {item.emoji}
            </button>
            <p className={cn(
              "text-xs text-muted-foreground mt-2 transition-opacity",
              isSelected ? 'opacity-100 font-semibold' : 'opacity-0'
            )}>{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}
