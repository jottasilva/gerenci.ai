import { AlertTriangle, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EstoqueIndicator } from '@/components/shared/EstoqueIndicator';
import { produtosMock, movimentosMock } from '@/data/mock';

export default function Estoque() {
  const produtosAlerta = produtosMock.filter(p => p.estoque < p.estoque_min);

  return (
    <div>
      <PageHeader titulo="Estoque" subtitulo="Controle e movimentações de estoque" />

      {/* Alerts */}
      {produtosAlerta.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Produtos abaixo do mínimo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {produtosAlerta.map(p => (
              <div key={p.id} className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                <p className="font-medium text-foreground mb-1">{p.nome}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Min: {p.estoque_min}</span>
                  <EstoqueIndicator atual={p.estoque} minimo={p.estoque_min} />
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
              {movimentosMock.map((m, i) => (
                <tr key={m.id} className={`border-b border-border/50 ${i % 2 === 1 ? 'bg-muted/10' : ''}`}>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${
                      m.tipo === 'ENTRADA' ? 'bg-primary/10 text-primary' :
                      m.tipo === 'SAIDA' ? 'bg-destructive/10 text-destructive' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {m.tipo === 'ENTRADA' ? <ArrowDown className="h-3 w-3" /> :
                       m.tipo === 'SAIDA' ? <ArrowUp className="h-3 w-3" /> :
                       <Minus className="h-3 w-3" />}
                      {m.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-foreground">{m.produto_nome}</td>
                  <td className="py-3 px-3 text-right font-mono text-foreground">{m.quantidade}</td>
                  <td className="py-3 px-3 text-muted-foreground">{m.motivo}</td>
                  <td className="py-3 px-3 text-muted-foreground">{m.operador}</td>
                  <td className="py-3 px-3 text-right text-muted-foreground text-xs">{m.criado_em}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
