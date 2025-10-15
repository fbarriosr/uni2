
import UserForm from "@/components/UserForm";
import AuthCheck from "@/components/AuthCheck";
import { registerUserAction } from "@/lib/actions/userActions";

export default function NewUserPage() {
    return (
        <AuthCheck>
            <div className="container mx-auto py-8">
                <UserForm 
                    formAction={registerUserAction}
                    submitButtonText="Crear Usuario"
                    formTitle="Crear Nuevo Usuario"
                    formDescription="Crea una nueva cuenta de usuario y asígnale un rol."
                />
            </div>
        </AuthCheck>
    );
}
