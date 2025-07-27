
import AuthCheck from '@/components/AuthCheck';
import { getArticles } from '@/lib/data';
import AdminCrudPage from '@/components/admin/AdminCrudPage';
import { FileText } from 'lucide-react';
import { manageArticle, deleteArticle } from '@/lib/actions/learningActions';

export default async function AdminArticlesPage() {
    const items = await getArticles();
    
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
                title="Artículos"
                items={items}
                columns={columns}
                fields={fields}
                manageAction={manageArticle}
                deleteAction={deleteArticle}
            />
        </AuthCheck>
    );
}
