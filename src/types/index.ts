export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  estoque_min: number;
  categoria: string;
  sku: string;
  ativo: boolean;
}

export interface Pedido {
  id: string;
  cliente: string;
  cliente_id?: string;
  operador?: string;
  itens: ItemPedido[];
  total: number;
  desconto: number;
  forma_pagto: FormaPagamento;
  status: StatusPedido;
  observacao?: string;
  hora: string;
  criado_em: string;
}

export interface ItemPedido {
  produto_id: string;
  nome: string;
  quantidade: number;
  preco_unit: number;
  subtotal: number;
}

export interface Cliente {
  id: string;
  nome: string;
  whatsapp: string;
  email?: string;
  endereco?: string;
  total_compras: number;
}

export interface Operador {
  id: string;
  nome: string;
  whatsapp: string;
  role: 'ADMIN' | 'GERENTE' | 'VENDEDOR';
  ativo: boolean;
}

export interface MovimentoEstoque {
  id: string;
  produto_id: string;
  produto_nome: string;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantidade: number;
  motivo: string;
  operador: string;
  criado_em: string;
}

export type StatusPedido = 'ABERTO' | 'CONFIRMADO' | 'EM_PREPARO' | 'ENTREGUE' | 'CANCELADO';
export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO' | 'FIADO';
