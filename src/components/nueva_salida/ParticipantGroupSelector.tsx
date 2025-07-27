'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createChildInvitationAction } from '@/lib/actions/userActions';

interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
  aiHint?: string;
}

interface ParticipantSelectorProps {
  selectedParticipantIds: string[];
  onSelectedParticipantIdsChange: (ids: string[]) => void;
}

const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({ selectedParticipantIds, onSelectedParticipantIdsChange }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [newChildName, setNewChildName] = useState('');
  const [newChildNickname, setNewChildNickname] = useState('');
  const [newChildEmail, setNewChildEmail] = useState('');
  const [newChildAvatarFile, setNewChildAvatarFile] = useState<File | null>(null);
  const [newChildAvatarPreview, setNewChildAvatarPreview] = useState<string | null>(null);
  const [newChildGender, setNewChildGender] = useState<'male' | 'female' | 'other'>('other');
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            const familyIds: string[] = data.familyMembers || [];
            const familyData: Participant[] = [];
            for (const id of familyIds) {
              const memberSnap = await getDoc(doc(db, 'users', id));
              if (memberSnap.exists()) {
                const member = memberSnap.data();
                const displayName = (member.nickname && member.nickname.trim()) ? member.nickname.trim() : (member.name || 'Sin nombre');
                familyData.push({
                  id,
                  name: displayName,
                  avatarUrl: member.avatarUrl || undefined,
                  aiHint: member.nickname || undefined,
                });
              }
            }
            setFamilyMembers(familyData);
          }
        } catch (err) {
          console.error(err);
          toast({ title: "Error", description: 'Error cargando los datos de tu familia.', variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
      }
    };
    
  useEffect(() => {
    if (!authLoading) {
      fetchUserData();
    }
  }, [user, authLoading]);

  const handleChildAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewChildAvatarFile(e.target.files[0]);
      const reader = new FileReader();
      reader.onloadend = () => setNewChildAvatarPreview(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const handleAddChild = async () => {
    if (!user) {
        toast({ title: "Error", description: 'Debes iniciar sesión para agregar un hijo.', variant: "destructive" });
        return;
    }
    if (!newChildName.trim() || !newChildEmail.trim()) {
      toast({ title: "Atención", description: 'El nombre y el correo electrónico son obligatorios.', variant: "destructive" });
      return;
    }
    if (newChildEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newChildEmail)) {
      toast({ title: "Atención", description: 'El correo electrónico no es válido', variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('parentUid', user.uid);
    formData.append('name', newChildName.trim());
    formData.append('email', newChildEmail.trim());
    formData.append('nickname', newChildNickname.trim());
    formData.append('gender', newChildGender);
    if (newChildAvatarFile) {
        formData.append('avatar', newChildAvatarFile);
    }

    const result = await createChildInvitationAction(formData);

    if (result.success) {
        toast({ title: "Éxito", description: result.message });
        await fetchUserData(); // Refresh the family members list
        resetChildForm();
        setIsAddChildModalOpen(false);
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    
    setIsLoading(false);
  };
  
  const resetChildForm = () => {
    setNewChildName('');
    setNewChildNickname('');
    setNewChildEmail('');
    setNewChildAvatarFile(null);
    setNewChildAvatarPreview(null);
    setNewChildGender('other');
  };

  const handleSelectParticipant = (id: string) => {
    const newSelection = selectedParticipantIds.includes(id)
      ? selectedParticipantIds.filter(pid => pid !== id)
      : [...selectedParticipantIds, id];
    onSelectedParticipantIdsChange(newSelection);
  };

  if (authLoading || isLoading) {
    return (
        <div className="flex gap-4 p-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <div className="h-4 w-16 bg-muted rounded-md"></div>
                </div>
            ))}
        </div>
    );
  }

  return (
    <section>
        <h3 className="text-lg font-medium mb-3 text-foreground">Selecciona tu acompañante:</h3>
        {familyMembers.length > 0 ? (
            <div className="flex flex-wrap gap-4">
            {familyMembers.map((member) => (
                <div
                key={member.id}
                onClick={() => handleSelectParticipant(member.id)}
                className={cn(
                    'flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 w-28 text-center space-y-2',
                    selectedParticipantIds.includes(member.id)
                    ? 'border-primary bg-primary/10 ring-2 ring-primary'
                    : 'border-muted hover:bg-muted/50'
                )}
                role="checkbox"
                aria-checked={selectedParticipantIds.includes(member.id)}
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectParticipant(member.id)}
                >
                <Avatar className="w-16 h-16">
                    <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.aiHint || 'participant photo'} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                        <UserIcon size={24} />
                    </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground truncate w-full">{member.name}</span>
                </div>
            ))}
            </div>
        ) : (
            <p className="text-sm text-muted-foreground">
                No has registrado a ningún hijo. ¡Añade uno para empezar a planificar!
            </p>
        )}

        <div className="flex gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsAddChildModalOpen(true)}>
            Registrar Hijo
            </Button>
        </div>

        {isAddChildModalOpen && (
            <Dialog open={isAddChildModalOpen} onOpenChange={setIsAddChildModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Registrar Nuevo Hijo</DialogTitle>
                <DialogDescription>Completa los datos para invitar a tu hijo. Recibirá un correo para crear su contraseña y activar su cuenta.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="childName" className="text-right">Nombre*</Label>
                    <Input id="childName" value={newChildName} onChange={(e) => setNewChildName(e.target.value)} className="col-span-3" placeholder="Nombre completo del hijo" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="childNickname" className="text-right">Apodo</Label>
                    <Input id="childNickname" value={newChildNickname} onChange={(e) => setNewChildNickname(e.target.value)} className="col-span-3" placeholder="Apodo para el AI" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="childEmail" className="text-right">Email*</Label>
                    <Input id="childEmail" type="email" value={newChildEmail} onChange={(e) => setNewChildEmail(e.target.value)} className="col-span-3" placeholder="Correo para iniciar sesión" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="childGender" className="text-right">Género</Label>
                    <Select value={newChildGender} onValueChange={(value) => setNewChildGender(value as 'male' | 'female' | 'other')}>
                        <SelectTrigger id="childGender" className="col-span-3">
                            <SelectValue placeholder="Seleccionar género" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="female">Femenino</SelectItem>
                            <SelectItem value="male">Masculino</SelectItem>
                            <SelectItem value="other">Otro / Prefiero no decir</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="childAvatar" className="text-right">Avatar</Label>
                    <Input id="childAvatar" type="file" onChange={handleChildAvatarChange} className="col-span-3" accept="image/*" />
                </div>
                {newChildAvatarPreview && (
                    <div className="grid grid-cols-4 items-center gap-4">
                    <div className="col-start-2 col-span-3">
                        <img src={newChildAvatarPreview} alt="Vista previa del avatar del hijo" className="h-20 w-20 rounded-full object-cover" />
                    </div>
                    </div>
                )}
                </div>
                <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddChildModalOpen(false)}>Cancelar</Button>
                <Button type="button" onClick={handleAddChild} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Invitar Hijo'}
                </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        )}
    </section>
  );
};

export default ParticipantSelector;
