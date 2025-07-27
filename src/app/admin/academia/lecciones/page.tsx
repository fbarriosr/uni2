
import AuthCheck from '@/components/AuthCheck';
import { getMicroLessons } from '@/lib/data';
import AdminCrudPage from '@/components/admin/AdminCrudPage';
import { BookOpen } from 'lucide-react';
import { manageMicroLesson, deleteMicroLesson } from '@/lib/actions/learningActions';

export default async function AdminMicroLessonsPage() {
    const items = await getMicroLessons();
    
    const fields = [
        { id: 'title', label: 'Título', type: 'text', required: true },
        { id: 'description', label: 'Descripción', type: 'textarea', required: true },
        { id: 'image', label: 'Imagen', type: 'image', required: false },
        { id: 'status', label: 'Estado', type: 'select', options: ['active', 'draft'], required: true },
    ];

    const columns = [
        { accessorKey: 'image', header: 'Imagen', type: 'image' },
        { accessorKey: 'title', header: 'Título' },
        { accessorKey: 'status', header: 'Estado', type: 'badge' },
        { accessorKey: 'createdAt', header: 'Creado el', type: 'date' },
    ];

    return (
        <AuthCheck>
            <AdminCrudPage
                title="Micro-Lecciones"
                items={items}
                columns={columns}
                fields={fields}
                manageAction={manageMicroLesson}
                deleteAction={deleteMicroLesson}
            />
        </AuthCheck>
    );
}
