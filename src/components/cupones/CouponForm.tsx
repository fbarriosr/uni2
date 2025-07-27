
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import type { Coupon } from '@/lib/types';
import { addOrUpdateCouponAction, type CouponFormState } from '@/lib/actions/couponActions';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DateRange } from 'react-day-picker';

const CouponFormSchema = z.object({
  code: z.string().min(3, { message: 'El código debe tener al menos 3 caracteres.' }).toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().positive({ message: 'El valor del descuento debe ser un número positivo.' }),
  validFrom: z.date({ required_error: 'La fecha de inicio de vigencia es requerida.' }),
  validTo: z.date({ required_error: 'La fecha de fin de vigencia es requerida.' }),
  isActive: z.boolean(),
  maxUses: z.coerce.number().int().min(1, { message: 'El número de usos debe ser al menos 1.' }),
}).refine(data => data.validTo > data.validFrom, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio.',
  path: ["validTo"],
});

type CouponFormValues = z.infer<typeof CouponFormSchema>;

interface CouponFormProps {
  coupon?: Coupon | null;
  onFinished: () => void;
}

export default function CouponForm({ coupon, onFinished }: CouponFormProps) {
  const { toast } = useToast();
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(CouponFormSchema),
    defaultValues: {
      code: coupon?.code || '',
      discountType: coupon?.discountType || 'percentage',
      discountValue: coupon?.discountValue || 0,
      validFrom: coupon ? new Date(coupon.validFrom) : new Date(),
      validTo: coupon ? new Date(coupon.validTo) : new Date(new Date().setDate(new Date().getDate() + 7)),
      isActive: coupon?.isActive ?? true,
      maxUses: coupon?.maxUses || 100,
    },
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: form.getValues('validFrom'),
    to: form.getValues('validTo'),
  });
  const [startTime, setStartTime] = useState(coupon ? format(new Date(coupon.validFrom), 'HH:mm') : '00:00');
  const [endTime, setEndTime] = useState(coupon ? format(new Date(coupon.validTo), 'HH:mm') : '23:59');

  const { setValue, trigger, watch } = form;

  useEffect(() => {
    const combineDateTime = (date: Date, time: string): Date => {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      return newDate;
    };

    if (dateRange?.from) {
      setValue('validFrom', combineDateTime(dateRange.from, startTime), { shouldValidate: true });
    }
    if (dateRange?.to) {
      setValue('validTo', combineDateTime(dateRange.to, endTime), { shouldValidate: true });
    } else if (dateRange?.from) {
      // If only 'from' is selected, set 'to' to the same date for validation purposes
      setValue('validTo', combineDateTime(dateRange.from, endTime), { shouldValidate: true });
    }
    // Re-validate the other field when one changes
    trigger('validTo');
    trigger('validFrom');
  }, [dateRange, startTime, endTime, setValue, trigger]);
  
  const initialState: CouponFormState = { message: '', success: false };
  const [state, formAction, isPending] = useActionState(addOrUpdateCouponAction, initialState);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: "Éxito", description: state.message });
        onFinished();
      } else {
        toast({ title: "Error", description: state.message || "Por favor, corrige los errores en el formulario.", variant: "destructive"});
      }
    }
  }, [state, onFinished, toast]);
  

  return (
    <form action={formAction} className="grid gap-4 py-4">
        {coupon?.id && <input type="hidden" name="id" value={coupon.id} />}
        <input type="hidden" name="validFrom" value={watch('validFrom')?.toISOString()} />
        <input type="hidden" name="validTo" value={watch('validTo')?.toISOString()} />
        <input type="hidden" name="discountType" value={watch('discountType')} />
        <input type="checkbox" name="isActive" checked={watch('isActive')} readOnly className="hidden" />

      <div>
        <Label htmlFor="code">Código</Label>
        <Input id="code" {...form.register('code')} />
        {form.formState.errors.code && <p className="text-sm text-destructive mt-1">{form.formState.errors.code.message}</p>}
        {state.errors?.code && <p className="text-sm text-destructive mt-1">{state.errors.code[0]}</p>}
      </div>
      
      <div>
        <Label htmlFor="maxUses">Usos Máximos</Label>
        <Input id="maxUses" type="number" {...form.register('maxUses')} />
        {form.formState.errors.maxUses && <p className="text-sm text-destructive mt-1">{form.formState.errors.maxUses.message}</p>}
        {state.errors?.maxUses && <p className="text-sm text-destructive mt-1">{state.errors.maxUses[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discountType">Tipo de Descuento</Label>
          <Select onValueChange={(value) => setValue('discountType', value as 'percentage' | 'fixed')} defaultValue={form.getValues('discountType')}>
            <SelectTrigger id="discountType" className="w-full mt-1">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Porcentaje (%)</SelectItem>
              <SelectItem value="fixed">Monto Fijo (CLP)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="discountValue">Valor</Label>
          <Input id="discountValue" type="number" {...form.register('discountValue')} />
          {form.formState.errors.discountValue && <p className="text-sm text-destructive mt-1">{form.formState.errors.discountValue.message}</p>}
          {state.errors?.discountValue && <p className="text-sm text-destructive mt-1">{state.errors.discountValue[0]}</p>}
        </div>
      </div>

      <div>
        <Label>Rango de Vigencia</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-range"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal mt-1",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                    {format(dateRange.to, "LLL dd, y", { locale: es })}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y", { locale: es })
                )
              ) : (
                <span>Elige un rango de fechas</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
            />
          </PopoverContent>
        </Popover>
        {form.formState.errors.validFrom && <p className="text-sm text-destructive mt-1">{form.formState.errors.validFrom.message}</p>}
        {state.errors?.validFrom && <p className="text-sm text-destructive mt-1">{state.errors.validFrom[0]}</p>}
        {form.formState.errors.validTo && <p className="text-sm text-destructive mt-1">{form.formState.errors.validTo.message}</p>}
        {state.errors?.validTo && <p className="text-sm text-destructive mt-1">{state.errors.validTo[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
          <div>
              <Label htmlFor="startTime">Hora de inicio</Label>
              <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1"
              />
          </div>
          <div>
              <Label htmlFor="endTime">Hora de fin</Label>
              <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1"
              />
          </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch
            id="isActiveSwitch"
            checked={watch('isActive')}
            onCheckedChange={(checked) => setValue('isActive', checked)}
        />
        <Label htmlFor="isActiveSwitch">Activo</Label>
      </div>

      <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {coupon ? 'Guardar Cambios' : 'Crear Cupón'}
          </Button>
      </div>
    </form>
  );
}
