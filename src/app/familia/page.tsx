
import AuthCheck from '@/components/AuthCheck';
import FamiliaClientPage from '@/components/familia/FamiliaClientPage';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Familia',
  description: 'Gestiona los miembros de tu grupo familiar y sus permisos.',
};

export default function FamiliaPage() {
  return (
    <AuthCheck>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
        <FamiliaClientPage />
      </Suspense>
    </AuthCheck>
  );
}
