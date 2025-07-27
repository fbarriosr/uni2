
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserById } from "@/lib/data";
import { updateUser, deleteAddress, setActiveAddress } from "@/lib/actions/userActions";
import type { User, Address } from '@/lib/types';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarIcon, Loader2, Palette, Type, Home, Pencil, Trash2, MapPin, CheckCircle, PlusCircle, Bot } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/ThemeContext";
import AddressForm from "@/components/configuraciones/AddressForm";
import { AppRoutes } from "@/lib/urls";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";


const themes = [
    { id: 'light', label: 'Claro', bg: 'hsl(220 17% 96%)', primary: 'hsl(217 91% 60%)', accent: 'hsl(49 97% 53%)' },
    { id: 'dark', label: 'Oscuro', bg: 'hsl(222 47% 11%)', primary: 'hsl(217 91% 60%)', accent: 'hsl(49 97% 53%)' },
    { id: 'forest', label: 'Bosque', bg: 'hsl(43 67% 96%)', primary: 'hsl(115 31% 32%)', accent: 'hsl(45 100% 51%)' },
    { id: 'space', label: 'Espacio', bg: 'hsl(216 36% 8%)', primary: 'hsl(203 92% 60%)', accent: 'hsl(292 90% 73%)' },
    { id: 'beach', label: 'Playa', bg: 'hsl(48 100% 95%)', primary: 'hsl(178 51% 46%)', accent: 'hsl(25 95% 53%)' },
    { id: 'superhero', label: 'Superhéroe', bg: 'hsl(220 13% 91%)', primary: 'hsl(0 72% 51%)', accent: 'hsl(45 96% 56%)' },
    { id: 'bedtime', label: 'Nocturno', bg: 'hsl(229 23% 22%)', primary: 'hsl(254 91% 76%)', accent: 'hsl(156 72% 67%)' },
];

const fontPairs = [
    { id: 'nunito-inter', label: 'Moderno', headingFont: 'Nunito Sans', bodyFont: 'Inter' },
    { id: 'poppins-lato', label: 'Amigable', headingFont: 'Poppins', bodyFont: 'Lato' },
    { id: 'playfair-montserrat', label: 'Elegante', headingFont: 'Playfair Display', bodyFont: 'Montserrat' },
];

