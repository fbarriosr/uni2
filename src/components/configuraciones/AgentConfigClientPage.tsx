
'use client';

import { useState } from 'react';
import type { Agent } from '@/lib/types';
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
import { Bot, PlusCircle, Edit } from 'lucide-react';
import Image from 'next/image';
import AgentForm from './AgentForm';
import DeleteAgentButton from './DeleteAgentButton';

interface AgentConfigClientPageProps {
  initialAgents: Agent[];
}

export default function AgentConfigClientPage({ initialAgents }: AgentConfigClientPageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const handleOpenDialog = (agent: Agent | null = null) => {
    setSelectedAgent(agent);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedAgent(null);
  };

  return (
    <>
      <div className="container mx-auto py-8">
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-headline text-foreground flex items-center gap-3">
                    <Bot />
                    Configuración de Agentes de IA
                </h1>
                <p className="text-muted-foreground mt-1">
                    Crea, edita y elimina los asistentes de IA de tu aplicación.
                </p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Nuevo Agente
            </Button>
        </header>

        <div className="rounded-lg border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Ícono</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialAgents.length > 0 ? (
                        initialAgents.map((agent) => (
                            <TableRow key={agent.id}>
                                <TableCell>
                                    <Image src={agent.icono_principal} alt={agent.nombre} width={40} height={40} className="rounded-full" />
                                </TableCell>
                                <TableCell className="font-medium">{agent.nombre}</TableCell>
                                <TableCell className="text-muted-foreground">{agent.rol}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end items-center">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(agent)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <DeleteAgentButton agentId={agent.id} agentName={agent.nombre} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No hay agentes creados. Comienza creando uno nuevo.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                  <DialogTitle>{selectedAgent ? 'Editar Agente' : 'Crear Nuevo Agente'}</DialogTitle>
                  <DialogDescription>
                      {selectedAgent ? 'Modifica los detalles de este agente.' : 'Completa el formulario para añadir un nuevo asistente de IA.'}
                  </DialogDescription>
              </DialogHeader>
              <AgentForm agent={selectedAgent} onFinished={handleCloseDialog} />
          </DialogContent>
      </Dialog>
    </>
  );
}
