import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  titulo: string;
  descricao: string;
}

export function EmptyState({ icon: Icon, titulo, descricao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-display font-bold text-lg text-foreground mb-1">{titulo}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{descricao}</p>
    </div>
  );
}