export default function ConfiguracionesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme: selectedTheme, setTheme, fontPair: selectedFontPair, setFontPair } = useTheme();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState<Date>();

  // State for Address Management
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const fetchUser = async (uid: string) => {
    const appUser = await getUserById(uid);
    if (appUser) {
      setCurrentUser(appUser);
      setName(appUser.name || "");
      if (appUser.birthday) setBirthday(new Date(appUser.birthday));
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUser(user.uid);
      } else {
        router.push(AppRoutes.login);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (currentUser) {
      setIsSubmitting(true);
      const updateData: Partial<User> = { name };
      if (birthday) updateData.birthday = birthday.toISOString();
      const result = await updateUser(currentUser.id, updateData);
      if (result) toast({ title: "Éxito", description: "Tu perfil ha sido actualizado." });
      else toast({ title: "Error", description: "No se pudo actualizar tu perfil.", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const handleOpenAddressModal = (address: Address | null) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };
  
  const handleAddressAction = (action: Promise<{success: boolean, message: string}>) => {
    startTransition(async () => {
        const result = await action;
        toast({
            title: result.success ? "Éxito" : "Error",
            description: result.message,
            variant: result.success ? "default" : "destructive",
        });
        if (result.success && currentUser) {
            await fetchUser(currentUser.id);
        }
    });
  };
  
  const handleDeleteAddress = (addressId: string) => {
    if (!currentUser) return;
    handleAddressAction(deleteAddress(currentUser.id, addressId));
  };
  
  const handleSetActiveAddress = (addressId: string) => {
    if (!currentUser || currentUser.activeAddressId === addressId) return;
    handleAddressAction(setActiveAddress(currentUser.id, addressId));
  };


  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (!currentUser) return <div>Error al cargar los datos del usuario.</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-headline text-foreground mb-8">Configuraciones</h1>
      <div className="grid gap-12 max-w-4xl">
        
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Datos Personales</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting}/>
              </div>
              <div>
                <Label htmlFor="birthday">Fecha de Nacimiento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal mt-1", !birthday && "text-muted-foreground")} disabled={isSubmitting}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {birthday ? format(birthday, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={birthday} onSelect={setBirthday} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus fromYear={new Date().getFullYear() - 100} toYear={new Date().getFullYear()} captionLayout="dropdown-buttons" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" value={currentUser.email || ""} disabled />
              </div>
              <div>
                <Label htmlFor="role">Rol</Label>
                <Input id="role" type="text" value={currentUser.role || ""} disabled />
              </div>
            </CardContent>
            <CardContent className="flex justify-end">
              <Button size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Datos Personales
              </Button>
            </CardContent>
          </Card>
        </form>

        <Separator />

        <section id="addresses">
            <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Mis Domicilios</CardTitle>
                    <Button onClick={() => handleOpenAddressModal(null)}>
                      <PlusCircle className="mr-2 h-4 w-4"/> Agregar Domicilio
                    </Button>
                  </div>
                  <CardDescription>Gestiona tus ubicaciones para obtener mejores recomendaciones.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isTransitioning && <div className="absolute inset-0 bg-background/50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                  {currentUser.addresses && currentUser.addresses.length > 0 ? (
                    currentUser.addresses.map(addr => (
                      <div key={addr.id} className={cn("flex items-center gap-4 p-4 rounded-lg border", currentUser.activeAddressId === addr.id ? "bg-primary/10 border-primary" : "bg-card")}>
                        <Home className={cn("h-6 w-6 shrink-0", currentUser.activeAddressId === addr.id ? "text-primary" : "text-muted-foreground")}/>
                        <div className="flex-grow">
                          <p className="font-semibold text-foreground">{addr.name}</p>
                          <p className="text-sm text-muted-foreground">{addr.address}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {currentUser.activeAddressId === addr.id ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 pointer-events-none">
                              <CheckCircle className="mr-1.5 h-4 w-4"/>
                              Activo
                            </Badge>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleSetActiveAddress(addr.id)}>
                              <CheckCircle className="mr-1.5 h-4 w-4"/> Activar
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleOpenAddressModal(addr)}><Pencil className="h-4 w-4"/></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteAddress(addr.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No has agregado ningún domicilio.</p>
                  )}
                </CardContent>
            </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Apariencia</CardTitle>
            <CardDescription>Los cambios de tema y fuente se guardan automáticamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3"><Palette /> Tema de Color</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {themes.map(theme => (
                  <button key={theme.id} type="button" onClick={() => setTheme(theme.id)} className={cn("text-center rounded-lg p-2 border-2 transition-all", selectedTheme === theme.id ? 'border-primary ring-2 ring-primary' : 'border-transparent hover:border-border')}>
                    <div className="h-16 w-full rounded-md shadow-inner" style={{backgroundColor: theme.bg}}>
                        <div className="flex -space-x-2 items-center justify-center h-full">
                          <div className="h-8 w-8 rounded-full border-2 border-white" style={{backgroundColor: theme.primary}}></div>
                          <div className="h-8 w-8 rounded-full border-2 border-white" style={{backgroundColor: theme.accent}}></div>
                        </div>
                    </div>
                    <p className="text-sm font-medium mt-2">{theme.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3"><Type /> Combinación de Fuentes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {fontPairs.map(pair => (
                  <button key={pair.id} type="button" onClick={() => setFontPair(pair.id)} className={cn("p-4 border-2 rounded-lg text-left transition-all", selectedFontPair === pair.id ? 'border-primary ring-2 ring-primary' : 'border-transparent hover:border-border')}>
                    <p className="text-xs text-muted-foreground">{pair.label}</p>
                    <p className="text-2xl" style={{ fontFamily: pair.headingFont }}>Título</p>
                    <p className="text-sm" style={{ fontFamily: pair.bodyFont }}>Cuerpo de texto.</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
      </div>

       <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
          <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                  <DialogTitle>{editingAddress ? 'Editar Domicilio' : 'Agregar Nuevo Domicilio'}</DialogTitle>
                  <DialogDescription>
                      Ingresa una dirección y ajústala en el mapa para mayor precisión.
                  </DialogDescription>
              </DialogHeader>
              <AddressForm 
                  userId={currentUser.id}
                  address={editingAddress}
                  onFinished={async () => {
                      setIsAddressModalOpen(false);
                      await fetchUser(currentUser.id);
                  }}
              />
          </DialogContent>
      </Dialog>
    </div>
  );
}
