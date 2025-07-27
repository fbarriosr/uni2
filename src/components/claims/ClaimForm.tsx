
'use client';

import { useActionState, useEffect, useState } from 'react';
import type { ClaimFormState } from '@/lib/actions/claimActions';
import { CLAIM_TYPES, type ClaimType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserById } from '@/lib/data';
import type { User } from '@/lib/types';

interface ClaimFormProps {
  formAction: (prevState: ClaimFormState, formData: FormData) => Promise<ClaimFormState>;
  submitButtonText: string;
}

export default function ClaimForm({ formAction, submitButtonText }: ClaimFormProps) {
  const { toast } = useToast();
  const initialState: ClaimFormState = { message: '', success: false };
  const [state, dispatch, isPending] = useActionState(formAction, initialState);
  
  const [claimType, setClaimType] = useState<ClaimType | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const appUser = await getUserById(user.uid);
            setCurrentUser(appUser || null);
        } else {
            setCurrentUser(null);
        }
        setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Mensaje Enviado' : 'Error en el Formulario',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        setClaimType('');
        setTitle('');
        setDescription('');
      }
    }
  }, [state, toast]);

  const customSubmitAction = (formData: FormData) => {
    if (!currentUser) {
        toast({ title: "Error", description: "Debes iniciar sesión para enviar un reclamo.", variant: "destructive" });
        return;
    }
    formData.append('userId', currentUser.id);
    formData.append('userName', currentUser.name || 'N/A');
    formData.append('userEmail', currentUser.email || 'N/A');
    dispatch(formData);
  };
  
  if (authLoading) {
      return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
  }

  const claimTypeTranslations: Record<ClaimType, string> = {
    problema_app: "Problema con la App",
    problema_actividad: "Problema con una Actividad",
    sugerencia: "Sugerencia de Mejora",
    otro: "Otro Motivo"
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-primary/20">
      <form action={customSubmitAction}>
        <CardContent className="p-6 space-y-6">
          <div>
            <Label htmlFor="type">Tipo de Mensaje</Label>
            <Select name="type" value={claimType} onValueChange={(value: ClaimType) => setClaimType(value)}>
              <SelectTrigger id="type" className="w-full mt-1">
                <SelectValue placeholder="Selecciona el motivo de tu mensaje..." />
              </SelectTrigger>
              <SelectContent>
                {CLAIM_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {claimTypeTranslations[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.errors?.type && <p className="text-sm text-destructive mt-1">{state.errors.type[0]}</p>}
          </div>

          <div>
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Un breve resumen de tu mensaje" className="mt-1" />
            {state.errors?.title && <p className="text-sm text-destructive mt-1">{state.errors.title[0]}</p>}
          </div>
          
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Por favor, detalla tu reclamo o sugerencia aquí." rows={6} className="mt-1" />
            {state.errors?.description && <p className="text-sm text-destructive mt-1">{state.errors.description[0]}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending || !currentUser} className="w-full">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
