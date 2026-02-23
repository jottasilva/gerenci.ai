import { useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Minus, Plus, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EstoqueIndicator } from '@/components/shared/EstoqueIndicator';
import { Button } from '@/components/ui/button';
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

      {/* Movement history */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display font-bold text-foreground mb-4">Histórico de Movimentações</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-3 px-3 font-medium">Tipo</th>
                <th className="text-left py-3 px-3 font-medium">Produto</th>
                <th className="text-right py-3 px-3 font-medium">Qtd</th>
                <th className="text-left py-3 px-3 font-medium">Motivo</th>
                <th className="text-left py-3 px-3 font-medium">Operador</th>
                <th className="text-right py-3 px-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m, i) => (
                <tr key={m.id} className={`border-b border-border/50 ${i % 2 === 1 ? 'bg-muted/10' : ''}`}>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${(m.type || m.tipo) === 'ENTRADA' ? 'bg-primary/10 text-primary' :
                      (m.type || m.tipo) === 'SAIDA' ? 'bg-destructive/10 text-destructive' :
                        'bg-orange-500/10 text-orange-500'
                      }`}>
                      {(m.type || m.tipo) === 'ENTRADA' ? <ArrowDown className="h-3 w-3" /> :
                        (m.type || m.tipo) === 'SAIDA' ? <ArrowUp className="h-3 w-3" /> :
                          <Minus className="h-3 w-3" />}
                      {m.type || m.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-foreground">{m.product_name || m.produto_nome}</td>
                  <td className="py-3 px-3 text-right font-mono text-foreground">{m.quantity || m.quantidade}</td>
                  <td className="py-3 px-3 text-muted-foreground">{m.reason || m.motivo}</td>
                  <td className="py-3 px-3 text-muted-foreground">{m.operator_name || m.operador}</td>
                  <td className="py-3 px-3 text-right text-muted-foreground text-xs">{new Date(m.created_at || m.criado_em!).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
