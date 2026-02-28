import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, X, ArrowRight, ShieldCheck } from "lucide-react";

export const CookieBanner = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if user already accepted
        const accepted = localStorage.getItem("lgpd_consent");
        if (!accepted) {
            const timer = setTimeout(() => setShow(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("lgpd_consent", "true");
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in fade-in slide-in-from-bottom-10 duration-500">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col md:flex-row items-center p-6 md:p-8 gap-6 md:gap-8 relative lg:pr-12">

                    <button
                        onClick={() => setShow(false)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="hidden md:flex flex-shrink-0 h-16 w-16 bg-indigo-100 rounded-2xl items-center justify-center">
                        <ShieldCheck className="h-10 w-10 text-indigo-600" />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <Shield className="h-4 w-4 text-indigo-600 md:hidden" />
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sua privacidade importa</h2>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                            Nossa plataforma utiliza apenas cookies essenciais para garantir que você tenha a melhor experiência possível.
                            Ao continuar, você aceita nossa{" "}
                            <Link to="/privacidade" className="font-semibold text-indigo-600 hover:underline">Política de Privacidade</Link> e{" "}
                            <Link to="/termos" className="font-semibold text-indigo-600 hover:underline">Termos de Uso</Link>.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="rounded-xl px-6 h-12 border-slate-200 text-slate-700 hover:bg-slate-50"
                            onClick={() => setShow(false)}
                        >
                            Configurar
                        </Button>
                        <Button
                            className="rounded-xl px-8 h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 group transition-all"
                            onClick={handleAccept}
                        >
                            Entendido
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
