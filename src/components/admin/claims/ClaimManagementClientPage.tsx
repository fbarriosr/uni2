
'use client';

import { useState } from 'react';
import type { Claim, ClaimStatus } from '@/lib/types';
import { CLAIM_STATUSES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { updateClaimStatusAction } from '@/lib/actions/claimActions';
import { ClipboardList, Filter, Loader2, ChevronsRight, CheckCircle, Info } from 'lucide-react';

interface ClaimManagementClientPageProps {
  initialClaims: Claim[];
}

export default function ClaimManagementClientPage({ initialClaims }: ClaimManagementClientPageProps) {
  const [claims, setClaims] = useState(initialClaims);
  const [filter, setFilter] = useState<'all' | ClaimStatus>('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const handleStatusChange = async (claimId: string, newStatus: ClaimStatus) => {
    setIsUpdating(claimId);
    const result = await updateClaimStatusAction(claimId, newStatus);
    if (result.success) {
      setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: newStatus } : c));
      toast({ title: "Éxito", description: result.message });
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsUpdating(null);
  };

  const filteredClaims = claims.filter(claim => filter === 'all' || claim.status === filter);

  const getStatusVariant = (status: ClaimStatus) => {
    return status === 'solucionado' ? 'default' : 'secondary';
  };

  const claimTypeTranslations: Record<Claim['type'], string> = {
    problema_app: "Problema en App",
    problema_actividad: "Problema en Actividad",
    sugerencia: "Sugerencia",
    otro: "Otro"
  };

  return (
    <>
      <div className="container mx-auto py-8">
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-headline text-foreground flex items-center gap-3">
                    <ClipboardList />
                    Gestión de Reclamos
                </h1>
                <p className="text-muted-foreground mt-1">
                    Revisa y gestiona los reclamos y sugerencias de los usuarios.
                </p>
            </div>
             <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {CLAIM_STATUSES.map(status => (
                            <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </header>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Título</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.length > 0 ? (
                filteredClaims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell>
                        <div className="font-medium">{claim.userName}</div>
                        <div className="text-xs text-muted-foreground">{claim.userEmail}</div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline">{claimTypeTranslations[claim.type]}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">{claim.title}</TableCell>
                    <TableCell className="hidden sm:table-cell">{format(parseISO(claim.createdAt), 'dd MMM yyyy', { locale: es })}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(claim.status)}>{claim.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className='flex items-center justify-end gap-1'>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedClaim(claim)}>
                                <Info className="mr-1.5 h-4 w-4" /> Ver Detalle
                            </Button>
                            {isUpdating === claim.id ? (
                                <Button variant="outline" size="sm" disabled><Loader2 className="h-4 w-4 animate-spin"/></Button>
                            ) : claim.status === 'pendiente' ? (
                                <Button variant="outline" size="sm" onClick={() => handleStatusChange(claim.id, 'solucionado')}>
                                    <CheckCircle className="mr-1.5 h-4 w-4"/> Marcar Solucionado
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => handleStatusChange(claim.id, 'pendiente')}>
                                    <ChevronsRight className="mr-1.5 h-4 w-4"/> Marcar Pendiente
                                </Button>
                            )}
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No hay reclamos que coincidan con el filtro actual.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <Dialog open={!!selectedClaim} onOpenChange={(isOpen) => !isOpen && setSelectedClaim(null)}>
        <DialogContent className="max-w-xl">
            {selectedClaim && (
                <>
                <DialogHeader>
                    <DialogTitle>{selectedClaim.title}</DialogTitle>
                    <DialogDescription>
                        Reclamo de {selectedClaim.userName} ({selectedClaim.userEmail}) el {format(parseISO(selectedClaim.createdAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", {locale: es})}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 whitespace-pre-wrap text-sm bg-muted p-4 rounded-md max-h-80 overflow-y-auto">
                    {selectedClaim.description}
                </div>
                </>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
