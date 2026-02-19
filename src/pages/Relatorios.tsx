import { PageHeader } from '@/components/shared/PageHeader';
import { BarChart3 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

export default function Relatorios() {
  return (
    <div>
      <PageHeader titulo="Relatórios" subtitulo="Análises detalhadas do seu negócio" />
      <EmptyState
        icon={BarChart3}
        titulo="Relatórios em breve"
        descricao="Os relatórios avançados com gráficos de vendas, estoque, clientes e operadores estão sendo desenvolvidos."
      />
    </div>
  );
}
