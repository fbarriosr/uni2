
import ClaimForm from "@/components/claims/ClaimForm";
import AuthCheck from "@/components/AuthCheck";
import { createClaimAction } from "@/lib/actions/claimActions";
import { MessageSquareQuestion } from "lucide-react";

export default function ReclamosPage() {
    return (
        <AuthCheck>
            <div className="container mx-auto py-12 px-4">
                <header className="max-w-2xl mx-auto text-center mb-10">
                    <MessageSquareQuestion className="h-14 w-14 mx-auto text-primary mb-4" />
                    <h1 className="text-4xl font-headline text-foreground">
                        Soporte y Reclamos
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Tu opinión es muy importante para nosotros. Usa este formulario para enviarnos tus reclamos, dudas o sugerencias.
                    </p>
                </header>
                <ClaimForm 
                    formAction={createClaimAction}
                    submitButtonText="Enviar Mensaje"
                />
            </div>
        </AuthCheck>
    );
}
