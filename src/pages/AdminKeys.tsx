import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService, useGetPlans } from '@/services/billing.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Key, Plus, Copy, CheckCircle2, History, Rocket } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminKeys() {
    const queryClient = useQueryClient();
    const { data: plans = [] } = useGetPlans();
    const { data: keys = [], isLoading } = useQuery({
        queryKey: ['admin-keys'],
        queryFn: billingService.getKeys
    });

    const [newKeyData, setNewKeyData] = useState({
        plan: '',
        duration_days: '30',
        key: ''
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const generateMutation = useMutation({
        mutationFn: (data: any) => billingService.generateKey(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-keys'] });
            toast.success('Chave gerada com sucesso!');
            setNewKeyData(prev => ({ ...prev, key: '' }));
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'Erro ao gerar chave.');
        }
    });

    const handleGenerate = () => {
        if (!newKeyData.plan || !newKeyData.duration_days || !newKeyData.key) {
            toast.error('Preencha todos os campos.');
            return;
        }
        generateMutation.mutate({
            plan: parseInt(newKeyData.plan),
            duration_days: parseInt(newKeyData.duration_days),
            key: newKeyData.key
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Chave copiada!');
    };

    const generateRandomKey = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 12; i++) {
            if (i > 0 && i % 4 === 0) result += '-';
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewKeyData(prev => ({ ...prev, key: result }));
    };

    // Pagination logic
    const totalPages = Math.ceil(keys.length / itemsPerPage);
    const paginatedKeys = keys.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-6 space-y-8 max-w-5xl">
            <PageHeader
                titulo="Gerenciamento de Keys"
                subtitulo="Gere e controle chaves de acesso para os planos."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <Card className="md:col-span-1 border-primary/20 bg-primary/[0.02] h-fit sticky top-6">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Gerar Nova Chave
                        </CardTitle>
                        <CardDescription className="text-xs">Crie chaves únicas para ativação manual.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Plano</Label>
                            <Select onValueChange={v => setNewKeyData({ ...newKeyData, plan: v })}>
                                <SelectTrigger className="rounded-xl h-10">
                                    <SelectValue placeholder="Selecione o plano" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Duração (dias)</Label>
                            <Input
                                type="number"
                                value={newKeyData.duration_days}
                                onChange={e => setNewKeyData({ ...newKeyData, duration_days: e.target.value })}
                                className="rounded-xl h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Código da Chave</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newKeyData.key}
                                    onChange={e => setNewKeyData({ ...newKeyData, key: e.target.value })}
                                    className="rounded-xl h-10 font-mono"
                                    placeholder="ABCD-1234..."
                                />
                                <Button size="icon" variant="outline" onClick={generateRandomKey} className="rounded-xl h-10 w-10 shrink-0">
                                    <Rocket className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <Button
                            className="w-full rounded-xl font-bold h-11"
                            disabled={generateMutation.isPending}
                            onClick={handleGenerate}
                        >
                            {generateMutation.isPending ? 'Gerando...' : 'Gerar Chave'}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <History className="h-4 w-4" /> Histórico de Chaves
                            </CardTitle>
                            <CardDescription className="text-xs">Visualize as chaves geradas e seu status.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">Carregando chaves...</div>
                        ) : keys.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma chave gerada ainda.</div>
                        ) : (
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border text-xs text-muted-foreground">
                                                <th className="text-left py-3 font-medium">Chave</th>
                                                <th className="text-left py-3 font-medium">Plano / Dias</th>
                                                <th className="text-center py-3 font-medium">Status</th>
                                                <th className="text-right py-3 font-medium">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {paginatedKeys.map((k: any) => (
                                                <tr key={k.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="py-3 font-mono font-medium text-xs text-primary">{k.key}</td>
                                                    <td className="py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">{k.plan_name}</span>
                                                            <span className="text-[10px] text-muted-foreground">{k.duration_days} dias</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <Badge variant="outline" className={k.is_used ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}>
                                                            {k.is_used ? 'Utilizada' : 'Disponível'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => copyToClipboard(k.key)}>
                                                            <Copy className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-4 border-t border-border">
                                        <p className="text-[10px] text-muted-foreground">Página {currentPage} de {totalPages}</p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-lg text-xs"
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                Anterior
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-lg text-xs font-bold"
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                Próxima
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
