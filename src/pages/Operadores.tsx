import { useState } from 'react';
import {
  Plus, Pencil, Trash2, MoreHorizontal, UserCog, Lock, Clock, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetOperators, useCreateOperator, useUpdateOperator, useDeleteOperator } from '@/services/operator.service';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Operador } from '@/types';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-primary/15 text-primary border-primary/30',
  GERENTE: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  VENDEDOR: 'bg-muted text-muted-foreground',
};

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  GERENTE: 'Gerente',
  VENDEDOR: 'Vendedor',
};

export default function Operadores() {
  const { data: operators = [], isLoading, isError } = useGetOperators();
  const createMutation = useCreateOperator();
  const updateMutation = useUpdateOperator();
  const deleteMutation = useDeleteOperator();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operador | null>(null);

  const [formData, setFormData] = useState<any>({
    nome: '',
    login_name: '',
    whatsapp: '',
    role: 'VENDEDOR',
    ativo: true,
    password: '',
    horario_inicio: '08:00',
    horario_fim: '18:00',
  });

  const handleOpenDialog = (operator?: Operador) => {
    if (operator) {
      setEditingOperator(operator);
      setFormData({
        ...operator,
        password: '',
        horario_inicio: (operator as any).horario_inicio || '08:00',
        horario_fim: (operator as any).horario_fim || '18:00',
      });
    } else {
      setEditingOperator(null);
      setFormData({
        nome: '',
        login_name: '',
        whatsapp: '',
        role: 'VENDEDOR',
        ativo: true,
        password: '',
        horario_inicio: '08:00',
        horario_fim: '18:00',
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
        const payload: any = { ...editingOperator, ...formData };
        if (!payload.password) delete payload.password;
        await updateMutation.mutateAsync(payload as Operador);
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
            className="bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 h-12 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4 mr-2" /> Novo Operador
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {operators.map(op => (
          <div key={op.id} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 hover:-translate-y-0.5 transition-all relative group">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {(op.nome || '?')[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-foreground truncate">{op.nome}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
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
            <div className="flex items-center justify-between mt-4 p-2.5 bg-muted/20 rounded-xl border border-border/50">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleColors[op.role]}`}>
                {roleLabels[op.role] || op.role}
              </Badge>
              <div className="flex items-center gap-2">
                {(op as any).needs_password_setup && (
                  <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Senha pendente
                  </span>
                )}
                <span className={`text-[10px] font-bold uppercase tracking-wider ${op.ativo ? 'text-primary' : 'text-muted-foreground'}`}>
                  {op.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-display font-bold">{editingOperator ? 'Editar Operador' : 'Novo Operador'}</DialogTitle>
            <DialogDescription>Cadastre ou edite um membro da equipe.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="p-6 space-y-5">

              {/* 👤 Dados do Operador */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UserCog className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Dados do Operador</h3>
                </div>
                <div className="space-y-3 pl-9">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">Nome Completo *</Label>
                    <Input
                      value={formData.nome || ''}
                      onChange={e => setFormData({ ...formData, nome: e.target.value })}
                      className="h-11 rounded-xl bg-muted/30 border-none px-4"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">WhatsApp *</Label>
                    <Input
                      value={formData.whatsapp || ''}
                      onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="h-11 rounded-xl bg-muted/30 border-none px-4"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">Login (apelido de acesso)</Label>
                    <Input
                      value={formData.login_name || ''}
                      onChange={e => setFormData({ ...formData, login_name: e.target.value })}
                      className="h-11 rounded-xl bg-muted/30 border-none px-4"
                      placeholder="Ex: joao.silva"
                    />
                    <p className="text-[10px] text-muted-foreground">Opcional. Identificador visual do operador.</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 🛡️ Perfil & Permissões */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Perfil & Permissões</h3>
                </div>
                <div className="space-y-3 pl-9">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">Nível de Acesso</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(v: any) => setFormData({ ...formData, role: v })}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none px-4">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                        <SelectItem value="GERENTE">Gerente</SelectItem>
                        <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
                    <div>
                      <p className="text-sm font-bold">Operador Ativo</p>
                      <p className="text-xs text-muted-foreground">Desative para bloquear acesso</p>
                    </div>
                    <Switch
                      checked={formData.ativo ?? true}
                      onCheckedChange={(v) => setFormData({ ...formData, ativo: v })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 🔑 Segurança */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Segurança</h3>
                </div>
                <div className="space-y-3 pl-9">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">
                      {editingOperator ? 'Nova Senha (deixe vazio para manter)' : 'Senha de Acesso'}
                    </Label>
                    <Input
                      type="password"
                      value={formData.password || ''}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="h-11 rounded-xl bg-muted/30 border-none px-4"
                      placeholder={editingOperator ? '••••••••' : 'Defina uma senha'}
                    />
                    {!editingOperator && (
                      <p className="text-[10px] text-amber-500 font-medium">💡 Se deixar em branco, o operador poderá criar a própria senha no primeiro login.</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* ⏰ Horário de Funcionamento */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Horário de Acesso</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 pl-9">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">Início</Label>
                    <Input
                      type="time"
                      value={formData.horario_inicio || '08:00'}
                      onChange={e => setFormData({ ...formData, horario_inicio: e.target.value })}
                      className="h-11 rounded-xl bg-muted/30 border-none px-4 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">Fim</Label>
                    <Input
                      type="time"
                      value={formData.horario_fim || '18:00'}
                      onChange={e => setFormData({ ...formData, horario_fim: e.target.value })}
                      className="h-11 rounded-xl bg-muted/30 border-none px-4 font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground pl-9">O operador só poderá acessar o sistema dentro deste horário.</p>
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
                {editingOperator
                  ? (updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações')
                  : (createMutation.isPending ? 'Cadastrando...' : 'Cadastrar Operador')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
