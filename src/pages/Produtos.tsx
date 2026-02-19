import { useState } from 'react';
import { Plus, Search, Package as PackageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/PageHeader';
import { EstoqueIndicator } from '@/components/shared/EstoqueIndicator';
import { produtosMock } from '@/data/mock';
import { Badge } from '@/components/ui/badge';

export default function Produtos() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('TODOS');

  const categorias = ['TODOS', ...new Set(produtosMock.map(p => p.categoria))];
  const filtered = produtosMock.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'TODOS' || p.categoria === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div>
      <PageHeader
        titulo="Produtos"
        subtitulo="Gerencie seu catálogo de produtos"
        actions={
          <Button className="bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Novo Produto
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto ou SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border rounded-xl"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categorias.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                catFilter === c ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {c === 'TODOS' ? 'Todos' : c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(p => (
          <div
            key={p.id}
            className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <PackageIcon className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline" className={`text-xs ${p.ativo ? 'text-primary border-primary/30' : 'text-muted-foreground border-border'}`}>
                {p.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <h3 className="font-medium text-foreground mb-0.5">{p.nome}</h3>
            <p className="text-xs text-muted-foreground mb-3">SKU: {p.sku} • {p.categoria}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-display font-bold text-foreground">
                R$ {p.preco.toFixed(2).replace('.', ',')}
              </span>
              <EstoqueIndicator atual={p.estoque} minimo={p.estoque_min} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
