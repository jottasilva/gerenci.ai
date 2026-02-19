interface EstoqueIndicatorProps {
  atual: number;
  minimo: number;
}

export function EstoqueIndicator({ atual, minimo }: EstoqueIndicatorProps) {
  const ratio = Math.min(atual / Math.max(minimo * 2, 1), 1);
  const isLow = atual < minimo;
  const isZero = atual === 0;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isZero ? 'bg-destructive' : isLow ? 'bg-warning' : 'bg-primary'
          }`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${
        isZero ? 'text-destructive' : isLow ? 'text-warning' : 'text-muted-foreground'
      }`}>
        {atual}
      </span>
    </div>
  );
}
