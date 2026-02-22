import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { produtosMock } from '@/data/mock';

interface Message {
  from: 'user' | 'bot';
  text: string;
  time: string;
}

const initialMessages: Message[] = [];

function getTime() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

type BotState = 'idle' | 'aguardando_cliente' | 'aguardando_itens' | 'aguardando_pagamento';

interface CartItem { nome: string; qtd: number; preco: number; subtotal: number; }

export function ChatMockup() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [botState, setBotState] = useState<BotState>('idle');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cliente, setCliente] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const runScript = async () => {
      const saleScript: { from: 'user' | 'bot', text: string, delay: number }[] = [
        { from: 'bot', text: 'Olá João 👋\nBem-vindo novamente!\n\nComo posso te ajudar hoje?\n\n1️⃣ Ver produtos\n2️⃣ Consultar estoque\n3️⃣ Fazer pedido\n4️⃣ Falar com atendente', delay: 1000 },
        { from: 'user', text: '1', delay: 2500 },
        { from: 'bot', text: '📦 Produtos disponíveis hoje:\n\n1️⃣ Camiseta Preta Premium\n2️⃣ Boné Personalizado\n3️⃣ Caneca Personalizada\n\nDigite o número do produto para ver detalhes.', delay: 2000 },
        { from: 'user', text: '1', delay: 2500 },
        { from: 'bot', text: '🧾 Camiseta Preta Premium\n\n✔️ Tamanhos: P, M, G, GG\n✔️ Valor: R$ 59,90\n\n📦 Estoque atual: 8 unidades\n\nDeseja comprar?\n\n1️⃣ Sim\n2️⃣ Voltar', delay: 2000 },
        { from: 'user', text: 'Sim', delay: 2500 },
        { from: 'bot', text: 'Perfeito 👍\n\nQual tamanho você deseja?\n(P / M / G / GG)', delay: 1500 },
        { from: 'user', text: 'M', delay: 2000 },
        { from: 'bot', text: 'Quantas unidades você deseja?', delay: 1500 },
        { from: 'user', text: '2', delay: 2000 },
        { from: 'bot', text: '🔄 Verificando estoque…\n\n✔️ Estoque disponível!\n\nResumo do pedido:\nProduto: Camiseta Preta Premium\nTamanho: M\nQuantidade: 2\nTotal: R$ 119,80\n\nDeseja confirmar o pedido?\n\n1️⃣ Confirmar compra\n2️⃣ Cancelar', delay: 3000 },
        { from: 'user', text: '1', delay: 2500 },
        { from: 'bot', text: '🎉 Pedido confirmado com sucesso!\n\n🔄 Atualizando estoque…\n\n📦 Novo estoque: 6 unidades\n\nSeu pedido já foi registrado 👍\n\nDeseja mais alguma coisa?\n\n1️⃣ Continuar comprando\n2️⃣ Finalizar pedido', delay: 2500 },
        { from: 'user', text: 'Finalizar', delay: 2500 },
        { from: 'bot', text: 'Perfeito João 👍\n\nSeu pedido foi finalizado com sucesso.\nEm instantes você receberá os detalhes de pagamento e entrega.\n\nObrigado pela compra 🚀', delay: 2000 },
      ];

      const reportScript: { from: 'user' | 'bot', text: string, delay: number }[] = [
        { from: 'bot', text: 'Olá João 👋\n\nO que deseja fazer hoje?\n\n1️⃣ Ver relatório de vendas\n2️⃣ Atualizar estoque\n3️⃣ Consultar produtos\n4️⃣ Voltar ao menu', delay: 1000 },
        { from: 'user', text: '1', delay: 2500 },
        { from: 'bot', text: '📊 Relatório rápido — Hoje\n\n🧾 Total de vendas: 12\n💰 Faturamento: R$ 1.248,00\n📦 Produtos vendidos: 18 unidades\n🔥 Produto mais vendido: Camiseta Preta Premium\n\nDeseja ver mais detalhes?\n\n1️⃣ Relatório completo\n2️⃣ Ver estoque atual\n3️⃣ Voltar', delay: 2500 },
        { from: 'user', text: '1', delay: 2500 },
        { from: 'bot', text: '📊 Relatório completo — Hoje\n\n✔️ Camiseta Preta Premium — 8 vendas\n✔️ Boné Personalizado — 3 vendas\n✔️ Caneca Personalizada — 1 venda\n\n💰 Ticket médio: R$ 104,00\n📈 Comparado a ontem: +18%\n\nDeseja realizar alguma ação?\n\n1️⃣ Atualizar estoque\n2️⃣ Ver produtos com estoque baixo\n3️⃣ Voltar ao menu', delay: 3000 },
        { from: 'user', text: '2', delay: 2500 },
        { from: 'bot', text: '⚠️ Produtos com estoque baixo:\n\n📦 Camiseta Preta Premium — 4 unidades\n📦 Caneca Personalizada — 2 unidades\n\nDeseja atualizar algum estoque?\n\n1️⃣ Sim\n2️⃣ Não', delay: 2500 },
        { from: 'user', text: '1', delay: 2500 },
        { from: 'bot', text: 'Digite o nome do produto ou número:\n\n1️⃣ Camiseta Preta Premium\n2️⃣ Caneca Personalizada', delay: 2000 },
        { from: 'user', text: '1', delay: 2500 },
        { from: 'bot', text: '📦 Estoque atual: 4 unidades\n\nQuantas unidades deseja adicionar?', delay: 2000 },
        { from: 'user', text: '10', delay: 2000 },
        { from: 'bot', text: '🔄 Atualizando estoque…\n\n✔️ Estoque atualizado com sucesso!\n\n📦 Novo estoque: 14 unidades\n\nDeseja fazer mais alguma alteração?\n\n1️⃣ Atualizar outro produto\n2️⃣ Ver relatório novamente\n3️⃣ Finalizar', delay: 2500 },
        { from: 'user', text: '3', delay: 2500 },
        { from: 'bot', text: 'Perfeito João 👍\n\nSeu estoque está atualizado e o relatório salvo no sistema.\n\nSempre que quiser, é só chamar 🚀', delay: 2500 },
      ];

      while (true) {
        // Run Sale Script
        setMessages([]);
        for (const step of saleScript) {
          await new Promise(resolve => timeout = setTimeout(resolve, step.delay));
          addMsg(step.from, step.text);
        }
        await new Promise(resolve => timeout = setTimeout(resolve, 30000));

        // Run Report Script
        setMessages([]);
        for (const step of reportScript) {
          await new Promise(resolve => timeout = setTimeout(resolve, step.delay));
          addMsg(step.from, step.text);
        }
        await new Promise(resolve => timeout = setTimeout(resolve, 30000));
      }
    };

    const initiate = async () => {
      await new Promise(resolve => timeout = setTimeout(resolve, 10000));
      runScript();
    };

    initiate();
    return () => clearTimeout(timeout);
  }, []);

  const addMsg = (from: 'user' | 'bot', text: string) => {
    setMessages(prev => [...prev, { from, text, time: getTime() }]);
  };

  const processInput = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    addMsg('user', text);
    const lower = text.toLowerCase();

    setTimeout(() => {
      if (lower === 'menu' || lower === 'ajuda') {
        setBotState('idle');
        addMsg('bot', '📋 *Menu Principal*\n\n1️⃣ Nova venda\n2️⃣ Consultar estoque\n3️⃣ Relatório do dia\n4️⃣ Ajuda\n\nDigite o número da opção:');
        return;
      }

      if (botState === 'idle') {
        if (lower === '1' || lower === 'nova venda') {
          setBotState('aguardando_cliente');
          addMsg('bot', '🛒 *Nova venda iniciada!*\n\nDigite o nome do cliente ou "balcão":');
        } else if (lower === '2' || lower.startsWith('estoque')) {
          const query = lower.replace('estoque', '').trim();
          const found = produtosMock.filter(p => p.nome.toLowerCase().includes(query || ''));
          const list = found.slice(0, 5).map(p => `• ${p.nome} — ${p.estoque} un`).join('\n');
          addMsg('bot', `📦 *Estoque*\n\n${list || 'Nenhum produto encontrado.'}`);
        } else if (lower === '3') {
          addMsg('bot', '📊 *Relatório do dia*\n\n💰 Faturamento: R$ 1.284,50\n📦 Pedidos: 12\n🎫 Ticket médio: R$ 107,04\n\n🏆 Top: Coca-Cola 350ml (18 un)');
        } else {
          addMsg('bot', '🤔 Não entendi. Digite *menu* para ver as opções.');
        }
        return;
      }

      if (botState === 'aguardando_cliente') {
        setCliente(text);
        setCart([]);
        setBotState('aguardando_itens');
        addMsg('bot', `✅ Venda para *${text}*\n\nAdicione itens:\n*add [produto] [qtd]*\n\nExemplo: add coca 2`);
        return;
      }

      if (botState === 'aguardando_itens') {
        if (lower === 'fechar') {
          const total = cart.reduce((s, c) => s + c.subtotal, 0);
          const items = cart.map(c => `• ${c.qtd}x ${c.nome} — R$ ${c.subtotal.toFixed(2).replace('.', ',')}`).join('\n');
          setBotState('aguardando_pagamento');
          addMsg('bot', `📦 *Resumo do Pedido*\n\n${items}\n\n💰 *Total: R$ ${total.toFixed(2).replace('.', ',')}*\n\nForma de pagamento?\n1️⃣ PIX\n2️⃣ Dinheiro\n3️⃣ Cartão\n4️⃣ Fiado`);
          return;
        }
        const match = lower.match(/^add\s+(.+?)\s+(\d+)$/);
        if (match) {
          const query = match[1];
          const qtd = parseInt(match[2]);
          const prod = produtosMock.find(p => p.nome.toLowerCase().includes(query));
          if (prod) {
            const item = { nome: prod.nome, qtd, preco: prod.preco, subtotal: prod.preco * qtd };
            setCart(prev => [...prev, item]);
            const newTotal = [...cart, item].reduce((s, c) => s + c.subtotal, 0);
            addMsg('bot', `✅ *${qtd}x ${prod.nome}* adicionado\nSubtotal: R$ ${item.subtotal.toFixed(2).replace('.', ',')}\n\n🛒 Total: *R$ ${newTotal.toFixed(2).replace('.', ',')}*\nDigite "fechar" para finalizar.`);
          } else {
            addMsg('bot', '❌ Produto não encontrado. Tente novamente.');
          }
        } else {
          addMsg('bot', '🤔 Use: *add [produto] [qtd]*\nExemplo: add coca 2');
        }
        return;
      }

      if (botState === 'aguardando_pagamento') {
        const pagamentos: Record<string, string> = { '1': 'PIX', '2': 'Dinheiro', '3': 'Cartão', '4': 'Fiado' };
        const forma = pagamentos[lower];
        if (forma) {
          setBotState('idle');
          setCart([]);
          const now = new Date();
          const dateTime = `${now.toLocaleDateString('pt-BR')} às ${getTime()}`;
          addMsg('bot', `✅ *Venda Finalizada!*\n\n👤 *Cliente:* ${cliente}\n💼 *Vendedor:* Amélia\n🧾 *Pagamento:* ${forma}\n📅 *Data:* ${dateTime}\n\nDigite *menu* para novo pedido.`);
        } else {
          addMsg('bot', 'Digite 1, 2, 3 ou 4 para escolher a forma de pagamento.');
        }
        return;
      }
    }, 400);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    processInput(input);
    setInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4 }}
      className="rounded-3xl border border-border bg-card overflow-hidden shadow-2xl"
    >
      <div className="bg-surface-2 px-4 py-3 flex items-center gap-3 border-b border-border">
        <div className="h-10 w-10 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center p-1.5">
          <img src="https://i.imgur.com/9bkJZlL.png" alt="ZapPDV" className="w-full h-full object-contain" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Gerenc.ai | Amélia</p>
          <p className="text-xs text-primary">online</p>
        </div>
      </div>
      <div
        ref={chatRef}
        className="h-[420px] overflow-y-auto p-4 space-y-3"
        style={{ background: 'hsl(210 25% 5%)' }}
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${msg.from === 'user'
              ? 'bg-primary/20 text-foreground rounded-br-md'
              : 'bg-surface-2 text-foreground rounded-bl-md'
              }`}>
              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
              <p className={`text-[10px] mt-1 text-right ${msg.from === 'user' ? 'text-primary/60' : 'text-muted-foreground/60'
                }`}>{msg.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="bg-surface-2 px-4 py-3 border-t border-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Digite uma mensagem..."
          className="flex-1 rounded-full bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          onClick={handleSend}
          className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
