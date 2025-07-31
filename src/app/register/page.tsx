
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, ChangeEvent } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { finalizeRegistration } from '@/lib/actions/userActions';
import { AppRoutes } from '@/lib/urls';

const registerSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  confirmPassword: z.string().min(6, { message: 'La confirmación de contraseña debe tener al menos 6 caracteres.' }),
  nickname: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      nickname: '',
    },
  });

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setAvatarFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Step 1: Create user in Firebase Authentication on the client
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Step 2: Call server action to finalize registration in Firestore
      const formData = new FormData();
      formData.append('uid', user.uid);
      formData.append('email', user.email!);
      formData.append('name', data.name);
      if (data.nickname) formData.append('nickname', data.nickname);
      if (avatarFile) formData.append('avatar', avatarFile);

      const result = await finalizeRegistration(formData);

      if (result.success) {
        toast({
          title: '¡Registro Exitoso!',
          description: result.message || `Bienvenido, ${data.name}. Ahora puedes iniciar sesión.`,
        });
        router.push('/login');
      } else {
        throw new Error(result.message || 'Error al guardar los datos del usuario.');
      }

    } catch (error) {
      let errorMessage = 'Ocurrió un error inesperado durante el registro.';
      if (error instanceof Error) {
        if ('code' in error) {
          const authError = error as AuthError;
          switch (authError.code) {
            case 'auth/email-already-in-use':
              errorMessage = 'Este correo electrónico ya está en uso.';
              break;
            case 'auth/invalid-email':
              errorMessage = 'El formato del correo electrónico no es válido.';
              break;
            case 'auth/weak-password':
              errorMessage = 'La contraseña es demasiado débil.';
              break;
            default:
              errorMessage = `Error: ${authError.message}`;
          }
        } else {
            errorMessage = error.message;
        }
      }

      console.error('Registration error:', error);
      toast({
        title: 'Error de Registro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full lg:grid lg:grid-cols-2">
       <div className="hidden bg-muted lg:block">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Fbanner.jpg?alt=media&token=c72a3498-445f-4efc-b68e-df52660c87a8"
          alt="Image"
          width="1920"
          height="1080"
          data-ai-hint="family having fun"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[380px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Crear Cuenta</h1>
            <p className="text-balance text-muted-foreground">
              Ingresa tus datos para empezar a crear recuerdos.
            </p>
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
             <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                {...form.register('name')}
                disabled={isLoading}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
             <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                {...form.register('email')}
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" {...form.register('password')} disabled={isLoading} />
                    {form.formState.errors.password && (
                        <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.password.message}
                        </p>
                    )}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input id="confirmPassword" type="password" {...form.register('confirmPassword')} disabled={isLoading} />
                     {form.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.confirmPassword.message}
                        </p>
                    )}
                </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Registrarme
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href={AppRoutes.login} className="underline">
              Inicia Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
