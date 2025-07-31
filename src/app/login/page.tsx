
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { LogIn, Loader2, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { AppRoutes } from '@/lib/urls';
import { signInWithEmailAndPassword, sendPasswordResetEmail, type AuthError } from 'firebase/auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordResetLoading, setIsPasswordResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      toast({
        title: '¡Inicio de Sesión Exitoso!',
        description: `Bienvenido de nuevo, ${user.email}.`,
      });
      router.push('/inicio');
    } catch (error) {
      let errorTitle = 'Error de Inicio de Sesión';
      let errorMessage = 'Ocurrió un error inesperado al intentar iniciar sesión.';

      if (error instanceof Error && 'code' in error) {
        const authError = error as AuthError;
        switch (authError.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Correo electrónico o contraseña incorrectos. Por favor, verifica tus credenciales.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El formato del correo electrónico no es válido.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Esta cuenta de usuario ha sido deshabilitada.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Se ha bloqueado el acceso a esta cuenta debido a actividad inusual. Inténtalo de nuevo más tarde.';
            break;
          default:
            errorMessage = `Error al iniciar sesión. Si el problema persiste, contacta a soporte. Código: ${authError.code}`;
        }
      } else {
        console.error('Login error (Non-Firebase or unknown structure):', error);
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({ title: "Correo Requerido", description: "Por favor, ingresa tu correo electrónico.", variant: "destructive" });
      return;
    }
    setIsPasswordResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: "Enlace Enviado",
        description: "Si existe una cuenta con ese correo, se ha enviado un enlace para restablecer la contraseña.",
      });
      setIsResetDialogOpen(false);
      setResetEmail('');
    } catch (error) {
      const authError = error as AuthError;
      console.error("Password reset error:", authError);
      let resetErrorMessage = "No se pudo enviar el enlace. Verifica el correo e inténtalo de nuevo.";
      if (authError.code === 'auth/invalid-email') {
        resetErrorMessage = "El formato del correo electrónico no es válido.";
      } else if (authError.code === 'auth/user-not-found') {
        resetErrorMessage = "No hay ninguna cuenta registrada con este correo electrónico.";
      }
      toast({
        title: "Error al Restablecer",
        description: resetErrorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPasswordResetLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-[calc(100vh_-_var(--header-height))] lg:grid-cols-2 xl:min-h-[calc(100vh_-_var(--header-height))]">
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Funo.jpg?alt=media&token=84eec251-46c8-47ca-b31f-3eb9886c8af7"
          alt="Image"
          width="1920"
          height="1080"
          data-ai-hint="family having fun"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Iniciar Sesión</h1>
            <p className="text-balance text-muted-foreground">
              Ingresa tu correo para acceder a tu cuenta
            </p>
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Contraseña</Label>
                <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="link" type="button" className="ml-auto inline-block text-sm underline p-0 h-auto">
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </AlertDialogTrigger>
                   <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                        <KeyRound className="mr-2 h-5 w-5" /> Restablecer Contraseña
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                        <br />
                        <strong className="text-xs text-foreground">Si es tu primera vez iniciando sesión como hijo, usa esta opción para crear tu contraseña.</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                       <Label htmlFor="reset-email" className="sr-only">Correo electrónico para restablecimiento</Label>
                       <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="reset-email"
                            type="email"
                            placeholder="tu@correo.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            disabled={isPasswordResetLoading}
                            className="pl-9"
                        />
                       </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isPasswordResetLoading}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePasswordReset} disabled={isPasswordResetLoading}>
                        {isPasswordResetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enviar Enlace
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <Input id="password" type="password" {...form.register('password')} disabled={isLoading} />
               {form.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{" "}
            <Link href={AppRoutes.register} className="underline">
              Regístrate
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
