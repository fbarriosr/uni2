
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminCrudForm, { FormField } from './AdminCrudForm';

interface AdminCrudPageProps {
  title: string;
  items: any[];
  columns: { accessorKey: string; header: string; type?: 'image' | 'date' | 'badge' }[];
  fields: FormField[];
  manageAction: (prevState: any, formData: FormData) => Promise<any>;
  deleteAction: (id: string) => Promise<{ success: boolean }>;
}

export default function AdminCrudPage({
  title,
  items,
  columns,
  fields,
  manageAction,
  deleteAction,
}: AdminCrudPageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const handleOpenDialog = (item: any | null = null) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedItem(null);
  };

  const renderCellContent = (item: any, column: typeof columns[0]) => {
    const value = item[column.accessorKey];
    if (column.type === 'image' && typeof value === 'string') {
        return <Image src={value} alt={item.title || 'Imagen'} width={64} height={40} className="h-10 w-16 object-cover rounded-md" />;
    }
    if (column.type === 'date' && typeof value === 'string') {
        return format(new Date(value), 'dd MMM, yyyy', { locale: es });
    }
    if (column.type === 'badge' && typeof value === 'string') {
        return <Badge variant={value === 'active' || value === 'publicada' ? 'default' : 'secondary'}>{value}</Badge>;
    }
    return value;
  };
  
  return (
    <div className="container mx-auto py-8">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-headline text-foreground flex items-center gap-3">
            Gestión de {title}
          </h1>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nuevo
        </Button>
      </header>
      
      <div className="rounded-lg border overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow>
                    {columns.map(col => <TableHead key={col.accessorKey}>{col.header}</TableHead>)}
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.length > 0 ? (
                    items.map(item => (
                        <TableRow key={item.id}>
                            {columns.map(col => (
                                <TableCell key={col.accessorKey}>{renderCellContent(item, col)}</TableCell>
                            ))}
                            <TableCell className="text-right">
                                <div className="flex justify-end items-center">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    {/* Delete button can be a separate component with confirmation */}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                            No hay elementos creados. Comienza creando uno nuevo.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                  <DialogTitle>{selectedItem ? `Editar ${title}` : `Crear ${title}`}</DialogTitle>
                  <DialogDescription>
                      {selectedItem ? 'Modifica los detalles.' : 'Completa el formulario para añadir un nuevo elemento.'}
                  </DialogDescription>
              </DialogHeader>
              <AdminCrudForm 
                item={selectedItem}
                fields={fields}
                formAction={manageAction}
                onFinished={handleCloseDialog}
              />
          </DialogContent>
      </Dialog>
    </div>
  );
}
