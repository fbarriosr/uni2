

'use client';

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserById, getUsersByIds } from '@/lib/data';
import type { User, UserRole } from '@/lib/types';
import { Loader2, PlusCircle, User as UserIcon, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { createChildInvitationAction, createFriendInvitationAction } from '@/lib/actions/userActions';
import DeleteFamilyMemberButton from './DeleteFamilyMemberButton';

export default function FamiliaClientPage() {
    const { toast } = useToast();
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [appUser, setAppUser] = useState<User | null>(null); // This will hold the PARENT user data for context
    const [loggedInUserRole, setLoggedInUserRole] = useState<UserRole | null>(null);
    const [familyMembers, setFamilyMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
    const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [newChildName, setNewChildName] = useState('');
    const [newChildNickname, setNewChildNickname] = useState('');
    const [newChildEmail, setNewChildEmail] = useState('');
    const [newChildAvatarFile, setNewChildAvatarFile] = useState<File | null>(null);
    const [newChildAvatarPreview, setNewChildAvatarPreview] = useState<string | null>(null);
    const [newChildGender, setNewChildGender] = useState<'male' | 'female' | 'other'>('other');

    const [newFriendName, setNewFriendName] = useState('');
    const [newFriendEmail, setNewFriendEmail] = useState('');
    const [newFriendRole, setNewFriendRole] = useState('');
    const [newFriendAvatarFile, setNewFriendAvatarFile] = useState<File | null>(null);
    const [newFriendAvatarPreview, setNewFriendAvatarPreview] = useState<string | null>(null);

    const fetchFamilyData = useCallback(async (uid: string) => {
        setLoading(true);
        try {
            const loggedInUser = await getUserById(uid);
            if (!loggedInUser) {
              setLoading(false);
              toast({ title: "Error", description: "No se pudo cargar la información del usuario.", variant: "destructive"});
              return;
            }

            setLoggedInUserRole(loggedInUser.role);
            
            const familyHeadUid = loggedInUser.role === 'hijo' || loggedInUser.role === 'amigo' ? loggedInUser.parentUid : uid;

            if (!familyHeadUid) {
                setAppUser(loggedInUser); 
                setFamilyMembers([]);
                setLoading(false);
                return;
            }
            
            const parentData = await getUserById(familyHeadUid);

            if (!parentData) {
                toast({ title: "Error", description: 'No se pudo encontrar la información familiar.', variant: "destructive" });
                setLoading(false);
                return;
            }

            setAppUser(parentData);

            const allMemberIds = parentData.familyMembers ? [parentData.id, ...parentData.familyMembers] : [parentData.id];
            const uniqueMemberIds = Array.from(new Set(allMemberIds));

            const membersToDisplay = uniqueMemberIds.length > 0 ? await getUsersByIds(uniqueMemberIds) : [];
            
            setFamilyMembers(membersToDisplay);

        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: 'Error al cargar los datos de tu familia.', variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchFamilyData(currentUser.uid);
            } else {
                setUser(null);
                setAppUser(null);
                setFamilyMembers([]);
                setLoggedInUserRole(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [fetchFamilyData]);

    const handleChildAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewChildAvatarFile(e.target.files[0]);
            const reader = new FileReader();
            reader.onloadend = () => setNewChildAvatarPreview(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleFriendAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewFriendAvatarFile(e.target.files[0]);
            const reader = new FileReader();
            reader.onloadend = () => setNewFriendAvatarPreview(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };
  
    const handleAddChild = async () => {
        if (!user) { toast({ title: "Error", description: 'Debes iniciar sesión para agregar un hijo.', variant: "destructive" }); return; }
        if (!newChildName.trim() || !newChildEmail.trim()) { toast({ title: "Atención", description: 'El nombre y el correo electrónico son obligatorios.', variant: "destructive" }); return; }
        if (newChildEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newChildEmail)) { toast({ title: "Atención", description: 'El correo electrónico no es válido', variant: "destructive" }); return; }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('parentUid', user.uid);
        formData.append('name', newChildName.trim());
        formData.append('email', newChildEmail.trim());
        formData.append('nickname', newChildNickname.trim());
        formData.append('gender', newChildGender);
        if (newChildAvatarFile) formData.append('avatar', newChildAvatarFile);

        const result = await createChildInvitationAction(formData);
        if (result.success) {
            toast({ title: "Éxito", description: result.message });
            await fetchFamilyData(user.uid);
            resetChildForm();
            setIsAddChildModalOpen(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    const handleAddFriend = async () => {
        if (!user) { toast({ title: "Error", description: 'Debes iniciar sesión para agregar un amigo.', variant: "destructive" }); return; }
        if (!newFriendName.trim() || !newFriendEmail.trim() || !newFriendRole.trim()) { toast({ title: "Atención", description: 'Nombre, correo y rol son obligatorios.', variant: "destructive" }); return; }
        if (newFriendEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newFriendEmail)) { toast({ title: "Atención", description: 'El correo electrónico no es válido', variant: "destructive" }); return; }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('parentUid', user.uid);
        formData.append('name', newFriendName.trim());
        formData.append('email', newFriendEmail.trim());
        formData.append('role', newFriendRole.trim());
        if (newFriendAvatarFile) formData.append('avatar', newFriendAvatarFile);

        const result = await createFriendInvitationAction(formData);
        if (result.success) {
            toast({ title: "Éxito", description: result.message });
            await fetchFamilyData(user.uid);
            resetFriendForm();
            setIsAddFriendModalOpen(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsSubmitting(false);
    }

    const resetChildForm = () => {
        setNewChildName(''); setNewChildNickname(''); setNewChildEmail(''); setNewChildAvatarFile(null); setNewChildAvatarPreview(null); setNewChildGender('other');
    };
    const resetFriendForm = () => {
        setNewFriendName(''); setNewFriendEmail(''); setNewFriendRole(''); setNewFriendAvatarFile(null); setNewFriendAvatarPreview(null);
    };

    if (loading) return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

    const getRoleBadge = (role: UserRole, nickname?: string) => {
        if (role === 'user') return <Badge variant="outline">Padre/Madre</Badge>;
        if (role === 'hijo') return <Badge variant="secondary">Hijo/a</Badge>;
        if (role === 'amigo') return <Badge variant="outline" className="border-blue-500 text-blue-500">{nickname || 'Amigo/a'}</Badge>;
        return <Badge variant="secondary">{role}</Badge>;
    }


    return (
        <div className="container mx-auto py-8">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-headline text-foreground">Gestión Familiar</h1>
                    <p className="text-muted-foreground mt-1">Añade o administra los miembros de tu grupo familiar.</p>
                </div>
                {loggedInUserRole !== 'hijo' && loggedInUserRole !== 'amigo' && (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsAddFriendModalOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invitar Amigo
                    </Button>
                    <Button onClick={() => setIsAddChildModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Invitar Hijo
                    </Button>
                  </div>
                )}
            </header>

            <div className="space-y-4">
                {familyMembers.length > 0 ? (
                    familyMembers.map(member => (
                        <Card key={member.id} className="flex flex-col md:flex-row md:items-center p-4 gap-4">
                            <div className="flex items-center w-full md:w-auto">
                                <Avatar className="h-16 w-16 mr-4">
                                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                                    <AvatarFallback><UserIcon /></AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <p className="font-bold text-lg">{member.nickname && member.role !== 'amigo' ? member.nickname : member.name}</p>
                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between w-full md:w-auto md:ml-auto gap-4">
                                <div className="flex flex-col items-start md:items-end gap-1">
                                    {getRoleBadge(member.role, member.nickname)}
                                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                                        {member.status === 'active' ? 'Activo' : 'Invitado'}
                                    </Badge>
                                </div>
                                {(loggedInUserRole === 'user' || loggedInUserRole === 'admin') && appUser && member.id !== appUser.id ? (
                                <DeleteFamilyMemberButton 
                                    parentUid={appUser.id} 
                                    childUid={member.id} 
                                    childName={member.name || 'miembro'}
                                />
                                ) : (
                                    <div className="w-10 h-10" /> // Placeholder for alignment
                                )}
                            </div>
                        </Card>
                    ))
                ) : (
                    <p className="text-center text-muted-foreground py-10">No has añadido ningún miembro a tu familia.</p>
                )}
            </div>

            {/* Add Child Modal */}
            <Dialog open={isAddChildModalOpen} onOpenChange={setIsAddChildModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Invitar Nuevo Hijo</DialogTitle>
                        <DialogDescription>Completa los datos para invitar a tu hijo. Recibirá un correo para crear su contraseña y activar su cuenta.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="childName" className="text-right">Nombre*</Label><Input id="childName" value={newChildName} onChange={(e) => setNewChildName(e.target.value)} className="col-span-3" placeholder="Nombre completo del hijo" /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="childNickname" className="text-right">Apodo</Label><Input id="childNickname" value={newChildNickname} onChange={(e) => setNewChildNickname(e.target.value)} className="col-span-3" placeholder="Apodo para el AI" /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="childEmail" className="text-right">Email*</Label><Input id="childEmail" type="email" value={newChildEmail} onChange={(e) => setNewChildEmail(e.target.value)} className="col-span-3" placeholder="Correo para iniciar sesión" /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="childGender" className="text-right">Género</Label><Select value={newChildGender} onValueChange={(value) => setNewChildGender(value as any)}><SelectTrigger id="childGender" className="col-span-3"><SelectValue placeholder="Seleccionar género" /></SelectTrigger><SelectContent><SelectItem value="female">Femenino</SelectItem><SelectItem value="male">Masculino</SelectItem><SelectItem value="other">Otro</SelectItem></SelectContent></Select></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="childAvatar" className="text-right">Avatar</Label><Input id="childAvatar" type="file" onChange={handleChildAvatarChange} className="col-span-3" accept="image/*" /></div>
                        {newChildAvatarPreview && (<div className="grid grid-cols-4 items-center gap-4"><div className="col-start-2 col-span-3"><img src={newChildAvatarPreview} alt="Avatar preview" className="h-20 w-20 rounded-full object-cover" /></div></div>)}
                    </div>
                    <DialogFooter><Button type="button" variant="outline" onClick={() => setIsAddChildModalOpen(false)}>Cancelar</Button><Button type="button" onClick={handleAddChild} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Invitar Hijo'}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Friend Modal */}
            <Dialog open={isAddFriendModalOpen} onOpenChange={setIsAddFriendModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Invitar Amigo o Familiar</DialogTitle>
                        <DialogDescription>Invita a otra persona a ver y participar en los planes, como una pareja, abuela, tía, etc.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="friendName" className="text-right">Nombre*</Label><Input id="friendName" value={newFriendName} onChange={(e) => setNewFriendName(e.target.value)} className="col-span-3" placeholder="Nombre completo" /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="friendEmail" className="text-right">Email*</Label><Input id="friendEmail" type="email" value={newFriendEmail} onChange={(e) => setNewFriendEmail(e.target.value)} className="col-span-3" placeholder="Correo para iniciar sesión" /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="friendRole" className="text-right">Rol*</Label><Input id="friendRole" value={newFriendRole} onChange={(e) => setNewFriendRole(e.target.value)} className="col-span-3" placeholder="Ej: Pareja, Abuela, Amigo" /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="friendAvatar" className="text-right">Avatar</Label><Input id="friendAvatar" type="file" onChange={handleFriendAvatarChange} className="col-span-3" accept="image/*" /></div>
                        {newFriendAvatarPreview && (<div className="grid grid-cols-4 items-center gap-4"><div className="col-start-2 col-span-3"><img src={newFriendAvatarPreview} alt="Avatar preview" className="h-20 w-20 rounded-full object-cover" /></div></div>)}
                    </div>
                    <DialogFooter><Button type="button" variant="outline" onClick={() => setIsAddFriendModalOpen(false)}>Cancelar</Button><Button type="button" onClick={handleAddFriend} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Invitar Amigo'}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
