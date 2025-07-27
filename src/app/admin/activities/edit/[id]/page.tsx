
import ActivityForm from "@/components/ActivityForm";
import AuthCheck from "@/components/AuthCheck";
import { getActivityById } from "@/lib/data";
import { updateActivityAction } from "@/lib/actions/activityActions";
import { notFound } from "next/navigation";

interface EditActivityPageProps {
    params: { id: string };
}

export default async function EditActivityPage({ params }: EditActivityPageProps) {
    const id = params.id;
    const activity = await getActivityById(id);

    if (!activity) {
        notFound();
    }

    const updateActivityWithId = updateActivityAction.bind(null, id);

    return (
        <AuthCheck>
            <div className="container mx-auto py-8">
                <ActivityForm 
                    activity={activity}
                    formAction={updateActivityWithId}
                    submitButtonText="Actualizar Actividad"
                />
            </div>
        </AuthCheck>
    );
}
