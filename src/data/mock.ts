import { Produto, Pedido, Cliente, Operador, MovimentoEstoque } from '@/types';

export const produtosMock: Produto[] = [
  { id: '1', nome: 'Coca-Cola 350ml', name: 'Coca-Cola 350ml', descricao: 'Refrigerante Coca-Cola lata', description: 'Refrigerante Coca-Cola lata', preco: 5.00, price: 5.00, estoque: 48, stock: 48, estoque_min: 12, stock_min: 12, categoria: 'Bebidas', category: 'Bebidas', sku: 'COCA350', ativo: true, is_active: true },
  { id: '2', nome: 'Cerveja Lata 350ml', name: 'Cerveja Lata 350ml', descricao: 'Cerveja Pilsen lata', description: 'Cerveja Pilsen lata', preco: 4.50, price: 4.50, estoque: 3, stock: 3, estoque_min: 24, stock_min: 24, categoria: 'Bebidas', category: 'Bebidas', sku: 'CERV350', ativo: true, is_active: true },
  { id: '3', nome: 'Água Mineral 500ml', name: 'Água Mineral 500ml', descricao: 'Água mineral sem gás', description: 'Água mineral sem gás', preco: 2.50, price: 2.50, estoque: 72, stock: 72, estoque_min: 24, stock_min: 24, categoria: 'Bebidas', category: 'Bebidas', sku: 'AGUA500', ativo: true, is_active: true },
  { id: '4', nome: 'Salgadinho Doritos', name: 'Salgadinho Doritos', descricao: 'Doritos original 96g', description: 'Doritos original 96g', preco: 7.00, price: 7.00, estoque: 0, stock: 0, estoque_min: 10, stock_min: 10, categoria: 'Snacks', category: 'Snacks', sku: 'DOR001', ativo: true, is_active: true },
  { id: '5', nome: 'Chocolate Bis', name: 'Chocolate Bis', descricao: 'Chocolate Bis ao leite', description: 'Chocolate Bis ao leite', preco: 3.00, price: 3.00, estoque: 30, stock: 30, estoque_min: 15, stock_min: 15, categoria: 'Doces', category: 'Doces', sku: 'BIS001', ativo: true, is_active: true },
  { id: '6', nome: 'Energético Monster', name: 'Energético Monster', descricao: 'Monster Energy 473ml', description: 'Monster Energy 473ml', preco: 11.00, price: 11.00, estoque: 18, stock: 18, estoque_min: 6, stock_min: 6, categoria: 'Bebidas', category: 'Bebidas', sku: 'MON001', ativo: true, is_active: true },
  { id: '7', nome: 'Suco Del Valle 290ml', name: 'Suco Del Valle 290ml', descricao: 'Suco de uva Del Valle', description: 'Suco de uva Del Valle', preco: 4.00, price: 4.00, estoque: 24, stock: 24, estoque_min: 12, stock_min: 12, categoria: 'Bebidas', category: 'Bebidas', sku: 'DEL290', ativo: true, is_active: true },
  { id: '8', nome: 'Barra de Cereal', name: 'Barra de Cereal', descricao: 'Barra de cereal integral', description: 'Barra de cereal integral', preco: 3.50, price: 3.50, estoque: 22, stock: 22, estoque_min: 10, stock_min: 10, categoria: 'Snacks', category: 'Snacks', sku: 'BAR001', ativo: true, is_active: true },
  { id: '9', nome: 'Guaraná Antarctica 2L', name: 'Guaraná Antarctica 2L', descricao: 'Refrigerante Guaraná 2 litros', description: 'Refrigerante Guaraná 2 litros', preco: 8.00, price: 8.00, estoque: 15, stock: 15, estoque_min: 8, stock_min: 8, categoria: 'Bebidas', category: 'Bebidas', sku: 'GUA2L', ativo: true, is_active: true },
  { id: '10', nome: 'Café Expresso', name: 'Café Expresso', descricao: 'Café expresso fresco', description: 'Café expresso fresco', preco: 5.50, price: 5.50, estoque: 100, stock: 100, estoque_min: 20, stock_min: 20, categoria: 'Café', category: 'Café', sku: 'CAF001', ativo: true, is_active: true },
];

export const pedidosMock: Pedido[] = [];

export const clientesMock: Cliente[] = [];

export const operadoresMock: Operador[] = [];

export const movimentosMock: MovimentoEstoque[] = [];

export const vendasUltimos7Dias = [
  { dia: 'Seg', vendas: 0 },
  { dia: 'Ter', vendas: 0 },
  { dia: 'Qua', vendas: 0 },
  { dia: 'Qui', vendas: 0 },
  { dia: 'Sex', vendas: 0 },
  { dia: 'Sáb', vendas: 0 },
  { dia: 'Dom', vendas: 0 },
];
