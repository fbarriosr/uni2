
'use client';

import { useState, useMemo } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, User as UserIcon, Users, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { AppRoutes } from '@/lib/urls';
import DeleteUserButton from '@/components/admin/DeleteUserButton';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { USER_ROLES } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';


interface UsersClientPageProps {
  initialUsers: User[];
}

const UserCard = ({ user }: { user: User }) => (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-card border">
        <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatarUrl} alt={user.name || 'Avatar'} />
            <AvatarFallback><UserIcon size={20} /></AvatarFallback>
        </Avatar>
        <div className='flex-grow overflow-hidden'>
           <p className="text-md font-semibold leading-tight truncate">{user.name || 'Sin Nombre'}</p>
           <p className="text-sm text-muted-foreground truncate">{user.email}</p>
           <div className="mt-1">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                    Rol: {user.role}
                </Badge>
           </div>
        </div>
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
                <Link href={AppRoutes.admin.editUser(user.id)}>
                    <Edit className="mr-1.5 h-3 w-3" />
                    Editar
                </Link>
            </Button>
            <DeleteUserButton userId={user.id} userName={user.name || user.email || 'usuario'} />
        </div>
    </div>
);


export default function UsersClientPage({ initialUsers }: UsersClientPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredFamilies = useMemo(() => {
    return initialUsers.filter(family => {
        const familyHead = family; // The parent is the main object
        const members = family.members || [];
        
        const headMatch = (familyHead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          familyHead.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
                          (roleFilter === 'all' || familyHead.role === roleFilter);
        
        if (headMatch) return true;

        const memberMatch = members.some(member => 
            (member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             member.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
             (roleFilter === 'all' || member.role === roleFilter)
        );

        return memberMatch;
    });
  }, [initialUsers, searchTerm, roleFilter]);

  return (
    <div className="container mx-auto py-8">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline text-foreground">Gestión de Usuarios y Familias</h1>
            <p className="text-muted-foreground mt-1">Crea usuarios y organiza los grupos familiares.</p>
          </div>
          <Button asChild>
              <Link href={AppRoutes.admin.newUser}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Usuario
              </Link>
          </Button>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Buscar por nombre o correo en todas las familias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {USER_ROLES.map(role => (
                <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      <Accordion type="multiple" className="w-full space-y-4">
        {filteredFamilies.length > 0 ? (
          filteredFamilies.map((family) => (
            <AccordionItem key={family.id} value={family.id} className="border-b-0">
                <Card className="overflow-hidden">
                    <AccordionTrigger className="p-0 hover:no-underline">
                        <div className="flex items-center gap-4 p-4 w-full">
                             <Avatar className="h-16 w-16">
                                <AvatarImage src={family.avatarUrl} alt={family.name || 'Avatar'} />
                                <AvatarFallback><UserIcon size={24} /></AvatarFallback>
                            </Avatar>
                            <div className='flex-grow overflow-hidden text-left'>
                               <p className="text-lg font-bold leading-tight truncate">{family.name || 'Sin Nombre'}</p>
                               <p className="text-sm text-muted-foreground truncate">{family.email}</p>
                            </div>
                            <div className="flex items-center gap-4 ml-auto">
                                <Badge variant={family.role === 'admin' ? 'destructive' : 'default'} className="hidden sm:inline-flex">
                                    <Users className="mr-1.5 h-3 w-3" />
                                    Familia de {family.members?.length || 0}
                                </Badge>
                                 <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                                        <Link href={AppRoutes.admin.editUser(family.id)}>
                                            <Edit className="mr-1.5 h-3 w-3" />
                                            Editar
                                        </Link>
                                    </Button>
                                    <DeleteUserButton userId={family.id} userName={family.name || family.email || 'usuario'} />
                                </div>
                                <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200")} />
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className={cn("bg-muted/50", (family.members?.length || 0) === 0 && 'py-0')}>
                        {(family.members?.length || 0) > 0 ? (
                            <div className="p-4 space-y-3">
                                <h4 className="font-semibold text-sm text-muted-foreground ml-1">Miembros de la familia:</h4>
                                {family.members?.map(member => (
                                    <UserCard key={member.id} user={member} />
                                ))}
                            </div>
                        ) : (
                             <p className="text-center text-muted-foreground text-sm p-6">Esta familia aún no tiene miembros invitados.</p>
                        )}
                    </AccordionContent>
                </Card>
            </AccordionItem>
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
            <p className="text-muted-foreground">No se encontraron familias o usuarios con los filtros actuales.</p>
          </div>
        )}
      </Accordion>
    </div>
  );
}
