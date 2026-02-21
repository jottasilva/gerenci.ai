import { ReactNode } from 'react';

interface PageHeaderProps {
  titulo: string;
  subtitulo?: string;
  actions?: ReactNode;
}

export function PageHeader({ titulo, subtitulo, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pl-16 sm:pl-0">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{titulo}</h1>
        {subtitulo && <p className="text-sm text-muted-foreground mt-0.5">{subtitulo}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
