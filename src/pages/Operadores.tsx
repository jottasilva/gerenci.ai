import { useState } from 'react';
import { Plus, Pencil, Trash2, MoreHorizontal, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { useGetOperators, useCreateOperator, useUpdateOperator, useDeleteOperator } from '@/services/operator.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Operador } from '@/types';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-primary/15 text-primary border-primary/30',
  GERENTE: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  VENDEDOR: 'bg-muted text-muted-foreground',
};

export default function Operadores() {
  const { data: operators = [], isLoading, isError } = useGetOperators();
  const createMutation = useCreateOperator();
  const updateMutation = useUpdateOperator();
  const deleteMutation = useDeleteOperator();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operador | null>(null);

  const [formData, setFormData] = useState<Partial<Operador>>({
    nome: '',
    whatsapp: '',
    role: 'VENDEDOR',
    ativo: true
  });

  const handleOpenDialog = (operator?: Operador) => {
    if (operator) {
      setEditingOperator(operator);
      setFormData(operator);
    } else {
      setEditingOperator(null);
      setFormData({
        nome: '',
        whatsapp: '',
        role: 'VENDEDOR',
        ativo: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.whatsapp) {
      toast.error("Preencha o nome e o WhatsApp.");
      return;
    }

    try {
      if (editingOperator) {
        await updateMutation.mutateAsync({ ...editingOperator, ...formData } as Operador);
      } else {
        await createMutation.mutateAsync(formData as Omit<Operador, 'id'>);
      }
      setIsDialogOpen(false);
    } catch (err) { }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este operador?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando operadores...</div>;
  if (isError) return <div className="p-8 text-center text-destructive">Erro ao carregar operadores.</div>;

  return (
    <div>
      <PageHeader
        titulo="Operadores"
        subtitulo="Gerencie sua equipe de vendas"
        actions={
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" /> Novo Operador
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {operators.map(op => (
          <div key={op.id} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 hover:-translate-y-0.5 transition-all relative group">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {op.nome[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground truncate">{op.nome}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleOpenDialog(op)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(op.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{op.whatsapp}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 p-2 bg-muted/30 rounded-lg">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleColors[op.role]}`}>
                {op.role}
              </Badge>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${op.ativo ? 'text-primary' : 'text-muted-foreground'}`}>
                {op.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingOperator ? 'Editar Operador' : 'Novo Operador'}</DialogTitle>
            <DialogDescription>Cadastre um novo membro para sua equipe.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">Nome</Label>
              <Input
                id="nome"
                value={formData.nome || ''}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="whatsapp" className="text-right">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp || ''}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Perfil</Label>
              <Select
                value={formData.role}
                onValueChange={(v: any) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="GERENTE">Gerente</SelectItem>
                  <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <Select
                value={formData.ativo ? 'true' : 'false'}
                onValueChange={(v) => setFormData({ ...formData, ativo: v === 'true' })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
