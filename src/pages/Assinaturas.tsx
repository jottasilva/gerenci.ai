import { useState } from 'react';
import {
    Rocket,
    CheckCircle2,
    ShieldCheck,
    Clock,
    Zap,
    History,
    Key,
    Plus,
    RefreshCcw,
    BarChart3,
    Users2,
    Package2,
    Smartphone,
    Info,
    Search,
    Trash2,
    Copy,
    Edit,
    AlertCircle,
    Layers,
    CreditCard,
    ChevronRight,
    KeySquare,
    Check,
    Star,
    Crown,
    AlertTriangle,
    TrendingUp,
    Settings,
    LayoutDashboard
} from 'lucide-react';
import {
    useGetBillingStatus,
    useGetPlans,
    useGetLicenseKeys,
    useGenerateLicenseKey,
    useDeleteLicenseKey,
    useRenewLicenseKey,
    usePlanMutations,
    billingService,
    SubscriptionPlan
} from '@/services/billing.service';
import { authService } from '@/services/auth.service';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

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
    free: {
        icon: Rocket,
        gradient: 'from-gray-500/10 to-slate-500/5',
        border: 'border-gray-500/20',
    },
};

function UsageCard({ title, current, limit, icon }: { title: string; current: number; limit: number; icon: React.ReactNode }) {
    const unlimited = limit === -1;
    const percentage = unlimited ? 0 : Math.min(100, Math.round((current / limit) * 100));
    const isWarning = !unlimited && percentage >= 80;

    return (
        <Card className="rounded-2xl shadow-sm border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {icon} {title}
                </CardTitle>
                {unlimited && (
                    <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">
                        ILIMITADO
                    </Badge>
                )}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {current} <span className="text-sm text-muted-foreground">/ {unlimited ? '∞' : limit}</span>
                </div>
                {!unlimited && (
                    <Progress value={percentage} className="mt-2 h-2" indicatorClassName={isWarning ? 'bg-amber-500' : 'bg-primary'} />
                )}
                {!unlimited && (
                    <p className={cn("text-xs text-muted-foreground mt-1", isWarning && "text-amber-500")}>
                        {percentage}% utilizado
                    </p>
                )}
            </CardContent>
        </Card>
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
    const price = parseFloat(plan.price as any);

    return (
        <div className={cn(
            'relative flex flex-col rounded-2xl border p-6 bg-card transition-all duration-200 h-full',
            `bg-gradient-to-br ${meta.gradient}`,
            meta.border,
            isHighlighted && 'scale-[1.02] shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/30',
            isCurrent && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        )}>
            {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white tracking-widest shadow-lg">
                        MAIS POPULAR
                    </span>
                </div>
            )}

            {isCurrent && (
                <div className="absolute -top-3 right-4">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground tracking-widest shadow">
                        SEU PLANO
                    </span>
                </div>
            )}

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

            <div className="mb-6">
                <div className="flex items-baseline gap-1">
                    <span className="text-xs text-muted-foreground">R$</span>
                    <span className="text-4xl font-black text-foreground">{price.toFixed(0)}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                </div>
            </div>

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
    const { data: billing, isLoading: loadingStatus } = useGetBillingStatus();
    const { data: plans = [], isLoading: loadingPlans } = useGetPlans();
    const user = authService.getCurrentUser();
    const isAdmin = user?.role === 'ADMIN';

    const { data: keys = [], refetch: refetchKeys } = useGetLicenseKeys();
    const generateKeyMutation = useGenerateLicenseKey();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('subscription');
    const [subscribing, setSubscribing] = useState(false);
    const [activationKey, setActivationKey] = useState('');
    const [keysPage, setKeysPage] = useState(1);
    const keysPerPage = 5;

    // Mutations
    const deleteKeyMutation = useDeleteLicenseKey();
    const renewKeyMutation = useRenewLicenseKey();
    const planMutations = usePlanMutations();

    // Plan Management Dialog State
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
    const [planFormData, setPlanFormData] = useState<Partial<SubscriptionPlan>>({
        name: '',
        description: '',
        price: '0.00',
        is_active: true,
        is_highlighted: false,
        features: [],
        limits: {
            max_products: 50,
            max_operators: 1,
            max_managers: 1,
            max_whatsapp: 1
        }
    });

    const openPlanDialog = (plan?: SubscriptionPlan) => {
        if (plan) {
            setEditingPlan(plan);
            setPlanFormData(plan);
        } else {
            setEditingPlan(null);
            setPlanFormData({
                name: '',
                slug: 'basico',
                description: '',
                price: '0.00',
                is_active: true,
                is_highlighted: false,
                features: [],
                limits: {
                    max_products: 50,
                    max_operators: 1,
                    max_managers: 1,
                    max_whatsapp: 1
                }
            });
        }
        setIsPlanDialogOpen(true);
    };

    const handleSavePlan = async () => {
        try {
            if (editingPlan) {
                await planMutations.update.mutateAsync({ id: editingPlan.id, data: planFormData });
                toast.success('Plano atualizado!');
            } else {
                await planMutations.create.mutateAsync(planFormData);
                toast.success('Plano criado!');
            }
            setIsPlanDialogOpen(false);
        } catch (err) {
            toast.error('Erro ao salvar plano.');
        }
    };

    const handleDeletePlan = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este plano? Todos os clientes vinculados perderão acesso se não houver um plano reserva.')) return;
        try {
            await planMutations.delete.mutateAsync(id);
            toast.success('Plano excluído!');
        } catch (err) {
            toast.error('Erro ao excluir plano.');
        }
    };

    // Admin key generation form state
    const [adminSelectedPlan, setAdminSelectedPlan] = useState<string>('');
    const [adminDuration, setAdminDuration] = useState('30');
    const [adminOperators, setAdminOperators] = useState('1');
    const [adminManagers, setAdminManagers] = useState('1');
    const [adminCustomKey, setAdminCustomKey] = useState('');

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
            toast.success('Solicitação de plano enviada!');
        } catch {
            toast.error('Erro ao processar plano. Ative via chave para liberação instantânea.');
        } finally {
            setSubscribing(false);
        }
    };

    const handleActivateKey = async () => {
        if (!activationKey) {
            toast.error('Informe o código da chave.');
            return;
        }
        try {
            const res = await billingService.activateKey(activationKey);
            toast.success(`${res.message} Plano ${res.plan} ativado!`);
            setActivationKey('');
            queryClient.invalidateQueries({ queryKey: ['billing-status'] });
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao ativar chave.');
        }
    };

    const handleGenerateKey = async () => {
        if (!adminSelectedPlan) {
            toast.error('Selecione um plano.');
            return;
        }

        const selectedPlan = plans.find(p => p.id.toString() === adminSelectedPlan);
        const prefix = selectedPlan?.slug?.toUpperCase() || 'KEY';

        let genKey = adminCustomKey;
        if (!genKey) {
            const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
            genKey = `${prefix}-${randomPart}`;
        } else if (!genKey.includes('-')) {
            // If user typed a custom key without prefix, add it for consistency
            genKey = `${prefix}-${genKey}`;
        }

        try {
            await generateKeyMutation.mutateAsync({
                plan: parseInt(adminSelectedPlan),
                duration_days: parseInt(adminDuration),
                operators_limit: parseInt(adminOperators),
                managers_limit: parseInt(adminManagers),
                key: genKey
            });
            toast.success(`Chave gerada: ${genKey}`);
            setAdminCustomKey('');
        } catch (err) {
            toast.error('Erro ao gerar chave.');
        }
    };

    const handleDeleteKey = async (id: number) => {
        if (!confirm('Excluir esta chave permanentemente?')) return;
        try {
            await deleteKeyMutation.mutateAsync(id);
            toast.success('Chave excluída.');
        } catch {
            toast.error('Erro ao excluir chave.');
        }
    };

    const handleRenewKey = async (id: number) => {
        try {
            const newKey = await renewKeyMutation.mutateAsync(id);
            toast.success(`Chave renovada (Clonada): ${newKey.key}`);
        } catch {
            toast.error('Erro ao renovar chave.');
        }
    };

    if (loadingStatus || loadingPlans) {
        return <div className="p-6 flex items-center justify-center h-[50vh]"><RefreshCcw className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="p-6 max-w-[1200px] mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Assinatura & Licenças</h1>
                    <p className="text-muted-foreground font-medium">Gerencie seu acesso e recursos da plataforma.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-xl h-12 w-full sm:w-auto">
                    <TabsTrigger value="subscription" className="rounded-lg px-6 font-bold gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Rocket className="h-4 w-4" /> Minha Assinatura
                    </TabsTrigger>
                    {isAdmin && (
                        <TabsTrigger value="admin" className="rounded-lg px-6 font-bold gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <ShieldCheck className="h-4 w-4" /> Gestão de Chaves
                        </TabsTrigger>
                    )}
                    {isAdmin && (
                        <TabsTrigger value="plans" className="rounded-lg px-6 font-bold gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Layers className="h-4 w-4" /> Gestão de Planos
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="subscription" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* Trial Banner */}
                    {isOnTrial && (
                        <Card className="bg-amber-500/10 border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Clock className="h-24 w-24" />
                            </div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-amber-700">Período de Experiência</h3>
                                    <p className="text-sm text-amber-600/80 font-medium">
                                        Você possui <span className="font-bold">{daysRemaining ?? 0} dias</span> restantes. Escolha um plano ou ative uma chave para não perder o acesso.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Usage & Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <UsageCard
                            title="Produtos"
                            current={usage?.products_count || 0}
                            limit={billing?.limits?.max_products || 0}
                            icon={<Package2 className="h-4 w-4" />}
                        />
                        <UsageCard
                            title="Operadores"
                            current={usage?.operators_count || 0}
                            limit={billing?.limits?.max_operators || 0}
                            icon={<Users2 className="h-4 w-4" />}
                        />
                        <UsageCard
                            title="Números WhatsApp"
                            current={usage?.whatsapp_numbers_count || 0}
                            limit={billing?.limits?.max_whatsapp || 0}
                            icon={<Smartphone className="h-4 w-4" />}
                        />
                    </div>

                    {/* Plan Selection */}
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black text-foreground">Escolha o plano ideal</h2>
                            <p className="text-muted-foreground font-medium">Todos os planos incluem atualizações gratuitas e suporte.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    </div>

                    {/* Key Activation Footer */}
                    <Card className="bg-primary/5 border-primary/20 border-dashed rounded-3xl p-8 w-full shadow-2xl shadow-primary/5">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary border border-primary/10">
                                <Key className="h-7 w-7" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-foreground">Já tem uma chave de licença?</h3>
                                <p className="text-sm text-muted-foreground font-medium italic max-w-md mx-auto">Ative seu plano Enterprise ou Pro instantaneamente vinculando seu código abaixo.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl mt-4">
                                <Input
                                    placeholder="INSIRA SUA CHAVE AQUI..."
                                    value={activationKey}
                                    onChange={e => setActivationKey(e.target.value)}
                                    className="h-14 bg-white/80 dark:bg-slate-900 border-primary/20 rounded-2xl text-center font-mono font-bold uppercase tracking-widest text-lg text-slate-900 dark:text-white focus-visible:ring-primary/40 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
                                />
                                <Button
                                    onClick={handleActivateKey}
                                    className="h-14 px-10 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    ATIVAR AGORA
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter opacity-50">Liberação instantânea pós-validação</p>
                        </div>
                    </Card>
                </TabsContent>

                {isAdmin && (
                    <>
                        <TabsContent value="admin" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Key Generation Form */}
                                <Card className="lg:col-span-1 border-orange-500/20 bg-orange-500/[0.02]">
                                    <CardHeader>
                                        <div className="flex items-center gap-2 text-orange-600 mb-1">
                                            <Plus className="h-5 w-5" />
                                            <CardTitle className="text-lg font-black">Gerar Chave</CardTitle>
                                        </div>
                                        <CardDescription className="font-medium text-xs uppercase tracking-wider">Configure os parâmetros da licença</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Plano Alvo</label>
                                            <Select value={adminSelectedPlan} onValueChange={setAdminSelectedPlan}>
                                                <SelectTrigger className="h-12 rounded-xl bg-background border-border/50">
                                                    <SelectValue placeholder="Selecione um plano" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {plans.map(p => (
                                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Duração (Dias)</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    value={adminDuration}
                                                    onChange={e => setAdminDuration(e.target.value)}
                                                    className="h-12 pl-10 rounded-xl bg-background border-border/50 font-bold"
                                                    placeholder="Ex: 30"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Operadores</label>
                                                <div className="relative">
                                                    <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        type="number"
                                                        value={adminOperators}
                                                        onChange={e => setAdminOperators(e.target.value)}
                                                        className="h-12 pl-10 rounded-xl bg-background border-border/50 font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Gerentes</label>
                                                <div className="relative">
                                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        type="number"
                                                        value={adminManagers}
                                                        onChange={e => setAdminManagers(e.target.value)}
                                                        className="h-12 pl-10 rounded-xl bg-background border-border/50 font-bold"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Código Customizado (Opcional)</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    value={adminCustomKey}
                                                    onChange={e => setAdminCustomKey(e.target.value.toUpperCase())}
                                                    className="h-12 pl-10 rounded-xl bg-background border-border/50 font-mono font-bold"
                                                    placeholder="DEIXE EM BRANCO P/ AUTO"
                                                />
                                            </div>
                                            {adminSelectedPlan && !adminCustomKey && (
                                                <p className="text-[10px] text-orange-500 font-bold px-1 italic">
                                                    Será gerada como: {plans.find(p => p.id.toString() === adminSelectedPlan)?.slug.toUpperCase()}-XXXX-XXXX
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            onClick={handleGenerateKey}
                                            disabled={generateKeyMutation.isPending}
                                            className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black shadow-lg shadow-orange-500/20"
                                        >
                                            {generateKeyMutation.isPending ? 'GERANDO...' : 'GERAR NOVA CHAVE'}
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Keys List */}
                                <Card className="lg:col-span-2 border-border/50 overflow-hidden shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <History className="h-5 w-5 text-orange-500" />
                                        <CardTitle className="text-lg font-black">Histórico de Chaves</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {keys.length > keysPerPage && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-orange-500"
                                                onClick={() => setKeysPage(1)}
                                                title="Voltar ao início"
                                            >
                                                <History className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => refetchKeys()} className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-orange-500">
                                            <RefreshCcw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-muted/10">
                                                    <TableRow className="hover:bg-transparent border-none">
                                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-10 px-6 text-muted-foreground/70">Licença</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-10 text-muted-foreground/70">Plano</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-10 text-center text-muted-foreground/70">Limites (O/G)</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-10 text-center text-muted-foreground/70">Dias</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] h-10 text-right pr-6 text-muted-foreground/70">Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {keys.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium italic">
                                                                Nenhuma chave gerada até o momento.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        keys
                                                            .slice((keysPage - 1) * keysPerPage, keysPage * keysPerPage)
                                                            .map((k) => (
                                                                <TableRow key={k.id} className="border-border/30 hover:bg-muted/10 transition-colors group">
                                                                    <TableCell className="px-6 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", k.is_used ? "bg-muted text-muted-foreground" : "bg-orange-100 text-orange-600")}>
                                                                                <Key className="h-4 w-4" />
                                                                            </div>
                                                                            <span className="font-mono font-bold text-sm tracking-widest">{k.key}</span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="outline" className="text-[10px] font-bold">{k.plan_name}</Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        <div className="flex justify-center gap-1 font-bold text-[10px]">
                                                                            <span className="text-blue-500">{k.operators_limit}</span>
                                                                            <span className="text-muted-foreground">/</span>
                                                                            <span className="text-purple-500">{k.managers_limit}</span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-center font-bold text-xs text-muted-foreground">
                                                                        {k.duration_days} d
                                                                    </TableCell>
                                                                    <TableCell className="text-right pr-6">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            {k.is_used ? (
                                                                                <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-transparent px-2 py-0.5 font-bold uppercase text-[9px]">VINCULADA</Badge>
                                                                            ) : (
                                                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-2 py-0.5 font-bold uppercase text-[9px]">DISPONÍVEL</Badge>
                                                                            )}
                                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                                                                    title="Clonar/Renovar"
                                                                                    onClick={() => handleRenewKey(k.id)}
                                                                                >
                                                                                    <Copy className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                                                    title="Excluir"
                                                                                    onClick={() => handleDeleteKey(k.id)}
                                                                                >
                                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {keys.length > keysPerPage && (
                                            <div className="py-4 border-t border-border/30 px-4">
                                                <Pagination>
                                                    <PaginationContent>
                                                        <PaginationItem>
                                                            <PaginationPrevious
                                                                onClick={() => setKeysPage(p => Math.max(1, p - 1))}
                                                                className={cn("cursor-pointer h-8 text-[10px] font-bold", keysPage === 1 && "pointer-events-none opacity-50")}
                                                            />
                                                        </PaginationItem>
                                                        {Array.from({ length: Math.ceil(keys.length / keysPerPage) }).map((_, i) => {
                                                            const pageNum = i + 1;
                                                            // Show first, last, current, and pages around current
                                                            if (
                                                                pageNum === 1 ||
                                                                pageNum === Math.ceil(keys.length / keysPerPage) ||
                                                                Math.abs(pageNum - keysPage) <= 1
                                                            ) {
                                                                return (
                                                                    <PaginationItem key={pageNum}>
                                                                        <PaginationLink
                                                                            onClick={() => setKeysPage(pageNum)}
                                                                            isActive={keysPage === pageNum}
                                                                            className="cursor-pointer h-8 w-8 text-[10px] font-bold"
                                                                        >
                                                                            {pageNum}
                                                                        </PaginationLink>
                                                                    </PaginationItem>
                                                                );
                                                            }
                                                            // Show ellipses
                                                            if (pageNum === 2 || pageNum === Math.ceil(keys.length / keysPerPage) - 1) {
                                                                return (
                                                                    <PaginationItem key={pageNum}>
                                                                        <PaginationEllipsis className="h-8 w-8" />
                                                                    </PaginationItem>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                        <PaginationItem>
                                                            <PaginationNext
                                                                onClick={() => setKeysPage(p => Math.min(Math.ceil(keys.length / keysPerPage), p + 1))}
                                                                className={cn("cursor-pointer h-8 text-[10px] font-bold", keysPage === Math.ceil(keys.length / keysPerPage) && "pointer-events-none opacity-50")}
                                                            />
                                                        </PaginationItem>
                                                    </PaginationContent>
                                                </Pagination>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* New Plans Management Tab */}
                        <TabsContent value="plans" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-black">Planos de Assinatura</CardTitle>
                                        <CardDescription>Configure os níveis de serviço e limites de cada plano.</CardDescription>
                                    </div>
                                    <Button onClick={() => openPlanDialog()} className="gap-2 font-bold bg-primary hover:bg-primary/90">
                                        <Plus className="h-4 w-4" /> Novo Plano
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="px-6">Plano</TableHead>
                                                <TableHead>Preço</TableHead>
                                                <TableHead>Limites (Prod/Oper/Ger/Whats)</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right pr-6">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {plans.map((p) => (
                                                <TableRow key={p.id} className="group">
                                                    <TableCell className="px-6">
                                                        <div>
                                                            <div className="font-bold">{p.name}</div>
                                                            <div className="text-[10px] text-muted-foreground font-mono">{p.slug}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-bold">
                                                        R$ {parseFloat(p.price as string).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Badge variant="outline" className="text-[10px]">{p.limits.max_products}</Badge>
                                                            <Badge variant="outline" className="text-[10px]">{p.limits.max_operators}</Badge>
                                                            <Badge variant="outline" className="text-[10px]">{p.limits.max_managers}</Badge>
                                                            <Badge variant="outline" className="text-[10px]">{p.limits.max_whatsapp}</Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {p.is_active ? (
                                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-2 py-0.5 font-bold text-[9px]">ATIVO</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-transparent px-2 py-0.5 font-bold text-[9px]">INATIVO</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openPlanDialog(p)}>
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDeletePlan(p.id)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Plan Editor Dialog */}
                            <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-black">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
                                        <DialogDescription>Defina as regras e valores do plano de assinatura.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-6 py-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider">Nome do Plano</Label>
                                                <Input
                                                    value={planFormData.name}
                                                    onChange={e => setPlanFormData({ ...planFormData, name: e.target.value })}
                                                    placeholder="Ex: Gold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider">Identificador (Slug)</Label>
                                                <Select value={planFormData.slug} onValueChange={val => setPlanFormData({ ...planFormData, slug: val as any })}>
                                                    <SelectTrigger className="h-10 rounded-md bg-background border-border/50">
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="basico">basico</SelectItem>
                                                        <SelectItem value="pro">pro</SelectItem>
                                                        <SelectItem value="enterprise">enterprise</SelectItem>
                                                        <SelectItem value="free">free</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider">Preço Mensal (R$)</Label>
                                                <Input
                                                    type="number"
                                                    value={planFormData.price}
                                                    onChange={e => setPlanFormData({ ...planFormData, price: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider">Descrição</Label>
                                            <Textarea
                                                value={planFormData.description}
                                                onChange={e => setPlanFormData({ ...planFormData, description: e.target.value })}
                                                placeholder="Breve resumo comercial..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase">Produtos</Label>
                                                <Input type="number" value={planFormData.limits?.max_products} onChange={e => setPlanFormData({ ...planFormData, limits: { ...planFormData.limits!, max_products: parseInt(e.target.value) } })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase">Operadores</Label>
                                                <Input type="number" value={planFormData.limits?.max_operators} onChange={e => setPlanFormData({ ...planFormData, limits: { ...planFormData.limits!, max_operators: parseInt(e.target.value) } })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase">Gerentes</Label>
                                                <Input type="number" value={planFormData.limits?.max_managers} onChange={e => setPlanFormData({ ...planFormData, limits: { ...planFormData.limits!, max_managers: parseInt(e.target.value) } })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase">WhatsApps</Label>
                                                <Input type="number" value={planFormData.limits?.max_whatsapp} onChange={e => setPlanFormData({ ...planFormData, limits: { ...planFormData.limits!, max_whatsapp: parseInt(e.target.value) } })} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider">Features (Uma por linha)</Label>
                                            <Textarea
                                                value={planFormData.features?.join('\n')}
                                                onChange={e => setPlanFormData({ ...planFormData, features: e.target.value.split('\n').filter(f => f.trim() !== '') })}
                                                placeholder="Suporte VIP&#10;Relatórios ILIMITADOS&#10;API..."
                                                rows={5}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between border-t pt-4">
                                            <div className="flex items-center gap-2">
                                                <Switch checked={planFormData.is_active} onCheckedChange={val => setPlanFormData({ ...planFormData, is_active: val })} />
                                                <Label className="text-sm font-bold">Plano Ativo</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch checked={planFormData.is_highlighted} onCheckedChange={val => setPlanFormData({ ...planFormData, is_highlighted: val })} />
                                                <Label className="text-sm font-bold">Destaque (Popular)</Label>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>Cancelar</Button>
                                        <Button onClick={handleSavePlan} className="bg-primary hover:bg-primary/90 font-bold">Salvar Plano</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
}
