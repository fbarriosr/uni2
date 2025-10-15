
import UserForm from "@/components/UserForm";
import AuthCheck from "@/components/AuthCheck";
import { getUserById } from "@/lib/data";
import { updateUserAction } from "@/lib/actions/userActions";
import { notFound } from "next/navigation";

interface EditUserPageProps {
    params: { id: string };
}

export default async function EditUserPage({ params }: EditUserPageProps) {
    const id = params.id;
    const user = await getUserById(id);

    if (!user) {
        notFound();
    }

    // Bind the user ID to the server action
    const updateUserWithId = updateUserAction.bind(null, id);

    return (
        <AuthCheck>
            <div className="container mx-auto py-8">
                <UserForm 
                    user={user}
                    formAction={updateUserWithId}
                    submitButtonText="Actualizar Usuario"
                    formTitle="Editar Usuario"
                    formDescription={`Editando el perfil de ${user.name || user.email}.`}
                />
            </div>
        </AuthCheck>
    );
}
