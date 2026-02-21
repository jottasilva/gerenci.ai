import { useNavigate } from 'react-router-dom';
import { Rocket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';

interface UpgradePromptProps {
    open: boolean;
    onClose: () => void;
    message?: string;
    currentCount?: number;
    limit?: number;
    plan?: string;
}

export function UpgradePrompt({
    open,
    onClose,
    message,
    currentCount,
    limit,
    plan,
}: UpgradePromptProps) {
    const navigate = useNavigate();

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <span className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <Rocket className="h-4 w-4 text-amber-500" />
                        </span>
                        Limite do plano atingido
                    </DialogTitle>
                    <DialogDescription asChild>
                        <div className="space-y-3 pt-2">
                            <p className="text-sm text-muted-foreground">
                                {message ?? `Seu plano ${plan ?? 'atual'} não permite esta ação.`}
                            </p>

                            {limit !== undefined && currentCount !== undefined && (
                                <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Uso atual</span>
                                        <span className="font-semibold text-foreground">{currentCount} / {limit}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-amber-500 transition-all"
                                            style={{ width: `${Math.min(100, (currentCount / limit) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-3 mt-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => { onClose(); navigate('/assinaturas'); }}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
                    >
                        <Rocket className="h-4 w-4 mr-2" />
                        Ver planos
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
