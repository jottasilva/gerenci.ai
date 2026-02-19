import { StatusPedido, FormaPagamento } from '@/types';
import { Badge } from '@/components/ui/badge';
import { 
  Banknote, QrCode, CreditCard, AlertTriangle,
  CheckCircle2, Clock, Truck, XCircle, Package
} from 'lucide-react';

const statusConfig: Record<StatusPedido, { label: string; className: string; icon: React.ElementType }> = {
  ABERTO: { label: 'Aberto', className: 'bg-muted text-muted-foreground', icon: Clock },
  CONFIRMADO: { label: 'Confirmado', className: 'bg-primary/15 text-primary border-primary/30', icon: CheckCircle2 },
  EM_PREPARO: { label: 'Em Preparo', className: 'bg-warning/15 text-warning border-warning/30', icon: Package },
  ENTREGUE: { label: 'Entregue', className: 'bg-primary/15 text-primary border-primary/30', icon: Truck },
  CANCELADO: { label: 'Cancelado', className: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
};

export function StatusBadge({ status }: { status: StatusPedido }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.className} gap-1 font-body font-medium text-xs`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

const pagamentoConfig: Record<FormaPagamento, { label: string; icon: React.ElementType }> = {
  DINHEIRO: { label: 'Dinheiro', icon: Banknote },
  PIX: { label: 'PIX', icon: QrCode },
  CARTAO_DEBITO: { label: 'Débito', icon: CreditCard },
  CARTAO_CREDITO: { label: 'Crédito', icon: CreditCard },
  FIADO: { label: 'Fiado', icon: AlertTriangle },
};

export function PagamentoBadge({ tipo }: { tipo: FormaPagamento }) {
  const config = pagamentoConfig[tipo];
  const Icon = config.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
