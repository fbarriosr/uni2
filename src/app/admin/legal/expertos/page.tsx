
import AuthCheck from '@/components/AuthCheck';
import { getLegalExperts } from '@/lib/data';
import AdminCrudPage from '@/components/admin/AdminCrudPage';
import { Gavel } from 'lucide-react';
import { manageLegalExpert, deleteLegalExpert } from '@/lib/actions/learningActions';

export default async function AdminLegalExpertsPage() {
    const items = await getLegalExperts();
    
    const fields = [
        { id: 'name', label: 'Nombre', type: 'text', required: true },
        { id: 'specialty', label: 'Especialidad Principal', type: 'text', required: true },
        { id: 'photo', label: 'Foto', type: 'image', required: false },
        { id: 'lugar_de_trabajo', label: 'Estudio Jurídico / Lugar de Trabajo', type: 'text' },
        { id: 'horario', label: 'Horario de Consulta', type: 'text' },
        { id: 'sitio_web', label: 'Sitio Web o Perfil de LinkedIn', type: 'text' },
        { id: 'descripcion', label: 'Biografía / Descripción', type: 'textarea' },
        { id: 'areas_de_practica', label: 'Otras Áreas de Práctica (una por línea)', type: 'textarea' },
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
                title="Expertos Legales"
                items={items}
                columns={columns}
                fields={fields}
                manageAction={manageLegalExpert}
                deleteAction={deleteLegalExpert}
            />
        </AuthCheck>
    );
}
