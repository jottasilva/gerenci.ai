import { PageHeader } from '@/components/shared/PageHeader';
import { operadoresMock } from '@/data/mock';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-primary/15 text-primary border-primary/30',
  GERENTE: 'bg-accent/15 text-accent border-accent/30',
  VENDEDOR: 'bg-muted text-muted-foreground',
};

export default function Operadores() {
  return (
    <div>
      <PageHeader
        titulo="Operadores"
        subtitulo="Gerencie sua equipe de vendas"
        actions={
          <Button className="bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Novo Operador
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {operadoresMock.map(op => (
          <div key={op.id} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {op.nome[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{op.nome}</p>
                <p className="text-xs text-muted-foreground font-mono">{op.whatsapp}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`text-xs ${roleColors[op.role]}`}>
                {op.role}
              </Badge>
              <span className={`text-xs font-medium ${op.ativo ? 'text-primary' : 'text-muted-foreground'}`}>
                {op.ativo ? '● Ativo' : '○ Inativo'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
