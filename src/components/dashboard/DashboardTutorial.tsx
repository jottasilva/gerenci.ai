import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight, ChevronLeft, LayoutDashboard,
    ShoppingCart, Package, Users, Lightbulb, Zap,
    AlertTriangle, ShoppingBag
} from "lucide-react";

interface Step {
    title: string;
    description: string;
    icon: any;
    color: string;
    target?: string; // CSS selector of the element to highlight
}

const steps: Step[] = [
    {
        title: "Bem-vindo ao Gerenc.AI! 🚀",
        description: "Este é o seu novo painel de controle. Aqui você gerencia vendas, estoque e clientes em um só lugar, de forma integrada com o WhatsApp.",
        icon: Zap,
        color: "text-yellow-500",
    },
    {
        title: "Métricas do Dia 📊",
        description: "Acompanhe seu desempenho em tempo real. Estes cards mostram as vendas, pedidos e o ticket médio especificamente de HOJE.",
        icon: LayoutDashboard,
        color: "text-primary",
        target: ".grid-cols-4", // Highlights the KPI grid
    },
    {
        title: "Atenção Necessária ⚠️",
        description: "Fique de olho nos alertas de estoque. O sistema avisa automaticamente o que precisa de reposição urgente.",
        icon: AlertTriangle,
        color: "text-destructive",
        target: ".min-h-\\[300px\\]", // Highlights the Alerts card
    },
    {
        title: "Visão por Categoria 📈",
        description: "Entenda quais nichos estão trazendo mais faturamento. Note que simplificamos o visual para você focar no que importa.",
        icon: Package,
        color: "text-orange-500",
        target: ".lg\\:col-span-2", // Highlights the Bar chart card
    },
    {
        title: "Últimas Operações 🛒",
        description: "Acompanhe os pedidos mais recentes. Clique em qualquer linha para ver detalhes, alterar status ou cancelar.",
        icon: ShoppingBag,
        color: "text-purple-500",
        target: ".overflow-x-auto", // Highlights the Recent Orders table
    },
];

interface DashboardTutorialProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    forceShow?: boolean;
}

export function DashboardTutorial({ open: externalOpen, onOpenChange: setExternalOpen, forceShow = false }: DashboardTutorialProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [internalOpen, setInternalOpen] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const setOpen = setExternalOpen || setInternalOpen;

    useEffect(() => {
        const hasSeen = localStorage.getItem('dashboard_tutorial_seen');
        if (!hasSeen || forceShow) {
            setOpen(true);
        }
    }, [forceShow]);

    // Track the target element position for highlighting
    useEffect(() => {
        if (open && steps[currentStep].target) {
            const el = document.querySelector(steps[currentStep].target!);
            if (el) {
                setHighlightRect(el.getBoundingClientRect());
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setHighlightRect(null);
            }
        } else {
            setHighlightRect(null);
        }
    }, [open, currentStep]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem('dashboard_tutorial_seen', 'true');
        }
        setOpen(false);
        setCurrentStep(0);
    };

    const StepIcon = steps[currentStep].icon;

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            {/* Dark Overlay with Hole */}
            <div className="absolute inset-0 bg-black/60 pointer-events-auto transition-all duration-500" style={{
                clipPath: highlightRect ? `polygon(0% 0%, 0% 100%, ${highlightRect.left}px 100%, ${highlightRect.left}px ${highlightRect.top}px, ${highlightRect.right}px ${highlightRect.top}px, ${highlightRect.right}px ${highlightRect.bottom}px, ${highlightRect.left}px ${highlightRect.bottom}px, ${highlightRect.left}px 100%, 100% 100%, 100% 0%)` : 'none'
            }} />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative bg-background border border-border shadow-2xl rounded-[2rem] overflow-hidden flex flex-col pointer-events-auto"
                style={{ width: '60vw', height: '50vh', maxWidth: '800px', maxHeight: '500px' }}
            >
                <div className="flex-1 flex flex-col md:flex-row h-full">
                    {/* Visual Side */}
                    <div className="w-full md:w-2/5 bg-primary/5 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-primary/10">
                        <motion.div
                            key={currentStep}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`h-24 w-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center mb-6 ${steps[currentStep].color}`}
                        >
                            <StepIcon className="h-12 w-12" />
                        </motion.div>
                        <div className="flex gap-2">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-primary' : 'w-2 bg-primary/20'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="flex-1 p-8 flex flex-col justify-between">
                        <div className="space-y-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    <h2 className="text-3xl font-display font-black text-foreground">
                                        {steps[currentStep].title}
                                    </h2>
                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                        {steps[currentStep].description}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
                                <Checkbox
                                    id="dontShow"
                                    checked={dontShowAgain}
                                    onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
                                />
                                <label
                                    htmlFor="dontShow"
                                    className="text-sm font-bold leading-none cursor-pointer text-muted-foreground"
                                >
                                    Não mostrar novamente ao entrar
                                </label>
                            </div>

                            <div className="flex justify-between items-center gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={handlePrev}
                                    disabled={currentStep === 0}
                                    className="rounded-xl font-bold h-12 px-6"
                                >
                                    <ChevronLeft className="mr-2 h-5 w-5" /> Voltar
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    className="rounded-xl px-10 font-bold bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg shadow-lg shadow-primary/20"
                                >
                                    {currentStep === steps.length - 1 ? 'Começar Agora!' : 'Próximo'}
                                    {currentStep < steps.length - 1 && <ChevronRight className="ml-2 h-5 w-5" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
