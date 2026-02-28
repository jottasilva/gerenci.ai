import { useState } from 'react';
import {
    Plus, Pencil, Trash2, MoreHorizontal, Truck, Phone, Mail,
    MapPin, FileText, Search, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { useGetSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '@/services/supplier.service';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Fornecedor } from '@/types';

export default function Fornecedores() {
    const { data: suppliers = [], isLoading, isError } = useGetSuppliers();
    const createMutation = useCreateSupplier();
    const updateMutation = useUpdateSupplier();
    const deleteMutation = useDeleteSupplier();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Fornecedor | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState<Partial<Fornecedor>>({
        name: '',
        phone: '',
        email: '',
        cnpj: '',
        address: '',
        is_active: true,
    });

    const handleOpenDialog = (supplier?: Fornecedor) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData(supplier);
        } else {
            setEditingSupplier(null);
            setFormData({ name: '', phone: '', email: '', cnpj: '', address: '', is_active: true });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast.error("Informe o nome do fornecedor.");
            return;
        }
        try {
            if (editingSupplier) {
                await updateMutation.mutateAsync({ ...editingSupplier, ...formData } as Fornecedor);
            } else {
                await createMutation.mutateAsync(formData as Omit<Fornecedor, 'id'>);
            }
            setIsDialogOpen(false);
        } catch (err) { }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Deseja realmente excluir este fornecedor?")) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const filtered = suppliers.filter((s: any) =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-muted-foreground">Carregando fornecedores...</p>
        </div>
    );
    if (isError) return <div className="p-8 text-center text-destructive">Erro ao carregar fornecedores.</div>;

    return (
        <div>
            <PageHeader
                titulo="Fornecedores"
                subtitulo="Gerencie seus fornecedores e parceiros"
                actions={
                    <Button
                        onClick={() => handleOpenDialog()}
                        className="bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 h-12 shadow-lg shadow-primary/20"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Novo Fornecedor
                    </Button>
                }
            />

            {/* Search */}
            <div className="relative mb-6 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar fornecedor..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 h-11 rounded-xl bg-muted/30 border-none"
                />
            </div>

            {/* Supplier Cards */}
            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <Truck className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Nenhum fornecedor encontrado</h3>
                    <p className="text-sm text-muted-foreground">Cadastre seu primeiro fornecedor clicando no botão acima.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((s: any) => (
                        <div key={s.id} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 hover:-translate-y-0.5 transition-all group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {s.name[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-foreground truncate">{s.name}</p>
                                        {s.cnpj && <p className="text-xs text-muted-foreground font-mono">{s.cnpj}</p>}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleOpenDialog(s)}>
                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="space-y-1.5 text-xs text-muted-foreground">
                                {s.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{s.phone}</span>
                                    </div>
                                )}
                                {s.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{s.email}</span>
                                    </div>
                                )}
                                {s.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{s.address}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${s.is_active ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground'}`}>
                                    {s.is_active ? 'Ativo' : 'Inativo'}
                                </Badge>
                                {s.created_at && (
                                    <span className="text-[10px] text-muted-foreground">
                                        Desde {new Date(s.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="w-[95vw] sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-xl font-display font-bold">{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
                        <DialogDescription>Preencha os dados do fornecedor.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh]">
                        <div className="p-6 space-y-5">
                            {/* Dados Principais */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Truck className="h-3.5 w-3.5 text-primary" />
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Dados Principais</h3>
                                </div>
                                <div className="space-y-3 pl-9">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-muted-foreground">Nome / Razão Social *</Label>
                                        <Input
                                            value={formData.name || ''}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/30 border-none px-4"
                                            placeholder="Ex: Distribuidora ABC"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-muted-foreground">CNPJ</Label>
                                        <Input
                                            value={formData.cnpj || ''}
                                            onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/30 border-none px-4"
                                            placeholder="00.000.000/0000-00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Contato */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <Phone className="h-3.5 w-3.5 text-blue-500" />
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Contato</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pl-9">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-muted-foreground">Telefone</Label>
                                        <Input
                                            value={formData.phone || ''}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/30 border-none px-4"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-muted-foreground">E-mail</Label>
                                        <Input
                                            value={formData.email || ''}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/30 border-none px-4"
                                            placeholder="contato@empresa.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Endereço */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Endereço</h3>
                                </div>
                                <div className="pl-9 space-y-1.5">
                                    <Label className="text-xs font-bold text-muted-foreground">Endereço Completo</Label>
                                    <Input
                                        value={formData.address || ''}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="h-11 rounded-xl bg-muted/30 border-none px-4"
                                        placeholder="Rua, número, bairro, cidade"
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Status */}
                            <div className="pl-9">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
                                    <div>
                                        <p className="text-sm font-bold">Fornecedor Ativo</p>
                                        <p className="text-xs text-muted-foreground">Desative para ocultar das listagens</p>
                                    </div>
                                    <Switch
                                        checked={formData.is_active ?? true}
                                        onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                                    />
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <div className="p-6 pt-0">
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 rounded-xl order-2 sm:order-1">Cancelar</Button>
                            <Button
                                onClick={handleSave}
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20 order-1 sm:order-2"
                            >
                                {editingSupplier
                                    ? (updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações')
                                    : (createMutation.isPending ? 'Cadastrando...' : 'Cadastrar Fornecedor')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
