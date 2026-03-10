import { useState, useMemo } from 'react';
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, Users, Package, ChevronRight, Loader2, FileDown, Warehouse, Truck, ShoppingBag, Check, XCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell,
  AreaChart, Area, PieChart, Pie, Tooltip, Legend, ResponsiveContainer as RechartsContainer
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useGetProducts } from '@/services/product.service';
import { useGetOrders, useUpdateOrderStatus, useGetDashboardStats } from '@/services/order.service';
import { useGetCustomers } from '@/services/customer.service';
import { useStoreContext } from '@/contexts/StoreContext';
import { DashboardTutorial } from '@/components/dashboard/DashboardTutorial';
import { exportToCSV, exportToPDF } from '@/utils/exportUtils';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from "sonner";
import { Pedido, StatusPedido, DashboardStats } from '@/types';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { selectedStoreId } = useStoreContext();
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

  const [alertsApi, setAlertsApi] = useState<CarouselApi>();
  const [topProductsApi, setTopProductsApi] = useState<CarouselApi>();
  const [ordersApi, setOrdersApi] = useState<CarouselApi>();

  const semEstoque = useMemo(() => products.filter(p => p.stock <= 0), [products]);
  const estoqueBaixo = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= (p.min_stock || p.stock_min || 10)), [products]);

  const kpis = useMemo(() => stats?.kpis || {
    total_revenue: 0,
    avg_ticket: 0,
    total_orders: 0,
    total_customers: 0,
    inventory_value: 0,
    inventory_items: 0
  }, [stats]);

  const periodKpis = useMemo(() => stats?.period_kpis || {
    revenue: 0,
    profit: 0,
    orders: 0,
    avg_ticket: 0
  }, [stats]);

  const periodLabel = stats?.period_label || 'Hoje';

  const salesByCategory = useMemo(() => stats?.category_sales || [], [stats]);
  const paymentMethods = useMemo(() => stats?.payment_methods || [], [stats]);
  const peakHours = useMemo(() => {
    if (!stats?.peak_hours) return [];
    return Object.entries(stats.peak_hours).map(([hour, count]) => ({
      hour: `${hour}h`,
      count
    }));
  }, [stats]);

  const sortedOrders = useMemo(() => [...orders].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ), [orders]);

  const allAlerts = useMemo(() => [
    ...semEstoque.map(p => ({ ...p, status: 'SEM ESTOQUE', color: 'red' })),
    ...estoqueBaixo.map(p => ({ ...p, status: `Estoque Baixo (${p.stock} un)`, color: 'orange' }))
  ], [semEstoque, estoqueBaixo]);

  const sortedTopProducts = useMemo(() => [...(stats?.top_products || [])].sort((a: any, b: any) => b.total - a.total), [stats]);

  if (isLoadingProducts || isLoadingOrders || isLoadingCustomers || isLoadingStats) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Sincronizando dados...</p>
      </div>
    );
  }

  const handleExport = () => {
    const reportData = [
      { metrica: 'Faturamento Total', valor: `R$ ${kpis.total_revenue.toFixed(2)}` },
      { metrica: 'Ticket Médio', valor: `R$ ${kpis.avg_ticket.toFixed(2)}` },
      { metrica: 'Total de Pedidos', valor: kpis.total_orders },
      { metrica: 'Clientes Base', valor: kpis.total_customers },
    ];

    // Aggregating more detailed data if needed
    const topProdData = sortedTopProducts.map((p: any) => ({
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
            onClick={async () => {
              try {
                const response = await api.get('reports/pdf/', {
                  responseType: 'blob',
                  params: {
                    period: period,
                    store_id: selectedStoreId
                  }
                });

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                link.setAttribute('download', `relatorio_${period}_${timestamp}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success("Relatório gerado com sucesso!");
              } catch (err) {
                toast.error("Erro ao gerar relatório no servidor.");
                console.error(err);
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Exportar Relatório PDF
            {isLoadingStats && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          titulo={`Vendas ${periodLabel}`}
          valor={`R$ ${(periodKpis.revenue || 0).toFixed(2).replace('.', ',')}`}
          variacao={5.2}
          icon={DollarSign}
        />
        <KPICard
          titulo={`Lucro ${periodLabel}`}
          valor={`R$ ${(periodKpis.profit || 0).toFixed(2).replace('.', ',')}`}
          variacao={8.5}
          icon={TrendingUp}
          className="border-emerald-500/20 bg-emerald-500/5"
        />
        <KPICard
          titulo={`Pedidos ${periodLabel}`}
          valor={String(periodKpis.orders || 0)}
          variacao={12.8}
          icon={ShoppingCart}
        />
        <KPICard
          titulo={`Ticket Médio ${periodLabel}`}
          valor={`R$ ${(periodKpis.avg_ticket || 0).toFixed(2).replace('.', ',')}`}
          variacao={2.4}
          icon={TrendingUp}
        />
        <KPICard
          titulo="Patrimônio Estoque"
          valor={`R$ ${(kpis.inventory_value || 0).toFixed(2).replace('.', ',')}`}
          variacao={0}
          icon={Warehouse}
        />
        <KPICard
          titulo="Total Clientes"
          valor={String(kpis.total_customers)}
          variacao={2.1}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts/Stock - Com Carrossel para evitar overflow */}
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Atenção Necessária
            </h3>
            {allAlerts.length > 3 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md"
                onClick={() => alertsApi?.scrollTo(0)}
                title="Voltar ao início"
              >
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {allAlerts.length > 0 ? (
              <Carousel setApi={setAlertsApi} orientation="vertical" opts={{ align: "start", loop: false }} className="w-full">
                <CarouselContent className="h-[280px]">
                  {Array.from({ length: Math.ceil(allAlerts.length / 3) }).map((_, slideIndex) => {
                    const chunk = allAlerts.slice(slideIndex * 3, slideIndex * 3 + 3);

                    return (
                      <CarouselItem key={slideIndex} className="space-y-3 pt-4">
                        {chunk.map(p => (
                          <div
                            key={p.id}
                            onClick={() => window.location.href = '/estoque'}
                            className={`p-3 rounded-xl bg-${p.color}-500/5 border border-${p.color}-500/10 flex items-center justify-between group hover:bg-${p.color}-500/10 transition-colors cursor-pointer`}
                          >
                            <div>
                              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{p.name || p.nome}</p>
                              <p className={`text-[10px] text-${p.color}-600 uppercase font-bold tracking-wider`}>{p.status}</p>
                            </div>
                            <ChevronRight className={`h-4 w-4 text-${p.color}-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1`} />
                          </div>
                        ))}
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <div className="flex justify-end gap-2 mt-4">
                  <CarouselPrevious className="static translate-y-0" />
                  <CarouselNext className="static translate-y-0" />
                </div>
              </Carousel>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                <Package className="h-10 w-10 mb-2" />
                <p className="text-sm font-bold">Tudo sob controle</p>
                <p className="text-xs">Estoque em níveis saudáveis.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sales by Category */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 lg:col-span-2 h-[400px] flex flex-col">
          <h3 className="font-display font-bold text-foreground mb-6">Faturamento por Categoria</h3>
          <div className="flex-1 w-full min-h-0">
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
        {/* Top Products Carousel */}
        <div className="rounded-2xl border border-border bg-card p-5 h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-foreground">Produtos Mais Vendidos</h3>
            {sortedTopProducts.length > 5 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md"
                onClick={() => topProductsApi?.scrollTo(0)}
                title="Voltar ao início"
              >
                <TrendingUp className="h-3 w-3 text-primary" />
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            {sortedTopProducts.length > 0 ? (
              <Carousel setApi={setTopProductsApi} orientation="vertical" opts={{ align: "start", loop: false }} className="w-full">
                <CarouselContent className="h-[280px]">
                  {Array.from({ length: Math.ceil(sortedTopProducts.length / 5) }).map((_, slideIndex) => {
                    const chunk = sortedTopProducts.slice(slideIndex * 5, slideIndex * 5 + 5);
                    return (
                      <CarouselItem key={slideIndex} className="space-y-4 pt-4">
                        {chunk.map((p: any, i: number) => (
                          <div key={p.id} className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center font-bold text-xs">{(slideIndex * 5) + i + 1}</div>
                            <div className="flex-1">
                              <div className="flex justify-between items-end mb-1">
                                <p className="text-sm font-bold truncate max-w-[150px]">{p.nome}</p>
                                <p className="text-xs font-bold whitespace-nowrap">R$ {p.total.toFixed(2).replace('.', ',')}</p>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${(p.total / sortedTopProducts[0].total) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <div className="flex justify-end gap-2 mt-4">
                  <CarouselPrevious className="static translate-y-0" />
                  <CarouselNext className="static translate-y-0" />
                </div>
              </Carousel>
            ) : (
              <p className="text-center text-muted-foreground py-10">Nenhuma venda registrada ainda.</p>
            )}
          </div>
        </div>

        {/* Last Orders Carousel */}
        <div className="rounded-2xl border border-border bg-card h-[400px] flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/5 flex items-center justify-between">
            <h3 className="font-display font-bold text-foreground">Últimos Pedidos</h3>
            {sortedOrders.length > 5 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md"
                onClick={() => ordersApi?.scrollTo(0)}
                title="Voltar ao início"
              >
                <ShoppingCart className="h-3 w-3 text-primary" />
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            {sortedOrders.length > 0 ? (
              <Carousel setApi={setOrdersApi} orientation="vertical" opts={{ align: "start", loop: false }} className="w-full h-full px-5">
                <CarouselContent className="h-[260px]">
                  {Array.from({ length: Math.ceil(sortedOrders.length / 5) }).map((_, slideIndex) => {
                    const chunk = sortedOrders.slice(slideIndex * 5, slideIndex * 5 + 5);
                    return (
                      <CarouselItem key={slideIndex} className="pt-2">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground">
                              <th className="text-left py-2">CLIENTE</th>
                              <th className="text-right py-2">TOTAL</th>
                              <th className="text-right py-2">STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {chunk.map(p => (
                              <tr
                                key={p.id}
                                onClick={() => {
                                  setSelectedOrder(p);
                                  setIsOrderDetailOpen(true);
                                }}
                                className="border-b border-border/50 hover:bg-primary/5 cursor-pointer transition-colors"
                              >
                                <td className="py-2 font-bold">{p.cliente_name || p.cliente_name_manual || 'Balcão'}</td>
                                <td className="py-2 text-right font-bold">R$ {parseFloat(p.total.toString()).toFixed(2).replace('.', ',')}</td>
                                <td className="py-2 text-right"><StatusBadge status={p.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <div className="flex justify-end gap-2 p-4 border-t border-border mt-auto">
                  <CarouselPrevious className="static translate-y-0" />
                  <CarouselNext className="static translate-y-0" />
                </div>
              </Carousel>
            ) : (
              <p className="text-center text-muted-foreground py-10">Nenhum pedido encontrado.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <div className="rounded-2xl border border-border bg-card p-5 h-[400px] flex flex-col">
          <h3 className="font-display font-bold text-foreground mb-4">Meios de Pagamento</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {paymentMethods.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2 h-[400px] flex flex-col">
          <h3 className="font-display font-bold text-foreground mb-4">Horários de Pico (Movimentação)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={peakHours}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="hour" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          {/* ... Dialog Content ... */}
        </DialogContent>
      </Dialog>
      <DashboardTutorial />
    </div>
  );
}
