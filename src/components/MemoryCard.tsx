import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { AppRoutes } from '@/lib/urls';
import { PlayCircle, CalendarDays, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MemoryCardProps {
  title: string;
  date: string;
  imageUrl: string;
  aiHint?: string;
  activityId?: string;
  salidaId?: string;
  videoUrl?: string;
  isSpecialHighlight?: boolean;
  participantAvatarUrls?: string[];
}

const MemoryCard: React.FC<MemoryCardProps> = ({ title, date, imageUrl, aiHint, activityId, salidaId, videoUrl, isSpecialHighlight, participantAvatarUrls }) => {
  const href = salidaId
    ? AppRoutes.salidas.detail(salidaId)
    : activityId
    ? AppRoutes.actividadesDetalle(activityId, salidaId)
    : videoUrl;

  const cardContent = (
    <Card className={cn(
      "relative rounded-xl shadow-lg group transition-all duration-300 ease-in-out w-full hover:shadow-2xl hover:-translate-y-1 bg-card aspect-[3/4]",
      isSpecialHighlight && "ring-4 ring-offset-2 ring-primary ring-offset-background"
    )}>
      <div className="relative h-full w-full rounded-xl overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={aiHint}
        />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

        {participantAvatarUrls && participantAvatarUrls.length > 0 && (
          <div className="absolute top-3 right-3 flex -space-x-3">
            {participantAvatarUrls.slice(0, 3).map((url, index) => (
              <Image
                key={index}
                src={url}
                alt={`Avatar del participante ${index + 1}`}
                width={32}
                height={32}
                className="rounded-full object-cover border-2 border-white/80 shadow-lg"
                style={{ zIndex: participantAvatarUrls.length - index }}
                data-ai-hint="participant avatar"
              />
            ))}
          </div>
        )}

        {isSpecialHighlight && (
          <Badge variant="default" className="absolute top-3 left-3 flex items-center gap-1.5 shadow-md animate-pulse">
              <Star size={14} />
              ¡Próxima!
          </Badge>
        )}

        {videoUrl && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <PlayCircle className="h-12 w-12 text-white/80 group-hover:text-white transition-colors" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-base leading-tight truncate text-white">{title}</h3>
          <p className="text-xs text-white/80 flex items-center mt-1">
            <CalendarDays size={12} className="mr-1.5" />
            {date}
          </p>
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return <div className="block h-full cursor-default">{cardContent}</div>;
};

export default MemoryCard;
