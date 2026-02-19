import { PageHeader } from '@/components/shared/PageHeader';
import { Settings } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

export default function Configuracoes() {
  return (
    <div>
      <PageHeader titulo="Configurações" subtitulo="Configure sua empresa e o bot" />
      <EmptyState
        icon={Settings}
        titulo="Configurações em breve"
        descricao="Aqui você poderá configurar mensagens do bot, alertas, descontos e integrações com WhatsApp."
      />
    </div>
  );
}
