import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge, PagamentoBadge } from '@/components/shared/StatusBadge';
import { pedidosMock } from '@/data/mock';
import { StatusPedido } from '@/types';

export default function Pedidos() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusPedido | 'TODOS'>('TODOS');

  const filtered = pedidosMock.filter(p => {
    const matchSearch = p.cliente.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'TODOS' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statuses: (StatusPedido | 'TODOS')[] = ['TODOS', 'ABERTO', 'CONFIRMADO', 'EM_PREPARO', 'ENTREGUE', 'CANCELADO'];

  return (
    <div>
      <PageHeader
        titulo="Pedidos"
        subtitulo="Gerencie todos os pedidos da sua loja"
        actions={
          <Button className="bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Novo Pedido
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou número..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border rounded-xl"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'TODOS' ? 'Todos' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="text-left py-3 px-4 font-medium">#</th>
                <th className="text-left py-3 px-4 font-medium">Cliente</th>
                <th className="text-left py-3 px-4 font-medium">Itens</th>
                <th className="text-right py-3 px-4 font-medium">Total</th>
                <th className="text-left py-3 px-4 font-medium">Pagamento</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-right py-3 px-4 font-medium">Hora</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className={`border-b border-border/50 hover:bg-primary/[0.02] transition-colors ${i % 2 === 1 ? 'bg-muted/10' : ''}`}>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{p.id}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{p.cliente}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{p.itens.length} itens</td>
                  <td className="py-3 px-4 text-right font-medium text-foreground">R$ {p.total.toFixed(2).replace('.', ',')}</td>
                  <td className="py-3 px-4"><PagamentoBadge tipo={p.forma_pagto} /></td>
                  <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{p.hora}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">Nenhum pedido encontrado</div>
        )}
      </div>
    </div>
  );
}
