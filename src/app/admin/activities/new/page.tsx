
import ActivityForm from "@/components/ActivityForm";
import AuthCheck from "@/components/AuthCheck";
import { createActivityAction } from "@/lib/actions/activityActions";

export default function NewActivityPage() {
    return (
        <AuthCheck>
            <div className="container mx-auto py-8">
                <ActivityForm 
                    formAction={createActivityAction}
                    submitButtonText="Crear Actividad"
                />
            </div>
        </AuthCheck>
    );
}
