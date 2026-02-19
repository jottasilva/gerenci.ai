import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { KPICard } from '@/components/shared/KPICard';
import { StatusBadge, PagamentoBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { pedidosMock, produtosMock, vendasUltimos7Dias } from '@/data/mock';

export default function Dashboard() {
  const produtosEstoqueBaixo = produtosMock.filter(p => p.estoque < p.estoque_min);
  const pedidosHoje = pedidosMock.filter(p => p.criado_em === '2025-02-19');
  const vendasHoje = pedidosHoje.filter(p => p.status !== 'CANCELADO').reduce((s, p) => s + p.total, 0);

  return (
    <div>
      <PageHeader titulo="Dashboard" subtitulo="Visão geral do seu negócio" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard titulo="Vendas Hoje" valor={`R$ ${vendasHoje.toFixed(2).replace('.', ',')}`} variacao={12.4} icon={DollarSign} />
        <KPICard titulo="Pedidos do Dia" valor={String(pedidosHoje.length)} variacao={8.2} icon={ShoppingCart} />
        <KPICard titulo="Estoque Baixo" valor={String(produtosEstoqueBaixo.length)} icon={AlertTriangle} />
        <KPICard titulo="Ticket Médio" valor={pedidosHoje.length > 0 ? `R$ ${(vendasHoje / pedidosHoje.length).toFixed(2).replace('.', ',')}` : 'R$ 0,00'} variacao={3.1} icon={TrendingUp} />
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display font-bold text-foreground mb-4">Vendas — Últimos 7 dias</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={vendasUltimos7Dias}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152,100%,45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152,100%,45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,10%,15%)" />
              <XAxis dataKey="dia" stroke="hsl(205,15%,55%)" fontSize={12} />
              <YAxis stroke="hsl(205,15%,55%)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'hsl(210,25%,7%)', border: '1px solid hsl(210,10%,15%)', borderRadius: 12, color: 'hsl(210,25%,96%)' }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
              />
              <Area type="monotone" dataKey="vendas" stroke="hsl(152,100%,45%)" fill="url(#greenGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display font-bold text-foreground mb-4">Alertas</h3>
          <div className="space-y-3">
            {produtosEstoqueBaixo.map(p => (
              <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">Estoque: {p.estoque} (mín: {p.estoque_min})</p>
                </div>
              </div>
            ))}
            {produtosEstoqueBaixo.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display font-bold text-foreground mb-4">Últimos Pedidos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-3 px-2 font-medium">#</th>
                <th className="text-left py-3 px-2 font-medium">Cliente</th>
                <th className="text-right py-3 px-2 font-medium">Total</th>
                <th className="text-left py-3 px-2 font-medium">Pagamento</th>
                <th className="text-left py-3 px-2 font-medium">Status</th>
                <th className="text-right py-3 px-2 font-medium">Hora</th>
              </tr>
            </thead>
            <tbody>
              {pedidosMock.slice(0, 5).map((p, i) => (
                <tr key={p.id} className={`border-b border-border/50 hover:bg-primary/[0.02] transition-colors ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                  <td className="py-3 px-2 font-mono text-xs text-muted-foreground">{p.id}</td>
                  <td className="py-3 px-2 font-medium text-foreground">{p.cliente}</td>
                  <td className="py-3 px-2 text-right font-medium text-foreground">R$ {p.total.toFixed(2).replace('.', ',')}</td>
                  <td className="py-3 px-2"><PagamentoBadge tipo={p.forma_pagto} /></td>
                  <td className="py-3 px-2"><StatusBadge status={p.status} /></td>
                  <td className="py-3 px-2 text-right text-muted-foreground">{p.hora}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
