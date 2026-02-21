import { Search, Plus, Pencil, Trash2, MoreHorizontal, Loader2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Cliente } from '@/types';
import { useGetCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/services/customer.service';

export default function Clientes() {
  const { data: clients = [], isLoading, isError } = useGetCustomers();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);

  const [formData, setFormData] = useState<Partial<Cliente>>({
    nome: '',
    whatsapp: '',
    email: '',
    endereco: '',
    ativo: true,
  });

  const filtered = clients.filter(c =>
    (c.nome ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.whatsapp ?? '').includes(search)
  );

  const handleOpenDialog = (client?: Cliente) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({
        nome: '',
        whatsapp: '',
        email: '',
        endereco: '',
        ativo: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.whatsapp) {
      toast.error("Por favor, preencha os campos obrigatórios.");
      return;
    }

    try {
      if (editingClient) {
        await updateMutation.mutateAsync({ ...editingClient, ...formData } as Cliente);
      } else {
        await createMutation.mutateAsync(formData as Omit<Cliente, 'id'>);
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data ? JSON.stringify(err.response.data) : (err.message || "Erro ao salvar cliente.");
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este cliente?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground">Carregando clientes...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Erro ao carregar lista de clientes.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titulo="Clientes"
        subtitulo="Cadastro e histórico de clientes"
        actions={
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4 mr-2" /> Novo Cliente
          </Button>
        }
      />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou WhatsApp..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-card border-border rounded-xl h-12"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="text-left py-3 px-4 font-bold uppercase tracking-widest text-[10px]">Nome</th>
                <th className="text-left py-3 px-4 font-bold uppercase tracking-widest text-[10px]">WhatsApp</th>
                <th className="text-left py-3 px-4 font-bold uppercase tracking-widest text-[10px]">Status</th>
                <th className="text-right py-3 px-4 font-bold uppercase tracking-widest text-[10px]">Total Compras</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className={`border-b border-border/50 hover:bg-primary/[0.02] transition-colors ${i % 2 === 1 ? 'bg-muted/5' : ''}`}>
                  <td className="py-4 px-4 font-semibold text-foreground">{c.nome}</td>
                  <td className="py-4 px-4 text-muted-foreground font-mono text-xs">{c.whatsapp}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-foreground">R$ {parseFloat((c.total_compras ?? 0).toString()).toFixed(2).replace('.', ',')}</td>
                  <td className="py-4 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenDialog(c)} className="rounded-lg">
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(c.id)}
                          className="text-destructive focus:text-destructive rounded-lg"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados do cliente abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome</Label>
              <Input
                id="nome"
                value={formData.nome || ''}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                className="h-11 rounded-xl bg-muted/30 border-none"
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp || ''}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                className="h-11 rounded-xl bg-muted/30 border-none"
                placeholder="Ex: 11999998888"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="h-11 rounded-xl bg-muted/30 border-none"
                placeholder="Opcional"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                className="h-5 w-5 rounded-lg border-muted-foreground/30 text-primary focus:ring-primary/20 transition-all"
              />
              <Label htmlFor="ativo" className="text-sm font-bold cursor-pointer">Cliente Ativo</Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-11 flex-1">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl h-11 flex-1 font-bold shadow-lg shadow-primary/20">
              {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : 'Salvar Dados'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
