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

export const pedidosMock: Pedido[] = [
  { id: 'P001', cliente: 'João Silva', total: 37.00, desconto: 0, forma_pagto: 'PIX', status: 'FINALIZADO', hora: '14:23', criado_em: '2025-02-19', itens: [{ produto: '1', product: '1', nome: 'Coca-Cola 350ml', product_name: 'Coca-Cola 350ml', quantidade: 3, quantity: 3, preco_unit: 5.00, unit_price: 5.00, subtotal: 15.00 }, { produto: '6', product: '6', nome: 'Energético Monster', product_name: 'Energético Monster', quantidade: 2, quantity: 2, preco_unit: 11.00, unit_price: 11.00, subtotal: 22.00 }] },
  { id: 'P002', cliente: 'Balcão', total: 12.50, desconto: 0, forma_pagto: 'DINHEIRO', status: 'FINALIZADO', hora: '14:45', criado_em: '2025-02-19', itens: [{ produto: '1', product: '1', nome: 'Coca-Cola 350ml', product_name: 'Coca-Cola 350ml', quantidade: 1, quantity: 1, preco_unit: 5.00, unit_price: 5.00, subtotal: 5.00 }, { produto: '3', product: '3', nome: 'Água Mineral 500ml', product_name: 'Água Mineral 500ml', quantidade: 3, quantity: 3, preco_unit: 2.50, unit_price: 2.50, subtotal: 7.50 }] },
  { id: 'P003', cliente: 'Maria Santos', total: 89.00, desconto: 0, forma_pagto: 'FIADO', status: 'REALIZADO', hora: '15:02', criado_em: '2025-02-19', itens: [{ produto: '6', product: '6', nome: 'Energético Monster', product_name: 'Energético Monster', quantidade: 5, quantity: 5, preco_unit: 11.00, unit_price: 11.00, subtotal: 55.00 }, { produto: '10', product: '10', nome: 'Café Expresso', product_name: 'Café Expresso', quantidade: 4, quantity: 4, preco_unit: 5.50, unit_price: 5.50, subtotal: 22.00 }, { produto: '5', product: '5', nome: 'Chocolate Bis', product_name: 'Chocolate Bis', quantidade: 4, quantity: 4, preco_unit: 3.00, unit_price: 3.00, subtotal: 12.00 }] },
  { id: 'P004', cliente: 'Pedro Alves', total: 23.50, desconto: 0, forma_pagto: 'CARTAO_DEBITO', status: 'PREPARANDO', hora: '15:18', criado_em: '2025-02-19', itens: [{ produto: '8', product: '8', nome: 'Barra de Cereal', product_name: 'Barra de Cereal', quantidade: 3, quantity: 3, preco_unit: 3.50, unit_price: 3.50, subtotal: 10.50 }, { produto: '7', product: '7', nome: 'Suco Del Valle 290ml', product_name: 'Suco Del Valle 290ml', quantidade: 2, quantity: 2, preco_unit: 4.00, unit_price: 4.00, subtotal: 8.00 }, { produto: '1', product: '1', nome: 'Coca-Cola 350ml', product_name: 'Coca-Cola 350ml', quantidade: 1, quantity: 1, preco_unit: 5.00, unit_price: 5.00, subtotal: 5.00 }] },
  { id: 'P005', cliente: 'Ana Costa', total: 45.00, desconto: 5.00, forma_pagto: 'PIX', status: 'REALIZADO', hora: '15:31', criado_em: '2025-02-19', itens: [{ produto: '1', product: '1', nome: 'Coca-Cola 350ml', product_name: 'Coca-Cola 350ml', quantidade: 4, quantity: 4, preco_unit: 5.00, unit_price: 5.00, subtotal: 20.00 }, { produto: '9', product: '9', nome: 'Guaraná Antarctica 2L', product_name: 'Guaraná Antarctica 2L', quantidade: 2, quantity: 2, preco_unit: 8.00, unit_price: 8.00, subtotal: 16.00 }, { produto: '5', product: '5', nome: 'Chocolate Bis', product_name: 'Chocolate Bis', quantidade: 3, quantity: 3, preco_unit: 3.00, unit_price: 3.00, subtotal: 9.00 }] },
  { id: 'P006', cliente: 'Carlos Lima', total: 16.50, desconto: 0, forma_pagto: 'CARTAO_CREDITO', status: 'FINALIZADO', hora: '12:10', criado_em: '2025-02-18', itens: [{ produto: '10', product: '10', nome: 'Café Expresso', product_name: 'Café Expresso', quantidade: 3, quantity: 3, preco_unit: 5.50, unit_price: 5.50, subtotal: 16.50 }] },
  { id: 'P007', cliente: 'Balcão', total: 7.00, desconto: 0, forma_pagto: 'DINHEIRO', status: 'CANCELADO', hora: '11:55', criado_em: '2025-02-18', itens: [{ produto: '4', product: '4', nome: 'Salgadinho Doritos', product_name: 'Salgadinho Doritos', quantidade: 1, quantity: 1, preco_unit: 7.00, unit_price: 7.00, subtotal: 7.00 }] },
];

