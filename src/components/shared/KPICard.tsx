import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  titulo: string;
  valor: string;
  variacao?: number;
  icon: React.ElementType;
  className?: string;
}

export function KPICard({ titulo, valor, variacao, icon: Icon, className }: KPICardProps) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-all hover:-translate-y-0.5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{titulo}</span>
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-display font-bold text-foreground">{valor}</p>
      {variacao !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${variacao >= 0 ? 'text-primary' : 'text-destructive'
          }`}>
          {variacao >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {variacao >= 0 ? '+' : ''}{variacao}% vs ontem
        </div>
      )}
    </div>
  );
}
