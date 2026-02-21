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
  whatsapp: string;
  email?: string;
  endereco?: string;
  cpf_cnpj?: string;
  total_compras: number | string;
  ativo: boolean;
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
  store?: string | null;
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

export type StatusPedido = 'ABERTO' | 'CONFIRMADO' | 'EM_PREPARO' | 'ENTREGUE' | 'CANCELADO';
export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO' | 'FIADO';
