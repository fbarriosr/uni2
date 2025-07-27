
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { addCoupon, updateCoupon, deleteCoupon, getCouponByCode } from '@/lib/data';
import { AppRoutes } from '@/lib/urls';
import { formatCurrency } from '@/lib/utils';


// Zod Schema for coupon validation with advanced rules
const CouponSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(3, { message: 'El código debe tener al menos 3 caracteres.' }).toUpperCase(),
  discountType: z.enum(['percentage', 'fixed'], { required_error: 'Debe seleccionar un tipo de descuento.' }),
  discountValue: z.coerce.number({ invalid_type_error: 'El valor del descuento debe ser un número.' }),
  validFrom: z.coerce.date({ required_error: 'La fecha de inicio de vigencia es requerida.' }),
  validTo: z.coerce.date({ required_error: 'La fecha de fin de vigencia es requerida.' }),
  isActive: z.coerce.boolean(),
  maxUses: z.coerce.number().int().min(1, { message: 'El número de usos debe ser al menos 1.' }),
})
.refine(data => data.validTo > data.validFrom, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio.',
  path: ["validTo"],
})
.superRefine((data, ctx) => {
    if (data.discountType === 'percentage') {
        if (data.discountValue <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El porcentaje debe ser un número positivo.', path: ['discountValue'] });
        }
        if (data.discountValue > 100) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El porcentaje no puede ser mayor a 100.', path: ['discountValue'] });
        }
    } else if (data.discountType === 'fixed') {
        if (data.discountValue <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El monto fijo debe ser un número positivo.', path: ['discountValue'] });
        }
        if (data.discountValue > 100000) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El monto fijo no puede superar los 100.000 CLP.', path: ['discountValue'] });
        }
    }
});


export type CouponFormState = {
  message: string;
  errors?: {
    code?: string[];
    discountType?: string[];
    discountValue?: string[];
    validFrom?: string[];
    validTo?: string[];
    isActive?: string[];
    maxUses?: string[];
    general?: string[];
  };
  success: boolean;
};

export async function addOrUpdateCouponAction(prevState: CouponFormState, formData: FormData): Promise<CouponFormState> {
  const validatedFields = CouponSchema.safeParse({
    id: formData.get('id') || undefined,
    code: formData.get('code'),
    discountType: formData.get('discountType'),
    discountValue: formData.get('discountValue'),
    validFrom: formData.get('validFrom'),
    validTo: formData.get('validTo'),
    isActive: formData.get('isActive') === 'on',
    maxUses: formData.get('maxUses'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Error de validación.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }
  
  const { id, ...couponData } = validatedFields.data;

  try {
    if (id) {
      await updateCoupon(id, couponData);
    } else {
      const couponWithUsage = { ...couponData, timesUsed: 0 };
      await addCoupon(couponWithUsage);
    }
    
    revalidatePath(AppRoutes.cupones);
    return { message: `Cupón ${id ? 'actualizado' : 'creado'} exitosamente.`, success: true };
  } catch (error) {
    console.error('Error processing coupon:', error);
    return { message: 'Error del servidor al procesar el cupón.', success: false };
  }
}

export async function deleteCouponAction(couponId: string): Promise<{ success: boolean; message: string; }> {
  try {
    await deleteCoupon(couponId);
    revalidatePath(AppRoutes.cupones);
    return { success: true, message: 'Cupón eliminado exitosamente.' };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return { success: false, message: 'Error del servidor al eliminar el cupón.' };
  }
}


export type ApplyCouponState = {
  success: boolean;
  discountAmount: number;
  message: string;
};

export async function applyCouponAction(
  code: string,
  subtotal: number
): Promise<ApplyCouponState> {
  if (!code) {
    return { success: false, discountAmount: 0, message: 'Por favor, ingresa un código de cupón.' };
  }

  const coupon = await getCouponByCode(code);

  if (!coupon) {
    return { success: false, discountAmount: 0, message: 'El código de cupón no es válido o ha expirado.' };
  }

  if (coupon.timesUsed >= coupon.maxUses) {
    return { success: false, discountAmount: 0, message: 'Este cupón ha alcanzado su límite de usos.' };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = subtotal * (coupon.discountValue / 100);
  } else { // 'fixed'
    discountAmount = coupon.discountValue;
  }
  
  // Ensure discount is not more than subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  return {
    success: true,
    discountAmount,
    message: `¡Cupón aplicado! Se ha aplicado un descuento de ${formatCurrency(discountAmount)}.`,
  };
}
