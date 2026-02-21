import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, Users, Package, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, Cell } from 'recharts';
import { KPICard } from '@/components/shared/KPICard';
import { StatusBadge, PagamentoBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';
import { useGetProducts } from '@/services/product.service';
import { useGetOrders } from '@/services/order.service';
import { useGetCustomers } from '@/services/customer.service';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { data: products = [], isLoading: isLoadingProducts } = useGetProducts();
  const { data: orders = [], isLoading: isLoadingOrders } = useGetOrders();
  const { data: customers = [], isLoading: isLoadingCustomers } = useGetCustomers();

  if (isLoadingProducts || isLoadingOrders || isLoadingCustomers) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Sincronizando dados...</p>
      </div>
    );
  }

  const produtosEstoqueBaixo = products.filter(p => p.stock <= p.stock_min);
  const ordersValidas = orders.filter(p => p.status !== 'CANCELADO');
  const totalFaturamento = ordersValidas.reduce((sum, p) => sum + parseFloat(p.total.toString()), 0);
  const ticketMedio = ordersValidas.length > 0 ? totalFaturamento / ordersValidas.length : 0;

  // Category Distribution
  const vendasPorCategoria = products.reduce((acc: any[], prod) => {
    const totalProd = ordersValidas
      .flatMap(p => p.items || [])
      .filter(item => item.product === prod.id)
      .reduce((sum, item) => sum + parseFloat(item.subtotal.toString()), 0);

    const catName = prod.category_name || "Sem Categoria";
    const existingCat = acc.find(c => c.name === catName);
    if (existingCat) {
      existingCat.value += totalProd;
    } else if (totalProd > 0) {
      acc.push({ name: catName, value: totalProd });
    }
    return acc;
  }, []);

  // Top Products
  const topProdutos = products
    .map(prod => ({
      id: prod.id,
      nome: prod.name,
      total: ordersValidas
        .flatMap(p => p.items || [])
        .filter(item => item.product === prod.id)
        .reduce((sum, item) => sum + parseFloat(item.subtotal.toString()), 0)
    }))
    .filter(p => p.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8">
      <PageHeader titulo="Dashboard" subtitulo="Visão geral e inteligência do seu negócio" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard titulo="Faturamento Total" valor={`R$ ${totalFaturamento.toFixed(2).replace('.', ',')}`} variacao={15.2} icon={DollarSign} />
        <KPICard titulo="Ticket Médio" valor={`R$ ${ticketMedio.toFixed(2).replace('.', ',')}`} variacao={5.4} icon={TrendingUp} />
        <KPICard titulo="Total de Pedidos" valor={String(orders.length)} variacao={12.8} icon={ShoppingCart} />
        <KPICard titulo="Clientes Base" valor={String(customers.length)} variacao={2.1} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts/Stock */}
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col min-h-[300px]">
          <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Atenção Necessária
          </h3>
          <ScrollArea className="flex-1 -mx-1 px-1">
            <div className="space-y-3">
              {produtosEstoqueBaixo.length > 0 ? (
                produtosEstoqueBaixo.map(p => (
                  <div key={p.id} className="p-3 rounded-xl bg-destructive/5 border border-destructive/10 flex items-center justify-between group hover:bg-destructive/10 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Restam apenas {p.stock} un</p>
                    </div>
                  </div>
                ))
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
              <BarChart data={vendasPorCategoria}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {vendasPorCategoria.map((entry, index) => (
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
            {topProdutos.length > 0 ? topProdutos.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center font-bold">{i + 1}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-sm font-bold">{p.nome}</p>
                    <p className="text-xs font-bold">R$ {p.total.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${(p.total / topProdutos[0].total) * 100}%` }} />
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
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4 font-bold">{p.cliente_name || p.cliente_name_manual || 'Balcão'}</td>
                    <td className="py-3 px-4 text-right font-bold">R$ {parseFloat(p.total.toString()).toFixed(2)}</td>
                    <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
