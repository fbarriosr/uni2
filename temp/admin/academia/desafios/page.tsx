
import AuthCheck from '@/components/AuthCheck';
import { getChallenges } from '@/lib/data';
import AdminCrudPage from '@/components/admin/AdminCrudPage';
import { Trophy } from 'lucide-react';
import { manageChallenge, deleteChallenge } from '@/lib/actions/learningActions';

export default async function AdminChallengesPage() {
    const items = await getChallenges();
    
    const fields = [
        { id: 'title', label: 'Título', type: 'text', required: true },
        { id: 'image', label: 'Imagen', type: 'image', required: true },
        { id: 'period', label: 'Periodicidad', type: 'select', options: ['weekly', 'monthly'], required: true },
        { id: 'status', label: 'Estado', type: 'select', options: ['active', 'draft'], required: true },
    ];

    const columns = [
        { accessorKey: 'image', header: 'Imagen', type: 'image' },
        { accessorKey: 'title', header: 'Título' },
        { accessorKey: 'period', header: 'Periodicidad', type: 'badge' },
        { accessorKey: 'status', header: 'Estado', type: 'badge' },
        { accessorKey: 'createdAt', header: 'Creado el', type: 'date' },
    ];

    return (
        <AuthCheck>
            <AdminCrudPage
                title="Desafíos"
                items={items}
                columns={columns}
                fields={fields}
                manageAction={manageChallenge}
                deleteAction={deleteChallenge}
            />
        </AuthCheck>
    );
}
