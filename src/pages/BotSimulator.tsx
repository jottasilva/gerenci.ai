import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { produtosMock } from '@/data/mock';

interface Message {
  from: 'user' | 'bot';
  text: string;
  time: string;
}

type BotState = 'menu' | 'aguardando_cliente' | 'aguardando_itens' | 'aguardando_pagamento' | 'idle';

interface CartItem {
  nome: string;
  qtd: number;
  preco: number;
  subtotal: number;
}

function getTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

let orderCount = 100;

export default function BotSimulator() {
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: 'Olá! 👋 Bem-vindo ao *ZapPDV Bot*.\nDigite *menu* para ver as opções ou *ajuda* para listar comandos.', time: getTime() },
  ]);
  const [input, setInput] = useState('');
  const [botState, setBotState] = useState<BotState>('idle');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cliente, setCliente] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  function addMsg(from: 'user' | 'bot', text: string) {
    setMessages(prev => [...prev, { from, text, time: getTime() }]);
  }

  function processInput(raw: string) {
    const text = raw.trim();
    if (!text) return;
    addMsg('user', text);

    const lower = text.toLowerCase();

    // Global commands
    if (lower === 'menu' || lower === '0') {
      setBotState('menu');
      setCart([]);
      setTimeout(() => addMsg('bot',
        '📋 *Menu Principal*\n\n1️⃣ Nova venda\n2️⃣ Consultar estoque\n3️⃣ Meus pedidos\n4️⃣ Relatório do dia\n5️⃣ Ajuda\n\nDigite o número da opção:'
      ), 400);
      return;
    }

    if (lower === 'ajuda' || lower === '?') {
      setTimeout(() => addMsg('bot',
        '📖 *Comandos disponíveis:*\n\n• *menu* — Exibe menu principal\n• *venda* ou *1* — Iniciar nova venda\n• *add [produto] [qtd]* — Adicionar item\n• *fechar* — Finalizar pedido\n• *estoque [produto]* — Consultar estoque\n• *relatorio* ou *4* — Resumo do dia\n• *ajuda* ou *?* — Esta lista'
      ), 400);
      return;
    }

    if (lower.startsWith('estoque ')) {
      const query = lower.replace('estoque ', '');
      const found = produtosMock.find(p => p.nome.toLowerCase().includes(query));
      setTimeout(() => {
        if (found) {
          addMsg('bot', `📦 *${found.nome}*\n\nEstoque: ${found.estoque} unidades\nMínimo: ${found.estoque_min}\nPreço: R$ ${found.preco.toFixed(2).replace('.', ',')}\nSKU: ${found.sku}`);
        } else {
          addMsg('bot', `❌ Produto "${query}" não encontrado.\nTente novamente com outro nome.`);
        }
      }, 400);
      return;
    }

    if (lower === 'relatorio' || (lower === '4' && botState === 'menu')) {
      setBotState('idle');
      setTimeout(() => addMsg('bot',
        '📊 *Relatório do Dia*\n\n💰 Vendas: R$ 207,00\n📦 Pedidos: 5\n🎫 Ticket médio: R$ 41,40\n\n🏆 Top produtos:\n1. Coca-Cola 350ml — 8 un\n2. Energético Monster — 7 un\n3. Café Expresso — 7 un\n\n💳 Por pagamento:\n• PIX: R$ 82,00 (2)\n• Dinheiro: R$ 12,50 (1)\n• Fiado: R$ 89,00 (1)\n• Débito: R$ 23,50 (1)'
      ), 400);
      return;
    }

    // State machine
    if (botState === 'menu') {
      if (lower === '1' || lower === 'venda') {
        setBotState('aguardando_cliente');
        setTimeout(() => addMsg('bot', '🛒 *Nova venda iniciada!*\n\nDigite o nome do cliente ou "balcão":'), 400);
        return;
      }
      if (lower === '2') {
        setBotState('idle');
        setTimeout(() => addMsg('bot',
          '📦 *Estoque atual:*\n\n' + produtosMock.map(p =>
            `${p.estoque === 0 ? '🔴' : p.estoque < p.estoque_min ? '🟡' : '🟢'} ${p.nome} — ${p.estoque} un`
          ).join('\n')
        ), 400);
        return;
      }
      if (lower === '3') {
        setBotState('idle');
        setTimeout(() => addMsg('bot', '📋 *Últimos pedidos:*\n\n• P005 — Ana Costa — R$ 45,00 — ABERTO\n• P004 — Pedro Alves — R$ 23,50 — EM PREPARO\n• P003 — Maria Santos — R$ 89,00 — CONFIRMADO\n• P002 — Balcão — R$ 12,50 — ENTREGUE\n• P001 — João Silva — R$ 37,00 — ENTREGUE'), 400);
        return;
      }
      if (lower === '5') {
        setBotState('idle');
        setTimeout(() => addMsg('bot',
          '📖 *Comandos disponíveis:*\n\n• *menu* — Exibe menu principal\n• *venda* ou *1* — Iniciar nova venda\n• *add [produto] [qtd]* — Adicionar item\n• *fechar* — Finalizar pedido\n• *estoque [produto]* — Consultar estoque\n• *relatorio* ou *4* — Resumo do dia\n• *ajuda* ou *?* — Esta lista'
        ), 400);
        return;
      }
    }

    if (botState === 'aguardando_cliente') {
      setCliente(text);
      setBotState('aguardando_itens');
      setCart([]);
      setTimeout(() => addMsg('bot', `✅ Venda para *${text}*\n\nAdicione itens:\n*add [produto] [qtd]*\n\nExemplo: add coca 2\nDigite *fechar* para finalizar.`), 400);
      return;
    }

    if (botState === 'aguardando_itens') {
      if (lower.startsWith('add ')) {
        const parts = lower.replace('add ', '').trim();
        const lastSpace = parts.lastIndexOf(' ');
        let prodQuery = parts;
        let qtd = 1;
        if (lastSpace > 0) {
          const maybeNum = parseInt(parts.slice(lastSpace + 1));
          if (!isNaN(maybeNum)) {
            prodQuery = parts.slice(0, lastSpace);
            qtd = maybeNum;
          }
        }
        const found = produtosMock.find(p => p.nome.toLowerCase().includes(prodQuery));
        if (!found) {
          setTimeout(() => addMsg('bot', `❌ Produto "${prodQuery}" não encontrado.`), 300);
          return;
        }
        if (found.estoque === 0) {
          setTimeout(() => addMsg('bot', `🔴 *${found.nome}* está sem estoque!`), 300);
          return;
        }
        if (qtd > found.estoque) {
          setTimeout(() => addMsg('bot', `⚠️ Estoque insuficiente para *${found.nome}*. Disponível: ${found.estoque}`), 300);
          return;
        }
        const item: CartItem = { nome: found.nome, qtd, preco: found.preco, subtotal: found.preco * qtd };
        setCart(prev => {
          const newCart = [...prev, item];
          const total = newCart.reduce((s, i) => s + i.subtotal, 0);
          setTimeout(() => addMsg('bot',
            `✅ *${qtd}x ${found.nome}* adicionado\nSubtotal: R$ ${item.subtotal.toFixed(2).replace('.', ',')}\n\n🛒 Total atual: *R$ ${total.toFixed(2).replace('.', ',')}*\nDigite *add* para mais itens ou *fechar* para finalizar.`
          ), 300);
          return newCart;
        });
        return;
      }
      if (lower === 'fechar') {
        if (cart.length === 0) {
          setTimeout(() => addMsg('bot', '⚠️ Carrinho vazio! Adicione itens antes de fechar.'), 300);
          return;
        }
        setBotState('aguardando_pagamento');
        const total = cart.reduce((s, i) => s + i.subtotal, 0);
        const resumo = cart.map(i => `• ${i.qtd}x ${i.nome} — R$ ${i.subtotal.toFixed(2).replace('.', ',')}`).join('\n');
        setTimeout(() => addMsg('bot',
          `📋 *Resumo do Pedido*\nCliente: ${cliente}\n\n${resumo}\n\n💰 *Total: R$ ${total.toFixed(2).replace('.', ',')}*\n\nForma de pagamento:\n1️⃣ Dinheiro\n2️⃣ PIX\n3️⃣ Cartão Débito\n4️⃣ Cartão Crédito\n5️⃣ Fiado\n\nDigite o número:`
        ), 400);
        return;
      }
    }

    if (botState === 'aguardando_pagamento') {
      const pagMap: Record<string, string> = { '1': 'Dinheiro', '2': 'PIX', '3': 'Cartão Débito', '4': 'Cartão Crédito', '5': 'Fiado' };
      const pag = pagMap[lower];
      if (!pag) {
        setTimeout(() => addMsg('bot', '⚠️ Opção inválida. Digite 1-5.'), 300);
        return;
      }
      if (pag === 'Fiado' && cliente.toLowerCase() === 'balcão') {
        setTimeout(() => addMsg('bot', '❌ Venda *Fiado* não permitida para Balcão.\nSelecione outra forma de pagamento:'), 300);
        return;
      }
      const total = cart.reduce((s, i) => s + i.subtotal, 0);
      orderCount++;
      setBotState('idle');
      setCart([]);
      setTimeout(() => addMsg('bot',
        `✅ *Venda confirmada!*\n\n🧾 Pedido: #P${orderCount}\n👤 Cliente: ${cliente}\n💳 Pagamento: ${pag}\n💰 Total: R$ ${total.toFixed(2).replace('.', ',')}\n\n✅ Estoque atualizado.\n\nDigite *menu* para nova operação.`
      ), 500);
      return;
    }

    // Fallback
    setTimeout(() => addMsg('bot', '🤔 Não entendi. Digite *menu* para ver as opções ou *ajuda* para listar comandos.'), 300);
  }

  const handleSend = () => {
    if (!input.trim()) return;
    processInput(input);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <h1 className="font-display font-bold text-xl text-foreground">Simulador do Bot</h1>
          <p className="text-sm text-muted-foreground">Teste os comandos do ZapPDV como se fosse no WhatsApp</p>
        </div>

        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-surface-2 px-4 py-3 flex items-center gap-3 border-b border-border">
            <div className="h-9 w-9 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center p-1">
              <img src="/src/assets/logo.svg" alt="ZapPDV" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">ZapPDV Bot</p>
              <p className="text-xs text-primary">online</p>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={chatRef}
            className="h-[28rem] overflow-y-auto p-4 space-y-3"
            style={{ background: 'hsl(210 25% 5%)' }}
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${msg.from === 'user'
                  ? 'bg-primary/20 text-foreground rounded-br-md'
                  : 'bg-surface-2 text-foreground rounded-bl-md'
                  }`}>
                  <p className="whitespace-pre-line leading-relaxed">{msg.text.replace(/\*(.*?)\*/g, '$1')}</p>
                  <p className={`text-[10px] mt-1 text-right ${msg.from === 'user' ? 'text-primary/60' : 'text-muted-foreground/60'
                    }`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="bg-surface-2 px-3 py-3 border-t border-border flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Digite uma mensagem..."
              className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
            />
            <button
              onClick={handleSend}
              className="h-10 w-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Send className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
