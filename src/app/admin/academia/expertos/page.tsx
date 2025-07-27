
import AuthCheck from '@/components/AuthCheck';
import { getExperts } from '@/lib/data';
import AdminCrudPage from '@/components/admin/AdminCrudPage';
import { Star } from 'lucide-react';
import { manageExpert, deleteExpert } from '@/lib/actions/learningActions';

export default async function AdminExpertsPage() {
    const items = await getExperts();
    
    const fields = [
        { id: 'name', label: 'Nombre', type: 'text', required: true },
        { id: 'specialty', label: 'Especialidad', type: 'text', required: true },
        { id: 'photo', label: 'Foto', type: 'image', required: false },
        { id: 'lugar_de_trabajo', label: 'Lugar de Trabajo', type: 'text' },
        { id: 'horario', label: 'Horario', type: 'text' },
        { id: 'sitio_web', label: 'Sitio Web', type: 'text' },
        { id: 'descripcion', label: 'Descripción', type: 'textarea' },
        { id: 'trayectoria', label: 'Trayectoria', type: 'textarea' },
        { id: 'comentario_ia', label: 'Comentario IA', type: 'textarea' },
        { id: 'comentarios_padres', label: 'Comentarios de Padres (uno por línea)', type: 'textarea' },
    ];

    const columns = [
        { accessorKey: 'photo', header: 'Foto', type: 'image' },
        { accessorKey: 'name', header: 'Nombre' },
        { accessorKey: 'specialty', header: 'Especialidad' },
    ];

    return (
        <AuthCheck>
            <AdminCrudPage
                title="Expertos de la Academia"
                items={items}
                columns={columns}
                fields={fields}
                manageAction={manageExpert}
                deleteAction={deleteExpert}
            />
        </AuthCheck>
    );
}
