import { useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Minus, Plus, Loader2, Clock, User, Package } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EstoqueIndicator } from '@/components/shared/EstoqueIndicator';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MovimentoEstoque } from '@/types';
import { useGetProducts, useGetStockMovements, useCreateStockMovement } from '@/services/product.service';

export default function Estoque() {
  const { data: products = [], isLoading: isLoadingProducts } = useGetProducts();
  const { data: movements = [], isLoading: isLoadingMovements } = useGetStockMovements();
  const createMovementMutation = useCreateStockMovement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMovement, setNewMovement] = useState<Partial<MovimentoEstoque>>({
    type: 'ENTRADA',
    quantity: 0,
    reason: ''
  });

  const produtosAlerta = products.filter(p => p.stock < p.stock_min);

  const handleSaveMovement = async () => {
    if (!newMovement.product || !newMovement.quantity || !newMovement.reason) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    try {
      await createMovementMutation.mutateAsync({
        product: newMovement.product,
        type: newMovement.type,
        quantity: newMovement.quantity,
        reason: newMovement.reason
      });
      setIsDialogOpen(false);
      setNewMovement({ type: 'ENTRADA', quantity: 0, reason: '' });
    } catch (err) { }
  };

  if (isLoadingProducts || isLoadingMovements) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground">Carregando estoque...</p>
      </div>
    );
  }

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'ENTRADA': return { icon: ArrowDown, label: 'Entrada', color: 'bg-primary/10 text-primary border-primary/20', sign: '+' };
      case 'SAIDA': return { icon: ArrowUp, label: 'Saída', color: 'bg-destructive/10 text-destructive border-destructive/20', sign: '-' };
      default: return { icon: Minus, label: 'Ajuste', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', sign: '±' };
    }
  };

  return (
    <div>
      <PageHeader
        titulo="Estoque"
        subtitulo="Controle e movimentações de estoque"
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/produtos'}
              className="rounded-xl font-bold border-primary/20 text-primary hover:bg-primary hover:text-white transition-all h-12"
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Produto
            </Button>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 h-12 shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4 mr-2" /> Lançar Movimentação
            </Button>
          </div>
        }
      />

      {/* Alerts */}
      {produtosAlerta.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Produtos abaixo do mínimo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {produtosAlerta.map(p => (
              <div key={p.id} className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                <p className="font-medium text-foreground mb-1">{p.name || p.nome}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Min: {p.stock_min}</span>
                  <EstoqueIndicator atual={p.stock} minimo={p.stock_min} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movement history - 2-line card layout */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display font-bold text-foreground mb-4">Histórico de Movimentações</h3>
        {movements.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhuma movimentação registrada</p>
            <p className="text-xs mt-1">Lance uma movimentação para começar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {movements.map((m: any) => {
              const type = m.type || m.tipo;
              const cfg = getTypeConfig(type);
              const Icon = cfg.icon;
              const qty = m.quantity || m.quantidade;
              const productName = m.product_name || m.produto_nome;
              const reason = m.reason || m.motivo;
              const operator = m.operator_name || m.operador;
              const date = new Date(m.created_at || m.criado_em);

              return (
                <div key={m.id} className="rounded-xl border border-border/50 p-3 hover:bg-muted/10 transition-colors">
                  {/* Line 1: Type + Product + Quantity + Date */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-sm text-foreground truncate">{productName}</span>
                      <span className={`text-sm font-mono font-bold shrink-0 ${type === 'ENTRADA' ? 'text-primary' : type === 'SAIDA' ? 'text-destructive' : 'text-orange-500'}`}>
                        {cfg.sign}{qty}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                      {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {/* Line 2: Reason + Operator */}
                  <div className="flex items-center justify-between mt-1.5 pl-11">
                    <span className="text-xs text-muted-foreground truncate">{reason}</span>
                    {operator && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                        <User className="h-3 w-3" /> {operator}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[80vw] lg:max-w-[30vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Lançar Movimentação</DialogTitle>
            <DialogDescription>Registre uma entrada, saída ou ajuste de estoque.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select onValueChange={v => setNewMovement({ ...newMovement, product: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name || p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select defaultValue="ENTRADA" onValueChange={(v: any) => setNewMovement({ ...newMovement, type: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada (+)</SelectItem>
                  <SelectItem value="SAIDA">Saída (-)</SelectItem>
                  <SelectItem value="AJUSTE">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qtd">Quantidade</Label>
              <Input
                id="qtd"
                type="number"
                value={newMovement.quantity}
                onChange={e => setNewMovement({ ...newMovement, quantity: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Input
                id="reason"
                placeholder="Ex: Compra fornecedor"
                value={newMovement.reason}
                onChange={e => setNewMovement({ ...newMovement, reason: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSaveMovement} disabled={createMovementMutation.isPending} className="flex-1">
              {createMovementMutation.isPending ? 'Salvando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
