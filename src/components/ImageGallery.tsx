'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ZoomIn } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  activityName: string;
}

export default function ImageGallery({ images, activityName }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const openModal = (imgSrc: string) => {
    setSelectedImage(imgSrc);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, index) => (
          img && (
            <div
              key={img}
              className="relative group overflow-hidden rounded-lg cursor-pointer"
              onClick={() => openModal(img)}
              onKeyDown={(e) => e.key === 'Enter' && openModal(img)}
              tabIndex={0}
              role="button"
              aria-label={`Ver imagen ${index + 2} en pantalla completa`}
            >
              <Image
                src={img}
                alt={`${activityName || 'Galería'} - imagen ${index + 2}`}
                width={300}
                height={200}
                className="rounded-lg object-cover aspect-video shadow-sm transition-transform duration-300 group-hover:scale-110"
                data-ai-hint="activity gallery"
              />
              <div
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ZoomIn className="h-10 w-10 text-white" />
              </div>
            </div>
          )
        ))}
      </div>

      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={(isOpen) => !isOpen && closeModal()}>
          <DialogContent className="max-w-5xl w-full p-2 bg-transparent border-none shadow-none focus:outline-none">
            <DialogTitle className="sr-only">Imagen Ampliada de {activityName}</DialogTitle>
            <DialogDescription className="sr-only">
              Vista ampliada de una de las imágenes de la galería para la actividad {activityName}.
            </DialogDescription>
            <Image
              src={selectedImage}
              alt={`Vista ampliada de la galería para ${activityName}`}
              width={1200}
              height={800}
              className="rounded-lg object-contain w-full h-auto max-h-[90vh]"
              data-ai-hint="gallery zoomed"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
