export interface Produto {
  id: string;
  name: string;
  nome?: string; // Compatibility
  description?: string;
  descricao?: string; // Compatibility
  price: number;
  preco?: number; // Compatibility
  stock: number;
  estoque?: number; // Compatibility
  stock_min: number;
  min_stock?: number; // Backend alignment
  estoque_min?: number; // Compatibility
  category?: string | null;
  categoria?: string; // Compatibility
  category_name?: string;
  categoria_name?: string; // Compatibility
  sku: string;
  is_active?: boolean;
  ativo?: boolean; // Compatibility
}

export interface Pedido {
  id: string;
  customer?: string;
  cliente?: string; // Compatibility
  cliente_name?: string;
  cliente_name_manual?: string;
  operator?: string;
  operator_name?: string;
  operador_nome?: string; // Compatibility
  total: number;
  discount: number;
  desconto?: number; // Compatibility
  payment_method: FormaPagamento;
  forma_pagto?: FormaPagamento; // Compatibility
  status: StatusPedido;
  notes?: string;
  observacao?: string; // Compatibility
  created_at: string;
  criado_em?: string; // Compatibility
  items: ItemPedido[];
  itens?: ItemPedido[]; // Compatibility
  received_amount?: number;
  valor_recebido?: number; // Compatibility
  change_amount?: number;
  troco?: number; // Compatibility
  delivery_method?: 'BALCAO' | 'ENTREGA' | 'RETIRADA';
  tipo_entrega?: 'BALCAO' | 'ENTREGA' | 'RETIRADA'; // Compatibility
  pix_qr_code?: string;
  pix_qrcode?: string; // Compatibility
  delivery_fee?: number;
  taxa_entrega?: number; // Compatibility
  delivery_address?: string;
  endereco_entrega?: string; // Compatibility
}

export interface ItemPedido {
  id?: string;
  product: string;
  produto_id?: string; // Compatibility
  product_name: string;
  nome?: string; // Compatibility
  quantity: number;
  quantidade?: number; // Compatibility
  unit_price: number;
  preco_unit?: number; // Compatibility
  subtotal: number;
}

export interface Cliente {
  id: string;
  nome: string;
  name?: string; // Standard
  whatsapp: string;
  email?: string;
  endereco?: string;
  address?: string; // Standard
  cpf_cnpj?: string;
  total_compras: number | string;
  ativo: boolean;
  is_active?: boolean; // Standard

  // Platform Management
  business_name?: string;
  negocio?: string; // Alias
  business_segment?: string;
  segmento?: string; // Alias
  subscription_plan?: 'BRONZE' | 'SILVER' | 'GOLD';
  plano?: 'BRONZE' | 'SILVER' | 'GOLD'; // Alias
  agent_active?: boolean;
  agente_ativo?: boolean; // Alias
}

export interface Operador {
  id: string;
  nome?: string; // Compatibility
  first_name?: string;
  last_name?: string;
  store_name?: string;
  whatsapp: string;
  role: 'ADMIN' | 'GERENTE' | 'VENDEDOR';
  ativo?: boolean;
  is_active?: boolean;
  store?: number | null;
}

export interface MovimentoEstoque {
  id: string;
  product: string;
  produto_id?: string; // Compatibility
  product_name?: string;
  produto_nome?: string; // Compatibility
  type: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  tipo?: 'ENTRADA' | 'SAIDA' | 'AJUSTE'; // Compatibility
  quantity: number;
  quantidade?: number; // Compatibility
  reason: string;
  motivo?: string; // Compatibility
  operator_name?: string;
  operador?: string; // Compatibility
  created_at: string;
  criado_em?: string; // Compatibility
}

export type StatusPedido = 'REALIZADO' | 'PREPARANDO' | 'ENVIADO' | 'FINALIZADO' | 'CANCELADO';
export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO' | 'FIADO';

export interface PlanLimits {
  max_products: number;
  max_operators: number;
  max_whatsapp: number;
  advanced_reports?: boolean;
  api_access?: boolean;
  multi_store?: boolean;
  priority_support?: boolean;
  dedicated_support?: boolean;
  sla?: boolean;
  [key: string]: any;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: 'basico' | 'pro' | 'enterprise';
  price: number | string;
  description: string;
  is_active: boolean;
  is_highlighted: boolean;
  limits: PlanLimits;
  features: string[];
}
