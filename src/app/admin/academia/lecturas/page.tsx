
import AuthCheck from '@/components/AuthCheck';
import { getSuggestedReadings } from '@/lib/data';
import AdminCrudPage from '@/components/admin/AdminCrudPage';
import { BookMarked } from 'lucide-react';
import { manageSuggestedReading, deleteSuggestedReading } from '@/lib/actions/learningActions';

export default async function AdminSuggestedReadingsPage() {
    const items = await getSuggestedReadings();
    
    const fields = [
        { id: 'title', label: 'Título', type: 'text', required: true },
        { id: 'subtitle', label: 'Subtítulo', type: 'text', required: true },
        { id: 'coverImage', label: 'Imagen de Portada', type: 'image', required: true },
        { id: 'status', label: 'Estado', type: 'select', options: ['active', 'draft'], required: true },
    ];

    const columns = [
        { accessorKey: 'coverImage', header: 'Portada', type: 'image' },
        { accessorKey: 'title', header: 'Título' },
        { accessorKey: 'subtitle', header: 'Subtítulo' },
        { accessorKey: 'status', header: 'Estado', type: 'badge' },
    ];

    return (
        <AuthCheck>
            <AdminCrudPage
                title="Lecturas Sugeridas"
                items={items}
                columns={columns}
                fields={fields}
                manageAction={manageSuggestedReading}
                deleteAction={deleteSuggestedReading}
            />
        </AuthCheck>
    );
}
