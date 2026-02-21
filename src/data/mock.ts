import { Produto, Pedido, Cliente, Operador, MovimentoEstoque } from '@/types';

export const produtosMock: Produto[] = [
  { id: '1', nome: 'Coca-Cola 350ml', descricao: 'Refrigerante Coca-Cola lata', preco: 5.00, estoque: 48, estoque_min: 12, categoria: 'Bebidas', sku: 'COCA350', ativo: true },
  { id: '2', nome: 'Cerveja Lata 350ml', descricao: 'Cerveja Pilsen lata', preco: 4.50, estoque: 3, estoque_min: 24, categoria: 'Bebidas', sku: 'CERV350', ativo: true },
  { id: '3', nome: 'Água Mineral 500ml', descricao: 'Água mineral sem gás', preco: 2.50, estoque: 72, estoque_min: 24, categoria: 'Bebidas', sku: 'AGUA500', ativo: true },
  { id: '4', nome: 'Salgadinho Doritos', descricao: 'Doritos original 96g', preco: 7.00, estoque: 0, estoque_min: 10, categoria: 'Snacks', sku: 'DOR001', ativo: true },
  { id: '5', nome: 'Chocolate Bis', descricao: 'Chocolate Bis ao leite', preco: 3.00, estoque: 30, estoque_min: 15, categoria: 'Doces', sku: 'BIS001', ativo: true },
  { id: '6', nome: 'Energético Monster', descricao: 'Monster Energy 473ml', preco: 11.00, estoque: 18, estoque_min: 6, categoria: 'Bebidas', sku: 'MON001', ativo: true },
  { id: '7', nome: 'Suco Del Valle 290ml', descricao: 'Suco de uva Del Valle', preco: 4.00, estoque: 24, estoque_min: 12, categoria: 'Bebidas', sku: 'DEL290', ativo: true },
  { id: '8', nome: 'Barra de Cereal', descricao: 'Barra de cereal integral', preco: 3.50, estoque: 22, estoque_min: 10, categoria: 'Snacks', sku: 'BAR001', ativo: true },
  { id: '9', nome: 'Guaraná Antarctica 2L', descricao: 'Refrigerante Guaraná 2 litros', preco: 8.00, estoque: 15, estoque_min: 8, categoria: 'Bebidas', sku: 'GUA2L', ativo: true },
  { id: '10', nome: 'Café Expresso', descricao: 'Café expresso fresco', preco: 5.50, estoque: 100, estoque_min: 20, categoria: 'Café', sku: 'CAF001', ativo: true },
];

export const pedidosMock: Pedido[] = [
  { id: 'P001', cliente: 'João Silva', total: 37.00, desconto: 0, forma_pagto: 'PIX', status: 'ENTREGUE', hora: '14:23', criado_em: '2025-02-19', itens: [{ produto_id: '1', nome: 'Coca-Cola 350ml', quantidade: 3, preco_unit: 5.00, subtotal: 15.00 }, { produto_id: '6', nome: 'Energético Monster', quantidade: 2, preco_unit: 11.00, subtotal: 22.00 }] },
  { id: 'P002', cliente: 'Balcão', total: 12.50, desconto: 0, forma_pagto: 'DINHEIRO', status: 'ENTREGUE', hora: '14:45', criado_em: '2025-02-19', itens: [{ produto_id: '1', nome: 'Coca-Cola 350ml', quantidade: 1, preco_unit: 5.00, subtotal: 5.00 }, { produto_id: '3', nome: 'Água Mineral 500ml', quantidade: 3, preco_unit: 2.50, subtotal: 7.50 }] },
  { id: 'P003', cliente: 'Maria Santos', total: 89.00, desconto: 0, forma_pagto: 'FIADO', status: 'CONFIRMADO', hora: '15:02', criado_em: '2025-02-19', itens: [{ produto_id: '6', nome: 'Energético Monster', quantidade: 5, preco_unit: 11.00, subtotal: 55.00 }, { produto_id: '10', nome: 'Café Expresso', quantidade: 4, preco_unit: 5.50, subtotal: 22.00 }, { produto_id: '5', nome: 'Chocolate Bis', quantidade: 4, preco_unit: 3.00, subtotal: 12.00 }] },
  { id: 'P004', cliente: 'Pedro Alves', total: 23.50, desconto: 0, forma_pagto: 'CARTAO_DEBITO', status: 'EM_PREPARO', hora: '15:18', criado_em: '2025-02-19', itens: [{ produto_id: '8', nome: 'Barra de Cereal', quantidade: 3, preco_unit: 3.50, subtotal: 10.50 }, { produto_id: '7', nome: 'Suco Del Valle 290ml', quantidade: 2, preco_unit: 4.00, subtotal: 8.00 }, { produto_id: '1', nome: 'Coca-Cola 350ml', quantidade: 1, preco_unit: 5.00, subtotal: 5.00 }] },
  { id: 'P005', cliente: 'Ana Costa', total: 45.00, desconto: 5.00, forma_pagto: 'PIX', status: 'ABERTO', hora: '15:31', criado_em: '2025-02-19', itens: [{ produto_id: '1', nome: 'Coca-Cola 350ml', quantidade: 4, preco_unit: 5.00, subtotal: 20.00 }, { produto_id: '9', nome: 'Guaraná Antarctica 2L', quantidade: 2, preco_unit: 8.00, subtotal: 16.00 }, { produto_id: '5', nome: 'Chocolate Bis', quantidade: 3, preco_unit: 3.00, subtotal: 9.00 }] },
  { id: 'P006', cliente: 'Carlos Lima', total: 16.50, desconto: 0, forma_pagto: 'CARTAO_CREDITO', status: 'ENTREGUE', hora: '12:10', criado_em: '2025-02-18', itens: [{ produto_id: '10', nome: 'Café Expresso', quantidade: 3, preco_unit: 5.50, subtotal: 16.50 }] },
  { id: 'P007', cliente: 'Balcão', total: 7.00, desconto: 0, forma_pagto: 'DINHEIRO', status: 'CANCELADO', hora: '11:55', criado_em: '2025-02-18', itens: [{ produto_id: '4', nome: 'Salgadinho Doritos', quantidade: 1, preco_unit: 7.00, subtotal: 7.00 }] },
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
  { id: 'm1', produto_id: '1', produto_nome: 'Coca-Cola 350ml', tipo: 'ENTRADA', quantidade: 48, motivo: 'Reposição fornecedor', operador: 'Admin Principal', criado_em: '2025-02-18 08:00' },
  { id: 'm2', produto_id: '2', produto_nome: 'Cerveja Lata 350ml', tipo: 'SAIDA', quantidade: 21, motivo: 'Venda pedido P001', operador: 'Vendedor Lucas', criado_em: '2025-02-18 14:23' },
  { id: 'm3', produto_id: '4', produto_nome: 'Salgadinho Doritos', tipo: 'SAIDA', quantidade: 10, motivo: 'Venda', operador: 'Vendedor Lucas', criado_em: '2025-02-18 15:00' },
  { id: 'm4', produto_id: '3', produto_nome: 'Água Mineral 500ml', tipo: 'AJUSTE', quantidade: -5, motivo: 'Avaria', operador: 'Gerente Marcos', criado_em: '2025-02-19 09:00' },
  { id: 'm5', produto_id: '6', produto_nome: 'Energético Monster', tipo: 'ENTRADA', quantidade: 12, motivo: 'Reposição', operador: 'Admin Principal', criado_em: '2025-02-19 10:30' },
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
