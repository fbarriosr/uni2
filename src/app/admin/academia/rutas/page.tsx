
// This file can be a template for other CRUD pages
import AuthCheck from '@/components/AuthCheck';
import { getLearningPaths } from '@/lib/data';
import AdminCrudPage from '@/components/admin/AdminCrudPage'; // A generic CRUD page component
import { GraduationCap } from 'lucide-react';
import { AppRoutes } from '@/lib/urls';
import { manageLearningPath, deleteLearningPath } from '@/lib/actions/learningActions';

export default async function AdminLearningPathsPage() {
    const paths = await getLearningPaths();
    
    const fields = [
        { id: 'title', label: 'Título', type: 'text', required: true },
        { id: 'coverImage', label: 'Imagen de Portada', type: 'image', required: true },
        { id: 'status', label: 'Estado', type: 'select', options: ['active', 'draft'], required: true },
    ];

    const columns = [
        { accessorKey: 'coverImage', header: 'Imagen', type: 'image' },
        { accessorKey: 'title', header: 'Título' },
        { accessorKey: 'status', header: 'Estado', type: 'badge' },
        { accessorKey: 'createdAt', header: 'Creado el', type: 'date' },
    ];

    return (
        <AuthCheck>
            <AdminCrudPage
                title="Rutas de Aprendizaje"
                items={paths}
                columns={columns}
                fields={fields}
                manageAction={manageLearningPath}
                deleteAction={deleteLearningPath}
            />
        </AuthCheck>
    );
}
