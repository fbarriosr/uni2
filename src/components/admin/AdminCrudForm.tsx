
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'image' | 'select';
    required?: boolean;
    options?: string[];
}

interface AdminCrudFormProps {
    item: any | null;
    fields: FormField[];
    formAction: (prevState: any, formData: FormData) => Promise<any>;
    onFinished: () => void;
}

export default function AdminCrudForm({ item, fields, formAction, onFinished }: AdminCrudFormProps) {
    const { toast } = useToast();
    const initialState = { message: '', success: false };
    const [state, dispatch, isPending] = useActionState(formAction, initialState);
    
    const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? "Éxito" : "Error",
                description: state.message,
                variant: state.success ? "default" : "destructive",
            });
            if (state.success) {
                onFinished();
            }
        }
    }, [state, toast, onFinished]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
        const file = e.target.files?.[0];
        if (file) {
            setImagePreviews(prev => ({...prev, [fieldId]: URL.createObjectURL(file)}));
        }
    }

    return (
        <form action={dispatch} className="space-y-4 py-4">
            {item?.id && <input type="hidden" name="id" value={item.id} />}
            
            {fields.map(field => (
                <div key={field.id}>
                    <Label htmlFor={field.id}>{field.label}{field.required && '*'}</Label>
                    {field.type === 'text' && (
                        <Input id={field.id} name={field.id} defaultValue={item?.[field.id] || ''} className="mt-1" />
                    )}
                    {field.type === 'textarea' && (
                        <Textarea id={field.id} name={field.id} defaultValue={item?.[field.id] || ''} className="mt-1" />
                    )}
                    {field.type === 'select' && (
                        <Select name={field.id} defaultValue={item?.[field.id] || field.options?.[0]}>
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    {field.type === 'image' && (
                        <div className="mt-1">
                            <Input id={field.id} name={field.id} type="file" accept="image/*" onChange={(e) => handleImageChange(e, field.id)} />
                            {(imagePreviews[field.id] || item?.[field.id]) && (
                                <div className="mt-2">
                                     <Image src={imagePreviews[field.id] || item?.[field.id]} alt="Preview" width={128} height={128} className="h-32 w-auto object-contain rounded-md border" />
                                     <input type="hidden" name={`existing${field.id.charAt(0).toUpperCase() + field.id.slice(1)}`} value={item?.[field.id]} />
                                </div>
                            )}
                        </div>
                    )}
                    {state.errors?.[field.id] && <p className="text-sm text-destructive mt-1">{state.errors[field.id][0]}</p>}
                </div>
            ))}

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onFinished}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar
                </Button>
            </div>
        </form>
    );
}
