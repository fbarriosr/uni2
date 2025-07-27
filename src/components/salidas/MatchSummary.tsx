
'use client';
import { useState, useEffect, useMemo } from 'react';
import type { RequestedActivity, UserRole } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Trash2, Loader2, Ticket, CheckCircle, Reply, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createWebpayTransaction } from '@/lib/actions/paymentActions';
import { applyCouponAction } from '@/lib/actions/couponActions';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface MatchSummaryProps {
  confirmedActivities: RequestedActivity[];
  onRemoveActivity: (activityId: string) => void;
  isUpdating: boolean;
  salidaId: string;
  userRole: UserRole | null;
}

export default function MatchSummary({ confirmedActivities, onRemoveActivity, isUpdating, salidaId, userRole }: MatchSummaryProps) {
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  const isChild = userRole === 'hijo';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const unpaidActivities = useMemo(() => confirmedActivities.filter(req => !req.paid && req.activityDetails), [confirmedActivities]);
  
  const subtotal = useMemo(() => unpaidActivities.reduce((sum, req) => sum + (req.activityDetails?.price || 0), 0), [unpaidActivities]);
  const total = subtotal - discount;
  
  const hasUnpaidActivities = unpaidActivities.length > 0;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({ title: 'Código Vacío', description: 'Por favor, ingresa un código de cupón.', variant: 'destructive' });
      return;
    }
    setIsApplyingCoupon(true);
    const result = await applyCouponAction(couponCode, subtotal);
    if (result.success) {
      setDiscount(result.discountAmount);
      setAppliedCouponCode(couponCode.toUpperCase());
      toast({
        title: 'Cupón Aplicado',
        description: result.message,
      });
    } else {
      setDiscount(0);
      setAppliedCouponCode(null);
      toast({
        title: 'Cupón Inválido',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsApplyingCoupon(false);
  };
  
  const handlePayment = async () => {
    if (!currentUser) {
        toast({ title: 'Usuario no autenticado', description: 'Debes iniciar sesión para pagar.', variant: 'destructive' });
        return;
    }
    if (total <= 0 && subtotal > 0) { // Allow "paying" for free activities to mark them as paid
        // Here you would implement logic to mark free activities as "paid" without a transaction
        toast({ title: 'Actividades Gratuitas', description: 'Confirmando actividades gratuitas...', });
        // TODO: Implement a server action to mark free activities as paid
        return;
    }
    if (total <= 0) {
        toast({ title: 'Monto inválido', description: 'El total a pagar debe ser mayor que cero.', variant: 'destructive' });
        return;
    }

    setIsPaying(true);

    const unpaidActivityIds = unpaidActivities.map(req => req.id);
    
    try {
        const result = await createWebpayTransaction(total, salidaId, currentUser.uid, unpaidActivityIds, appliedCouponCode || undefined);
        
        if (result.success && result.url && result.token) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = result.url;

            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = 'token_ws';
            tokenInput.value = result.token;

            form.appendChild(tokenInput);
            document.body.appendChild(form);
            form.submit();
        } else {
            toast({
                title: 'Error de Pago',
                description: result.message || 'No se pudo iniciar el proceso de pago.',
                variant: 'destructive',
            });
            setIsPaying(false);
        }
    } catch (error) {
        console.error("Payment initiation error:", error);
        toast({
            title: 'Error Inesperado',
            description: 'Ocurrió un error al intentar procesar el pago.',
            variant: 'destructive',
        });
        setIsPaying(false);
    }
  };

  if (isChild) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl border-t-4 border-green-500 mt-12 bg-gradient-to-br from-green-50 via-background to-background">
        <CardHeader className="text-center">
            <PartyPopper className="h-12 w-12 mx-auto text-green-600" />
          <CardTitle className="text-2xl font-headline text-green-800">¡Este es el Plan Confirmado!</CardTitle>
        </CardHeader>
        <CardContent>
          {confirmedActivities.length > 0 ? (
            <div className="space-y-3">
              {confirmedActivities.map(request => (
                <div key={request.id} className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-semibold text-foreground">{request.activityDetails?.name}</p>
                    <p className="text-xs text-muted-foreground">{request.activityDetails?.location}</p>
                  </div>
                   <Badge variant="secondary" className="font-mono bg-green-100 text-green-800 border-green-200">
                     <CheckCircle className="mr-1.5 h-3 w-3"/> Confirmado
                   </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              ¡Confirma las actividades que te gustaron para ver el plan aquí!
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-t-4 border-primary mt-12">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-foreground">Resumen de Salida</CardTitle>
      </CardHeader>
      <CardContent>
        {confirmedActivities.length > 0 ? (
          <div className="space-y-3">
            {confirmedActivities.map(request => (
              <div key={request.id} className="flex justify-between items-center text-sm group">
                <div>
                  <p className="font-semibold text-foreground">{request.activityDetails?.name}</p>
                  <p className="text-xs text-muted-foreground">{request.activityDetails?.location}</p>
                </div>
                <div className="flex items-center gap-4">
                   {request.paid ? (
                     <Badge variant="secondary" className="font-mono">Pagado</Badge>
                   ) : (
                     <p className="font-mono font-medium">{formatCurrency(request.activityDetails?.price || 0)}</p>
                   )}
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground opacity-50 group-hover:opacity-100 hover:text-destructive"
                    onClick={() => onRemoveActivity(request.id)}
                    disabled={isUpdating}
                    aria-label={`Devolver ${request.activityDetails?.name} a votación`}
                   >
                     <Reply className="h-4 w-4" />
                   </Button>
                </div>
              </div>
            ))}
            <Separator className="my-4 !mt-4" />

            {hasUnpaidActivities && (
              <>
                <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                        <div className="relative flex-grow">
                             <Ticket className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                             <Input 
                                placeholder="Código de cupón"
                                className="pl-8" 
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                disabled={isApplyingCoupon || !!appliedCouponCode}
                             />
                        </div>
                        <Button variant="outline" onClick={handleApplyCoupon} disabled={isApplyingCoupon || !!appliedCouponCode}>
                            {isApplyingCoupon ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Aplicar'}
                        </Button>
                    </div>
                </div>

                <div className="space-y-1 pt-4">
                     <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                        <p>Subtotal (Pendiente)</p>
                        <p className="font-mono">{formatCurrency(subtotal)}</p>
                    </div>
                    {discount > 0 && (
                         <div className="flex justify-between items-center text-sm font-medium text-green-600">
                            <p>Descuento ({appliedCouponCode})</p>
                            <p className="font-mono">- {formatCurrency(discount)}</p>
                        </div>
                    )}
                     <Separator className="my-2" />
                     <div className="flex justify-between items-center text-lg font-bold">
                        <p>Total a Pagar</p>
                        <p className="font-mono">{formatCurrency(total)}</p>
                    </div>
                </div>
              </>
            )}

          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            Confirma las actividades que le gustaron a tus hijos para ver el resumen aquí.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button size="lg" className="w-full" disabled={!hasUnpaidActivities || isUpdating || isPaying} onClick={handlePayment}>
          {isPaying ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : !hasUnpaidActivities && confirmedActivities.length > 0 ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Todo Pagado
            </>
          ) : (
            'Pagar Actividades Pendientes'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
