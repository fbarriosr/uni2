
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle2, Home, ThumbsUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { AppRoutes } from '@/lib/urls';

function SuccessContent() {
    const searchParams = useSearchParams();
    const order = searchParams.get('order');
    const amount = searchParams.get('amount');
    const salidaId = searchParams.get('salidaId');

    return (
        <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
                        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-2xl">¡Pago Exitoso!</CardTitle>
                    <CardDescription>Tu transacción ha sido procesada correctamente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-left bg-muted p-4 rounded-lg text-sm">
                        <p className="flex justify-between">
                            <span className="text-muted-foreground">Orden de Compra:</span>
                            <span className="font-mono">{order || 'N/A'}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-muted-foreground">Monto Pagado:</span>
                            <span className="font-mono">{amount ? formatCurrency(Number(amount)) : 'N/A'}</span>
                        </p>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        Hemos actualizado tu plan. ¡Ya puedes revisar el itinerario y prepararte para la diversión!
                    </p>
                </CardContent>
                <CardFooter>
                    {salidaId ? (
                        <Button asChild className="w-full">
                            <Link href={AppRoutes.salidas.match(salidaId)}>
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                Ir a mi Salida
                            </Link>
                        </Button>
                    ) : (
                         <Button asChild className="w-full">
                            <Link href="/inicio">
                                <Home className="mr-2 h-4 w-4" />
                                Volver al Inicio
                            </Link>
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