export const clientesMock: Cliente[] = [
  { id: 'c1', nome: 'João Silva', whatsapp: '11999001122', email: 'joao@email.com', endereco: 'Rua A, 123', total_compras: 487.50, ativo: true },
  { id: 'c2', nome: 'Maria Santos', whatsapp: '11988112233', email: 'maria@email.com', endereco: 'Av B, 456', total_compras: 1230.00, ativo: true },
  { id: 'c3', nome: 'Pedro Alves', whatsapp: '11977223344', total_compras: 89.00, ativo: true },
  { id: 'c4', nome: 'Ana Costa', whatsapp: '11966334455', email: 'ana@email.com', total_compras: 356.00, ativo: true },
  { id: 'c5', nome: 'Carlos Lima', whatsapp: '11955445566', total_compras: 67.50, ativo: true },
];

export const operadoresMock: Operador[] = [
  { id: 'op1', nome: 'Admin Principal', whatsapp: '11999000000', role: 'ADMIN', ativo: true },
  { id: 'op2', nome: 'Gerente Marcos', whatsapp: '11988111111', role: 'GERENTE', ativo: true },
  { id: 'op3', nome: 'Vendedor Lucas', whatsapp: '11977222222', role: 'VENDEDOR', ativo: true },
  { id: 'op4', nome: 'Vendedora Julia', whatsapp: '11966333333', role: 'VENDEDOR', ativo: false },
];

export const movimentosMock: MovimentoEstoque[] = [
  { id: 'm1', produto: '1', product: '1', produto_nome: 'Coca-Cola 350ml', tipo: 'ENTRADA', type: 'ENTRADA', quantidade: 48, quantity: 48, motivo: 'Reposição fornecedor', reason: 'Reposição fornecedor', operador: 'Admin Principal', criado_em: '2025-02-18 08:00', created_at: '2025-02-18T08:00:00Z' },
  { id: 'm2', produto: '2', product: '2', produto_nome: 'Cerveja Lata 350ml', tipo: 'SAIDA', type: 'SAIDA', quantidade: 21, quantity: 21, motivo: 'Venda pedido P001', reason: 'Venda pedido P001', operador: 'Vendedor Lucas', criado_em: '2025-02-18 14:23', created_at: '2025-02-18T14:23:00Z' },
  { id: 'm3', produto: '4', product: '4', produto_nome: 'Salgadinho Doritos', tipo: 'SAIDA', type: 'SAIDA', quantidade: 10, quantity: 10, motivo: 'Venda', reason: 'Venda', operador: 'Vendedor Lucas', criado_em: '2025-02-18 15:00', created_at: '2025-02-18T15:00:00Z' },
  { id: 'm4', produto: '3', product: '3', produto_nome: 'Água Mineral 500ml', tipo: 'AJUSTE', type: 'AJUSTE', quantidade: -5, quantity: -5, motivo: 'Avaria', reason: 'Avaria', operador: 'Gerente Marcos', criado_em: '2025-02-19 09:00', created_at: '2025-02-19T09:00:00Z' },
  { id: 'm5', produto: '6', product: '6', produto_nome: 'Energético Monster', tipo: 'ENTRADA', type: 'ENTRADA', quantidade: 12, quantity: 12, motivo: 'Reposição', reason: 'Reposição', operador: 'Admin Principal', criado_em: '2025-02-19 10:30', created_at: '2025-02-19T10:30:00Z' },
];

export const vendasUltimos7Dias = [
  { dia: 'Seg', vendas: 1250 },
  { dia: 'Ter', vendas: 1890 },
  { dia: 'Qua', vendas: 2100 },
  { dia: 'Qui', vendas: 1760 },
  { dia: 'Sex', vendas: 2847 },
  { dia: 'Sáb', vendas: 3200 },
  { dia: 'Dom', vendas: 1540 },
];
