import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Message {
  from: 'user' | 'bot';
  text: string;
  time: string;
}

const conversation: Message[] = [
  { from: 'bot', text: 'Olá! 👋 Bem-vindo ao ZapPDV.\nDigite *menu* para ver as opções.', time: '14:20' },
  { from: 'user', text: 'menu', time: '14:20' },
  { from: 'bot', text: '📋 *Menu Principal*\n\n1️⃣ Nova venda\n2️⃣ Consultar estoque\n3️⃣ Meus pedidos\n4️⃣ Relatório do dia\n5️⃣ Ajuda\n\nDigite o número da opção:', time: '14:21' },
  { from: 'user', text: '1', time: '14:21' },
  { from: 'bot', text: '🛒 *Nova venda iniciada!*\n\nDigite o nome do cliente ou "balcão":', time: '14:21' },
  { from: 'user', text: 'balcão', time: '14:22' },
  { from: 'bot', text: '✅ Venda para *Balcão*\n\nAdicione itens:\n*add [produto] [qtd]*\n\nExemplo: add coca 2', time: '14:22' },
  { from: 'user', text: 'add coca 3', time: '14:22' },
  { from: 'bot', text: '✅ *3x Coca-Cola 350ml* adicionado\nSubtotal: R$ 15,00\n\n🛒 Total atual: *R$ 15,00*\nDigite "fechar" para finalizar.', time: '14:22' },
  { from: 'user', text: 'add agua 2', time: '14:23' },
  { from: 'bot', text: '✅ *2x Água Mineral 500ml* adicionado\nSubtotal: R$ 5,00\n\n🛒 Total atual: *R$ 20,00*\nDigite "fechar" para finalizar.', time: '14:23' },
  { from: 'user', text: 'fechar', time: '14:23' },
  { from: 'bot', text: '📦 *Resumo do Pedido #P008*\n\n• 3x Coca-Cola 350ml — R$ 15,00\n• 2x Água Mineral 500ml — R$ 5,00\n\n💰 *Total: R$ 20,00*\n\nForma de pagamento?\n1️⃣ PIX\n2️⃣ Dinheiro\n3️⃣ Cartão\n4️⃣ Fiado', time: '14:24' },
];

export function ChatMockup() {
  const [visibleCount, setVisibleCount] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleCount < conversation.length) {
      const timeout = setTimeout(() => {
        setVisibleCount(c => c + 1);
      }, visibleCount === 0 ? 500 : 900);
      return () => clearTimeout(timeout);
    }
  }, [visibleCount]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visibleCount]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4 }}
      className="rounded-3xl border border-border bg-card overflow-hidden shadow-2xl glow-green"
    >
      {/* Header */}
      <div className="bg-surface-2 px-4 py-3 flex items-center gap-3 border-b border-border">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-primary font-display font-bold text-base">Z</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">ZapPDV Bot</p>
          <p className="text-xs text-primary">online</p>
        </div>
      </div>
      {/* Messages */}
      <div
        ref={chatRef}
        className="h-[420px] overflow-y-auto p-4 space-y-3"
        style={{ background: 'hsl(210 25% 5%)' }}
      >
        {conversation.slice(0, visibleCount).map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
              msg.from === 'user'
                ? 'bg-primary/20 text-foreground rounded-br-md'
                : 'bg-surface-2 text-foreground rounded-bl-md'
            }`}>
              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
              <p className={`text-[10px] mt-1 text-right ${
                msg.from === 'user' ? 'text-primary/60' : 'text-muted-foreground/60'
              }`}>{msg.time}</p>
            </div>
          </motion.div>
        ))}
        {visibleCount < conversation.length && (
          <div className="flex items-center gap-1 text-muted-foreground/50 px-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
          </div>
        )}
      </div>
      {/* Input mock */}
      <div className="bg-surface-2 px-4 py-3 border-t border-border">
        <div className="rounded-full bg-muted px-4 py-2.5 text-sm text-muted-foreground">
          Digite uma mensagem...
        </div>
      </div>
    </motion.div>
  );
}
