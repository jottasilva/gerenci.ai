import { useState } from 'react';
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, Users, Package, ChevronRight, Loader2, FileDown, Warehouse, Truck, ShoppingBag, Check, XCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell,
  AreaChart, Area
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/shared/KPICard';
import { StatusBadge, PagamentoBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetProducts } from '@/services/product.service';
import { useGetOrders, useUpdateOrderStatus, useGetDashboardStats } from '@/services/order.service';
import { useGetCustomers } from '@/services/customer.service';
import { DashboardTutorial } from '@/components/dashboard/DashboardTutorial';
import { exportToCSV } from '@/utils/exportUtils';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from "sonner";
import { Pedido, StatusPedido } from '@/types';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [period, setPeriod] = useState('diario');
  const { data: products = [], isLoading: isLoadingProducts } = useGetProducts();
  const { data: orders = [], isLoading: isLoadingOrders } = useGetOrders();
  const { data: customers = [], isLoading: isLoadingCustomers } = useGetCustomers();
  const { data: stats, isLoading: isLoadingStats, error } = useGetDashboardStats(period);

  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const queryClient = useQueryClient();
  const updateStatusMutation = useUpdateOrderStatus();

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Deseja realmente cancelar este pedido? O estoque será estornado.")) return;
    try {
      await api.post(`orders/${orderId}/cancel/`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsOrderDetailOpen(false);
      toast.success("Pedido cancelado com sucesso!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro ao cancelar pedido.");
    }
  };

  const handleUpdateStatus = async (id: string, status: StatusPedido) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (err) { }
  };

  if (isLoadingProducts || isLoadingOrders || isLoadingCustomers || isLoadingStats) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Sincronizando dados...</p>
      </div>
    );
  }

  const semEstoque = products.filter(p => p.stock <= 0);
  const estoqueBaixo = products.filter(p => p.stock > 0 && p.stock <= (p.min_stock || p.stock_min || 10));

  const kpis = stats?.kpis || {
    total_revenue: 0,
    avg_ticket: 0,
    total_orders: 0,
    total_customers: 0
  };

  const salesByCategory = stats?.category_sales || [];
  const topProducts = stats?.top_products || [];

  const handleExport = () => {
    const reportData = [
      { metrica: 'Faturamento Total', valor: `R$ ${kpis.total_revenue.toFixed(2)}` },
      { metrica: 'Ticket Médio', valor: `R$ ${kpis.avg_ticket.toFixed(2)}` },
      { metrica: 'Total de Pedidos', valor: kpis.total_orders },
      { metrica: 'Clientes Base', valor: kpis.total_customers },
    ];

    // Aggregating more detailed data if needed
    const topProdData = topProducts.map((p: any) => ({
      produto: p.nome,
      total_vendas: `R$ ${p.total.toFixed(2)}`
    }));

    const stockAlertData = [
      ...semEstoque.map(p => ({ produto: p.name, alert: 'SEM ESTOQUE', qtd: 0 })),
      ...estoqueBaixo.map(p => ({ produto: p.name, alert: 'ESTOQUE BAIXO', qtd: p.stock }))
    ];

    exportToCSV('relatorio_dashboard', [
      ...reportData.map(r => ({ Categoria: 'KPI', Item: r.metrica, Valor: r.valor })),
      ...topProdData.map(p => ({ Categoria: 'Top Produto', Item: p.produto, Valor: p.total_vendas })),
      ...stockAlertData.map(s => ({ Categoria: 'Alerta Estoque', Item: s.produto, Valor: `${s.alert} (${s.qtd} un)` }))
    ], ['CATEGORIA', 'ITEM', 'VALOR']);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground font-medium">Bem-vindo de volta ao seu centro de comando.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] rounded-xl font-bold">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diario">Diário</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="rounded-xl border-dashed font-bold h-10 px-6"
            onClick={() => exportToCSV(stats?.daily_sales || [], 'relatorio_vendas')}
          >
            <Download className="mr-2 h-4 w-4" /> Exportar Relatório
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          titulo="Vendas Hoje"
          valor={`R$ ${(stats?.today?.revenue || 0).toFixed(2).replace('.', ',')}`}
          variacao={5.2}
          icon={DollarSign}
        />
        <KPICard
          titulo="Pedidos Hoje"
          valor={String(stats?.today?.orders || 0)}
          variacao={12.8}
          icon={ShoppingCart}
        />
        <KPICard
          titulo="Ticket Médio Hoje"
          valor={`R$ ${(stats?.today?.avg_ticket || 0).toFixed(2).replace('.', ',')}`}
          variacao={2.4}
          icon={TrendingUp}
        />
        <KPICard
          titulo="Total Clientes"
          valor={String(kpis.total_customers)}
          variacao={2.1}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts/Stock */}
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col min-h-[300px]">
          <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Atenção Necessária
          </h3>
          <ScrollArea className="flex-1 -mx-1 px-1">
            <div className="space-y-3">
              {semEstoque.length > 0 || estoqueBaixo.length > 0 ? (
                <>
                  {semEstoque.map(p => (
                    <div
                      key={p.id}
                      onClick={() => window.location.href = '/estoque'}
                      className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-between group hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-bold text-foreground group-hover:text-red-600 transition-colors">{p.name || p.nome}</p>
                        <p className="text-[10px] text-red-600 uppercase font-bold tracking-wider">Sem Estoque</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-red-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                    </div>
                  ))}
                  {estoqueBaixo.map(p => (
                    <div
                      key={p.id}
                      onClick={() => window.location.href = '/estoque'}
                      className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-between group hover:bg-orange-500/10 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-bold text-foreground group-hover:text-orange-600 transition-colors">{p.name || p.nome}</p>
                        <p className="text-[10px] text-orange-600 uppercase font-bold tracking-wider">Estoque Baixo ({p.stock} un)</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-orange-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                  <Package className="h-10 w-10 mb-2" />
                  <p className="text-sm font-bold">Tudo sob controle</p>
                  <p className="text-xs">Estoque em níveis saudáveis.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Sales by Category */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 lg:col-span-2">
          <h3 className="font-display font-bold text-foreground mb-6">Faturamento por Categoria</h3>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {salesByCategory.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display font-bold text-foreground mb-6">Produtos Mais Vendidos</h3>
          <div className="space-y-5">
            {topProducts.length > 0 ? topProducts.map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center font-bold">{i + 1}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-sm font-bold">{p.nome}</p>
                    <p className="text-xs font-bold">R$ {p.total.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${(p.total / topProducts[0].total) * 100}%` }} />
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-10">Nenhuma venda registrada ainda.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/5">
            <h3 className="font-display font-bold text-foreground">Últimos Pedidos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/10 text-muted-foreground">
                  <th className="text-left py-3 px-4">CLIENTE</th>
                  <th className="text-right py-3 px-4">TOTAL</th>
                  <th className="text-left py-3 px-4">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(p => (
                  <tr
                    key={p.id}
                    onClick={() => {
                      setSelectedOrder(p);
                      setIsOrderDetailOpen(true);
                    }}
                    className="border-b border-border/50 hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-bold">{p.cliente_name || p.cliente_name_manual || 'Balcão'}</td>
                    <td className="py-3 px-4 text-right font-bold">R$ {parseFloat(p.total.toString()).toFixed(2).replace('.', ',')}</td>
                    <td className="py-3 px-4 text-right"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-muted/30 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-display font-bold">Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
                <DialogDescription>
                  {selectedOrder?.created_at && new Date(selectedOrder.created_at).toLocaleString()}
                </DialogDescription>
              </div>
              <StatusBadge status={selectedOrder?.status || 'REALIZADO'} />
            </div>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-bold">{selectedOrder?.cliente_name || selectedOrder?.cliente_name_manual || 'Balcão'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Forma de Pagamento:</span>
                <span className="font-bold">{selectedOrder?.payment_method || selectedOrder?.forma_pagto}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Operador:</span>
                <span className="font-bold">{selectedOrder?.operador_nome || selectedOrder?.operator_name || 'Admin'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Tipo de Entrega:</span>
                <div className="flex items-center gap-2 font-bold">
                  {selectedOrder?.delivery_method === 'BALCAO' && <Warehouse className="h-4 w-4" />}
                  {selectedOrder?.delivery_method === 'ENTREGA' && <Truck className="h-4 w-4" />}
                  {selectedOrder?.delivery_method === 'RETIRADA' && <ShoppingBag className="h-4 w-4" />}
                  {selectedOrder?.delivery_method || 'BALCAO'}
                </div>
              </div>
              {selectedOrder?.delivery_method === 'ENTREGA' && (selectedOrder?.delivery_address || (selectedOrder as any)?.endereco_entrega) && (
                <div className="space-y-1 pt-2 border-t border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Endereço de Entrega:</span>
                  <p className="text-sm bg-muted/30 p-3 rounded-xl border border-border/50 italic">{selectedOrder.delivery_address || (selectedOrder as any)?.endereco_entrega}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Itens do Pedido</p>
              <div className="space-y-2 border border-border rounded-xl p-3 bg-muted/10">
                {(selectedOrder?.items || selectedOrder?.itens || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-none">
                    <span>{item.quantity}x {item.product_name || item.nome}</span>
                    <span className="font-bold">R$ {parseFloat(item.subtotal.toString()).toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
                {Number(selectedOrder?.delivery_fee || (selectedOrder as any)?.taxa_entrega || 0) > 0 && (
                  <div className="flex justify-between text-sm py-1 font-bold text-primary">
                    <span>Taxa de Entrega</span>
                    <span>R$ {parseFloat((selectedOrder?.delivery_fee || (selectedOrder as any)?.taxa_entrega || 0).toString()).toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-between items-end gap-4">
              <div className="space-y-1 min-w-fit">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-display font-extrabold text-primary">R$ {parseFloat(selectedOrder?.total?.toString() || '0').toFixed(2).replace('.', ',')}</p>
              </div>

              <div className="flex-1 max-w-[200px] space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Alterar Status</p>
                <select
                  value={selectedOrder?.status}
                  onChange={(e) => handleUpdateStatus((selectedOrder as any).id, e.target.value as StatusPedido)}
                  disabled={updateStatusMutation.isPending}
                  className="w-full h-10 rounded-xl bg-muted/50 border-none px-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:bg-muted transition-colors"
                >
                  <option value="REALIZADO">Realizado (Inicial)</option>
                  <option value="PREPARANDO">Preparando</option>
                  <option value="ENVIADO">Enviado</option>
                  <option value="FINALIZADO">Finalizado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <DashboardTutorial />
    </div>
  );
}
