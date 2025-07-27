
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { LogIn, Loader2, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Import the auth instance
import { AppRoutes } from '@/lib/urls'; // Import AppRoutes
import { signInWithEmailAndPassword, sendPasswordResetEmail, type AuthError } from 'firebase/auth';

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
      // Signed in 
      const user = userCredential.user;
      toast({
        title: '¡Inicio de Sesión Exitoso!',
        description: `Bienvenido de nuevo, ${user.email}.`,
      });
      // console.log('Firebase User:', user); // Line removed
      router.push('/inicio'); // Redirect to inicio page
    } catch (error) {
      let errorTitle = 'Error de Inicio de Sesión';
      let errorMessage = 'Ocurrió un error inesperado al intentar iniciar sesión.';

      if (error instanceof Error && 'code' in error) {
        // It's likely a FirebaseError or AuthError
        const authError = error as AuthError; // Cast to AuthError to access specific codes
        // console.error('Login error (Firebase AuthError):', authError.code, authError.message); // Line removed
        
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
        // Handle non-Firebase errors or errors without a 'code' property
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
  
  // Effect to clear password field if email changes, for example.
  // This is optional and depends on desired UX.
  const emailForEffect = form.watch('email');
  useEffect(() => {
    // form.setValue('password', ''); // Example: clear password if email changes
  }, [emailForEffect, form]);

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height,4rem)-var(--footer-height,8rem)-1px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <LogIn className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-3xl font-headline">Iniciar Sesión</CardTitle>
          <CardDescription>
            Accede a tu cuenta para gestionar tus actividades.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
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
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...form.register('password')}
                disabled={isLoading}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="text-sm">
                <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="link" type="button" className="p-0 h-auto font-medium text-primary hover:underline">
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
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Ingresar
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Link
                href="/register" 
                href={AppRoutes.register} // Use AppRoutes for the link
                className="font-medium text-primary hover:underline" // Line removed
              >
                Regístrate
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
