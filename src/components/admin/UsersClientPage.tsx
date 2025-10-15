
'use client';

import { useState } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { AppRoutes } from '@/lib/urls';
import DeleteUserButton from '@/components/admin/DeleteUserButton';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { USER_ROLES } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


interface UsersClientPageProps {
  initialUsers: User[];
}

export default function UsersClientPage({ initialUsers }: UsersClientPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = initialUsers.filter(user => {
    const searchMatch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = roleFilter === 'all' || user.role === roleFilter;
    return searchMatch && roleMatch;
  });

  return (
    <div className="container mx-auto py-8">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground mt-1">Crea, edita y administra los usuarios y sus roles.</p>
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
          placeholder="Buscar por nombre o correo..."
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Card key={user.id} className="flex flex-col transition-shadow hover:shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                            <AvatarImage src={user.avatarUrl} alt={user.name || 'Avatar'} />
                            <AvatarFallback><UserIcon size={24} /></AvatarFallback>
                        </Avatar>
                        <div className='flex-grow overflow-hidden'>
                           <CardTitle className="text-lg font-semibold leading-tight truncate">{user.name || 'Sin Nombre'}</CardTitle>
                           <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        Rol: {user.role}
                    </Badge>
                </CardContent>
                <CardFooter className="p-2 border-t bg-muted/50 flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={AppRoutes.admin.editUser(user.id)}>
                            <Edit className="mr-1.5 h-3 w-3" />
                            Editar
                        </Link>
                    </Button>
                    <DeleteUserButton userId={user.id} userName={user.name || user.email || 'usuario'} />
                </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
            <p className="text-muted-foreground">No se encontraron usuarios con los filtros actuales.</p>
          </div>
        )}
      </div>
    </div>
  );
}
