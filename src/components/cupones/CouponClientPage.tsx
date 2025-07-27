
'use client';

import { useState } from 'react';
import type { Coupon } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CouponForm from './CouponForm';
import DeleteCouponButton from './DeleteCouponButton';
import { formatCurrency } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface CouponClientPageProps {
  initialCoupons: Coupon[];
}

export default function CouponClientPage({ initialCoupons }: CouponClientPageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const handleOpenDialog = (coupon: Coupon | null = null) => {
    setSelectedCoupon(coupon);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCoupon(null);
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    }
    return formatCurrency(coupon.discountValue);
  };
  
  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Cupón
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hidden md:table-row">
              <TableHead>Código</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead>Uso</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialCoupons.length > 0 ? (
              initialCoupons.map((coupon) => (
                <TableRow key={coupon.id} className="block md:table-row mb-4 md:mb-0 border md:border-b">
                  <TableCell className="block md:table-cell text-right md:text-left border-b md:border-none">
                    <span className="md:hidden font-bold float-left">Código</span>
                    <span className="font-mono font-medium">{coupon.code}</span>
                  </TableCell>
                  <TableCell className="block md:table-cell text-right md:text-left border-b md:border-none">
                    <span className="md:hidden font-bold float-left">Descuento</span>
                    {getDiscountDisplay(coupon)}
                  </TableCell>
                   <TableCell className="block md:table-cell text-right md:text-left border-b md:border-none">
                    <span className="md:hidden font-bold float-left">Uso</span>
                    Usados: {coupon.timesUsed} / {coupon.maxUses}
                  </TableCell>
                   <TableCell className="block md:table-cell text-right md:text-left border-b md:border-none text-xs">
                    <span className="md:hidden font-bold float-left">Vigencia</span>
                    <div>De: {format(new Date(coupon.validFrom), 'dd MMM yy, HH:mm', { locale: es })}</div>
                    <div>A: {format(new Date(coupon.validTo), 'dd MMM yy, HH:mm', { locale: es })}</div>
                  </TableCell>
                  <TableCell className="block md:table-cell text-right md:text-left border-b md:border-none">
                    <span className="md:hidden font-bold float-left">Estado</span>
                    <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                      {coupon.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="block md:table-cell text-right md:text-left">
                     <span className="md:hidden font-bold float-left">Acciones</span>
                     <div className="flex justify-end items-center">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(coupon)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DeleteCouponButton couponId={coupon.id} couponCode={coupon.code} />
                     </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No se encontraron cupones.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                  <DialogTitle>{selectedCoupon ? 'Editar Cupón' : 'Crear Nuevo Cupón'}</DialogTitle>
                  <DialogDescription>
                      {selectedCoupon ? 'Modifica los detalles de tu cupón.' : 'Completa el formulario para añadir un nuevo cupón.'}
                  </DialogDescription>
              </DialogHeader>
              <CouponForm coupon={selectedCoupon} onFinished={handleCloseDialog} />
          </DialogContent>
      </Dialog>
    </>
  );
}
