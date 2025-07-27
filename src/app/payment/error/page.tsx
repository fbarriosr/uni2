
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { XCircle, ArrowLeft } from 'lucide-react';

function ErrorContent() {
    const searchParams = useSearchParams();
    const reason = searchParams.get('reason');
    const order = searchParams.get('order');

    const getErrorMessage = () => {
        switch(reason) {
            case 'cancelled':
                return 'El pago fue cancelado por el usuario.';
            case 'notoken':
                return 'No se recibió la información necesaria para procesar el pago.';
            case 'commit_failed':
                return 'Ocurrió un error al confirmar la transacción con el banco.';
            case 'commit_exception':
                 return 'Hubo un error inesperado al procesar el token de pago. Intenta de nuevo.';
            case 'session_not_found':
                 return 'No se pudo encontrar la sesión de compra asociada a este pago.';
            case 'invalid_method':
                 return 'Se utilizó un método de pago incorrecto.';
            case 'invalid_request':
                 return 'La solicitud de pago es inválida o ha expirado. Por favor, inicia el proceso de nuevo.';
            default:
                return 'Ocurrió un error inesperado durante el proceso de pago.';
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                     <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
                        <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-2xl">Error en el Pago</CardTitle>
                    <CardDescription>{getErrorMessage()}</CardDescription>
                </CardHeader>
                <CardContent>
                    {order && (
                        <div className="text-left bg-muted p-3 rounded-lg text-sm">
                            <p className="flex justify-between">
                                <span className="text-muted-foreground">Orden de Compra:</span>
                                <span className="font-mono">{order}</span>
                            </p>
                        </div>
                    )}
                    <p className="text-muted-foreground text-xs mt-4">
                       Por favor, intenta realizar el pago nuevamente. Si el problema persiste, contacta a soporte.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full" variant="outline">
                        <Link href="/inicio">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver e Intentar de Nuevo
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function PaymentErrorPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ErrorContent />
        </Suspense>
    );
}
