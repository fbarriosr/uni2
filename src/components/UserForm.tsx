
'use client';

import { useActionState, useEffect, useState } from 'react'; // Changed import and hook
import { useForm } from 'react-hook-form';
import type { User, UserRole } from '@/lib/types';
import { USER_ROLES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { UserFormState } from '@/lib/actions/userActions';
import { sendPasswordResetLinkAction } from '@/lib/actions/userActions'; // Import the action
import { Loader2 } from 'lucide-react';

interface UserFormProps {
  user?: User | null; // For editing
  formAction: (prevState: UserFormState, formData: FormData) => Promise<UserFormState>;
  submitButtonText: string;
  formTitle: string;
  formDescription?: string;
}

type FormValues = {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  confirmPassword?: string;
};

export default function UserForm({ user, formAction, submitButtonText, formTitle, formDescription }: UserFormProps) {
  const { toast } = useToast();
  // Updated to useActionState
  const [state, dispatch, isPending] = useActionState(formAction, { message: '', success: false });
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const { register, handleSubmit, formState: { errors /* removed isSubmitting from here */ }, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'user',
      password: '', // Always empty for security and to indicate no change unless typed
      confirmPassword: '',
    }
  });
  
  const currentRole = watch('role');

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Éxito' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success && !user) { // Reset form on successful creation
        reset({ name: '', email: '', role: 'user', password: '', confirmPassword: ''});
      } else if (state.success && user) {
        // For existing user, only reset password fields if they were part of the successful update
        // This is tricky because the server action doesn't tell us if password was updated.
        // For simplicity, we can reset them, or user can clear them.
        reset({ name: watch('name'), email: watch('email'), role: watch('role'), password: '', confirmPassword: ''});
      }
    }
  }, [state, toast, reset, user, watch]);

  useEffect(() => {
    if (state.errors) {
        console.error("Server-side form errors:", state.errors);
    }
  }, [state.errors]);

  const onFormSubmit = (data: FormValues) => {
    const formData = new FormData();
    (Object.keys(data) as Array<keyof FormValues>).forEach((key) => {
        const value = data[key];
        // Only append password if it's actually filled
        if (key === 'password' || key === 'confirmPassword') {
            if (value && value.length > 0) {
                formData.append(key, value);
            }
        } else if (value !== undefined && value !== null) {
             formData.append(key, String(value));
        }
    });
    dispatch(formData);
  };

  const handlePasswordReset = async () => {
    if (!user || !user.id) return;
    setIsResettingPassword(true);
    const result = await sendPasswordResetLinkAction(user.id);
    toast({
      title: result.success ? "Información" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    setIsResettingPassword(false);
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">{formTitle}</CardTitle>
        {formDescription && <CardDescription>{formDescription}</CardDescription>}
      </CardHeader>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="name">Nombre (Opcional)</Label>
            <Input id="name" {...register('name')} className="mt-1" />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            {state.errors?.name && <p className="text-sm text-destructive mt-1">{state.errors.name[0]}</p>}
          </div>

          <div>
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input id="email" type="email" {...register('email')} className="mt-1" disabled={!!user} />
            {!!user && <p className="text-xs text-muted-foreground mt-1">El correo electrónico no se puede cambiar después del registro.</p>}
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            {state.errors?.email && <p className="text-sm text-destructive mt-1">{state.errors.email[0]}</p>}
          </div>
          
          <div>
            <Label htmlFor="role">Rol</Label>
            <Select
              name="role"
              value={currentRole}
              onValueChange={(value) => setValue('role', value as UserRole, { shouldValidate: true })}
            >
              <SelectTrigger id="role" className="w-full mt-1">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map(roleValue => (
                  <SelectItem key={roleValue} value={roleValue}>
                    {roleValue.charAt(0).toUpperCase() + roleValue.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message}</p>}
            {state.errors?.role && <p className="text-sm text-destructive mt-1">{state.errors.role[0]}</p>}
          </div>

          <div>
            <Label htmlFor="password">{user ? 'Nueva Contraseña (opcional)' : 'Contraseña'}</Label>
            <Input id="password" type="password" {...register('password')} className="mt-1" placeholder={user ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"} />
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
            {state.errors?.password && <p className="text-sm text-destructive mt-1">{state.errors.password[0]}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPassword">{user ? 'Confirmar Nueva Contraseña' : 'Confirmar Contraseña'}</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} className="mt-1" />
            {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>}
            {state.errors?.confirmPassword && <p className="text-sm text-destructive mt-1">{state.errors.confirmPassword[0]}</p>}
          </div>
          
          {state.errors?.general && <p className="text-sm text-destructive mt-1">{state.errors.general[0]}</p>}

          {user && (
            <div className="pt-6 border-t">
              <Label className="text-base font-medium">Gestión de Contraseña</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Si el usuario ha olvidado su contraseña, puedes enviarle un enlace para restablecerla.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handlePasswordReset}
                disabled={isResettingPassword || isPending} // Updated disabled state
                className="w-full"
              >
                {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Enlace de Restablecimiento (Simulado)
              </Button>
            </div>
          )}

        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending || isResettingPassword} className="w-full">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
