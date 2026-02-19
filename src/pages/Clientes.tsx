import { Search, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/PageHeader';
import { clientesMock } from '@/data/mock';

export default function Clientes() {
  const [search, setSearch] = useState('');
  const filtered = clientesMock.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) || c.whatsapp.includes(search)
  );

  return (
    <div>
      <PageHeader
        titulo="Clientes"
        subtitulo="Cadastro e histórico de clientes"
        actions={
          <Button className="bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90">
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
          className="pl-9 bg-card border-border rounded-xl"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="text-left py-3 px-4 font-medium">Nome</th>
                <th className="text-left py-3 px-4 font-medium">WhatsApp</th>
                <th className="text-left py-3 px-4 font-medium">Email</th>
                <th className="text-right py-3 px-4 font-medium">Total Compras</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className={`border-b border-border/50 hover:bg-primary/[0.02] transition-colors ${i % 2 === 1 ? 'bg-muted/10' : ''}`}>
                  <td className="py-3 px-4 font-medium text-foreground">{c.nome}</td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{c.whatsapp}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.email || '—'}</td>
                  <td className="py-3 px-4 text-right font-medium text-foreground">R$ {c.total_compras.toFixed(2).replace('.', ',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
