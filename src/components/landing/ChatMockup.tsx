import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { produtosMock } from '@/data/mock';

interface Message {
  from: 'user' | 'bot';
  text: string;
  time: string;
}

const initialMessages: Message[] = [
  { from: 'bot', text: 'Olá! 👋 Bem-vindo ao *Gerenc.ai*. Me chamo *Amélia*.\nDigite *menu* para ver as opções.', time: '14:20' },
];

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
      const script = [
        { text: 'menu', delay: 2000 },
        { text: '1', delay: 2500 },
        { text: 'João Silva', delay: 2000 },
        { text: 'add coca 2', delay: 2500 },
        { text: 'fechar', delay: 2000 },
        { text: '1', delay: 2500 },
      ];

      for (const step of script) {
        await new Promise(resolve => timeout = setTimeout(resolve, step.delay));
        processInput(step.text);
      }

      await new Promise(resolve => timeout = setTimeout(resolve, 10000));
      setMessages(initialMessages);
      setBotState('idle');
      runScript();
    };

    runScript();
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
