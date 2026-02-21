import { useState } from 'react';
import { useGetBillingStatus, useGetPlans, billingService, SubscriptionPlan } from '@/services/billing.service';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Zap, Star, Crown, Rocket, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PLAN_META: Record<string, { icon: React.ElementType; gradient: string; border: string; badge?: string }> = {
    basico: {
        icon: Zap,
        gradient: 'from-emerald-500/10 to-teal-500/5',
        border: 'border-emerald-500/20',
    },
    pro: {
        icon: Star,
        gradient: 'from-blue-500/15 to-indigo-500/10',
        border: 'border-blue-500/40',
        badge: 'MAIS POPULAR',
    },
    enterprise: {
        icon: Crown,
        gradient: 'from-purple-500/10 to-violet-500/5',
        border: 'border-purple-500/25',
    },
};

function UsageMeter({ label, current, limit }: { label: string; current: number; limit: number }) {
    const unlimited = limit === -1;
    const pct = unlimited ? 0 : Math.min(100, Math.round((current / limit) * 100));
    const isWarning = !unlimited && pct >= 80;

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{label}</span>
                <span className={cn('font-medium', isWarning ? 'text-amber-500' : 'text-foreground')}>
                    {current} / {unlimited ? '∞' : limit}
                </span>
            </div>
            {!unlimited && (
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                        className={cn('h-full rounded-full transition-all', isWarning ? 'bg-amber-500' : 'bg-primary')}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function PlanCard({
    plan,
    currentPlanSlug,
    isOnTrial,
    onSubscribe,
    loading,
}: {
    plan: SubscriptionPlan;
    currentPlanSlug?: string;
    isOnTrial: boolean;
    onSubscribe: (slug: string) => void;
    loading: boolean;
}) {
    const meta = PLAN_META[plan.slug] ?? { icon: Star, gradient: '', border: '' };
    const Icon = meta.icon;
    const isCurrent = !isOnTrial && currentPlanSlug === plan.slug;
    const isHighlighted = plan.is_highlighted;
    const price = parseFloat(plan.price);

    return (
        <div className={cn(
            'relative flex flex-col rounded-2xl border p-6 bg-card transition-all duration-200',
            `bg-gradient-to-br ${meta.gradient}`,
            meta.border,
            isHighlighted && 'scale-[1.02] shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/30',
            isCurrent && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        )}>
            {/* MOST POPULAR badge */}
            {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white tracking-widest shadow-lg">
                        MAIS POPULAR
                    </span>
                </div>
            )}

            {/* Current plan indicator */}
            {isCurrent && (
                <div className="absolute -top-3 right-4">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground tracking-widest shadow">
                        SEU PLANO
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center',
                            plan.slug === 'basico' ? 'bg-emerald-500/10 text-emerald-500' :
                                plan.slug === 'pro' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400')}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
            </div>

            {/* Price */}
            <div className="mb-6">
                <div className="flex items-baseline gap-1">
                    <span className="text-xs text-muted-foreground">R$</span>
                    <span className="text-4xl font-black text-foreground">{price.toFixed(0)}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                </div>
            </div>

            {/* Features */}
            <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <div className={cn('h-4.5 w-4.5 rounded-full flex items-center justify-center shrink-0',
                            plan.slug === 'basico' ? 'bg-emerald-500/10 text-emerald-500' :
                                plan.slug === 'pro' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400')}>
                            <Check className="h-3 w-3" />
                        </div>
                        {feature}
                    </li>
                ))}
            </ul>

            {/* CTA */}
            <Button
                onClick={() => onSubscribe(plan.slug)}
                disabled={isCurrent || loading}
                className={cn(
                    'w-full h-11 font-semibold rounded-xl',
                    isHighlighted
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0'
                        : isCurrent
                            ? 'bg-muted text-muted-foreground cursor-default'
                            : '',
                )}
                variant={isHighlighted ? 'default' : isCurrent ? 'outline' : 'outline'}
            >
                {isCurrent ? 'Plano atual' : isOnTrial ? 'Começar com este plano' : 'Migrar para este plano'}
            </Button>
        </div>
    );
}

export default function Assinaturas() {
    const queryClient = useQueryClient();
    const { data: billing, isLoading: loadingBilling } = useGetBillingStatus();
    const { data: plans = [], isLoading: loadingPlans } = useGetPlans();
    const [subscribing, setSubscribing] = useState(false);

    const subscription = billing?.subscription;
    const usage = billing?.usage;
    const warnings = billing?.warnings ?? {};

    const isOnTrial = subscription?.status === 'trial';
    const daysRemaining = subscription?.days_remaining;
    const currentPlanSlug = subscription?.plan?.slug;

    const handleSubscribe = async (planSlug: string) => {
        try {
            setSubscribing(true);
            await billingService.subscribe(planSlug);
            await queryClient.invalidateQueries({ queryKey: ['billing-status'] });
            toast.success('Plano alterado com sucesso!');
        } catch {
            toast.error('Erro ao alterar plano. Tente novamente.');
        } finally {
            setSubscribing(false);
        }
    };

    return (
        <div className="p-6 space-y-8 max-w-5xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Assinatura</h1>
                <p className="text-muted-foreground mt-1">Gerencie seu plano e acompanhe seu uso.</p>
            </div>

            {/* Trial banner */}
            {isOnTrial && (
                <div className="flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4">
                    <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-amber-500">
                            Trial gratuito — {daysRemaining ?? 0} dias restantes
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Escolha um plano antes do trial expirar para manter acesso a todos os recursos.
                        </p>
                    </div>
                </div>
            )}

            {/* Warnings */}
            {Object.keys(warnings).length > 0 && (
                <div className="flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-500">Limites próximos (80%+)</p>
                        <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            {Object.entries(warnings).map(([key, w]) => (
                                <li key={key}>• {key.replace('max_', '').replace('_', ' ')}: {w.current}/{w.limit} ({w.pct}%)</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Subscription Details overview */}
            {subscription && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border rounded-2xl shadow-sm overflow-hidden bg-card">
                        <CardHeader className="bg-muted/10 pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" /> Detalhes da Assinatura
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Situação:</span>
                                <Badge className={cn(
                                    "font-bold px-2 py-0.5 rounded-full text-[10px] uppercase",
                                    subscription.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                                        subscription.status === 'trial' ? 'bg-amber-500/10 text-amber-500' : 'bg-destructive/10 text-destructive'
                                )}>
                                    {subscription.status === 'active' ? 'Ativo' :
                                        subscription.status === 'trial' ? 'Período Trial' : 'Cancelado'}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm border-t border-border/50 pt-3">
                                <span className="text-muted-foreground font-medium">Iniciada em:</span>
                                <span className="font-semibold text-foreground">{new Date(subscription.start_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-t border-border/50 pt-3">
                                <span className="text-muted-foreground font-medium">Próxima Renovação:</span>
                                <span className="font-semibold text-foreground">
                                    {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() :
                                        subscription.trial_end ? new Date(subscription.trial_end).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border rounded-2xl shadow-sm overflow-hidden bg-primary/[0.03] border-primary/20">
                        <CardHeader className="bg-primary/5 pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                                <Rocket className="h-4 w-4" /> Contagem para Renovação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 flex flex-col items-center justify-center h-[120px]">
                            <div className="text-center">
                                <p className="text-4xl font-black text-primary leading-none">{daysRemaining ?? 0}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Dias Restantes</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Plan cards */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-6">Escolha seu plano</h2>
                {loadingPlans ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="h-96 rounded-2xl border border-border bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        {plans.map(plan => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                currentPlanSlug={currentPlanSlug}
                                isOnTrial={isOnTrial ?? false}
                                onSubscribe={handleSubscribe}
                                loading={subscribing}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Feature comparison table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <h2 className="font-semibold text-sm text-foreground">Comparação de recursos</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-xs text-muted-foreground">
                                <th className="text-left px-5 py-3 font-medium">Recurso</th>
                                <th className="text-center px-5 py-3 font-medium">Básico</th>
                                <th className="text-center px-5 py-3 font-medium text-blue-400">Pro</th>
                                <th className="text-center px-5 py-3 font-medium text-purple-400">Enterprise</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {[
                                ['Produtos', '500', 'Ilimitado', 'Ilimitado'],
                                ['Operadores', '2', '10', 'Ilimitado'],
                                ['Números WhatsApp', '1', '3', 'Ilimitado'],
                                ['Relatórios avançados', '—', '✓', '✓'],
                                ['Multi-loja', '—', '—', '✓'],
                                ['Acesso API', '—', '—', '✓'],
                                ['Suporte prioritário', '—', '✓', '✓'],
                                ['Suporte dedicado', '—', '—', '✓'],
                                ['SLA garantido', '—', '—', '✓'],
                            ].map(([feature, basico, pro, enterprise], i) => (
                                <tr key={i} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-5 py-3 text-muted-foreground">{feature}</td>
                                    <td className="px-5 py-3 text-center text-xs font-medium">{basico}</td>
                                    <td className="px-5 py-3 text-center text-xs font-medium text-blue-400">{pro}</td>
                                    <td className="px-5 py-3 text-center text-xs font-medium text-purple-400">{enterprise}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Key Activation */}
            <Card className="border-border rounded-2xl shadow-sm overflow-hidden bg-card border-primary/20">
                <CardHeader className="bg-primary/5 pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-primary" /> Ativar Chave de Acesso
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Se você possui uma chave de licença, insira-a abaixo para ativar seu plano.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Ex: ABCD-1234-EFGH"
                            className="flex-1 h-10 px-4 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                            id="license-key-input"
                        />
                        <Button
                            onClick={async () => {
                                const input = document.getElementById('license-key-input') as HTMLInputElement;
                                if (!input.value) {
                                    toast.error('Informe o código da chave.');
                                    return;
                                }
                                try {
                                    const res = await billingService.activateKey(input.value);
                                    toast.success(`${res.message} Plano ${res.plan} ativado!`);
                                    input.value = '';
                                    queryClient.invalidateQueries({ queryKey: ['billing-status'] });
                                } catch (err: any) {
                                    toast.error(err.response?.data?.error || 'Erro ao ativar chave.');
                                }
                            }}
                            className="rounded-xl h-10 px-6 font-bold"
                        >
                            Ativar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
