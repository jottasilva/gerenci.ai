import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full" />
                        <ShieldAlert className="h-24 w-24 text-destructive relative" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Acesso Restrito</h1>
                    <p className="text-muted-foreground text-lg">
                        Desculpe! Você não tem as permissões necessárias para acessar esta página.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Button>
                    <Button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2"
                    >
                        <Home className="h-4 w-4" />
                        Início
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
