import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, Package, BarChart3, Users, Bell, Shield,
  MessageSquare, ArrowRight, Check, Star, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMockup } from '@/components/landing/ChatMockup';

const features = [
  { icon: ShoppingCart, title: 'PDV por mensagem', desc: 'Abra pedidos e feche vendas sem sair do chat' },
  { icon: Package, title: 'Estoque automático', desc: 'Cada venda atualiza o estoque em tempo real' },
  { icon: BarChart3, title: 'Relatórios na hora', desc: 'Peça "resumo do dia" e receba em segundos' },
  { icon: Users, title: 'Clientes automáticos', desc: 'Cadastro pelo número, histórico sempre disponível' },
  { icon: Bell, title: 'Alertas inteligentes', desc: 'Estoque baixo, fiado vencido, fechamento do dia' },
  { icon: Shield, title: 'Multi-operador', desc: 'Defina permissões por vendedor, gerente e admin' },
];

const steps = [
  'Conecte seu WhatsApp',
  'Cadastre seus produtos',
  'Adicione sua equipe',
  'Comece a vender pelo chat',
  'Acompanhe pelo painel',
];

const plans = [
  { name: 'Básico', price: '97', features: ['1 número WhatsApp', 'Até 500 produtos', '2 operadores', 'Relatórios básicos'], highlight: false },
  { name: 'Pro', price: '197', features: ['3 números WhatsApp', 'Produtos ilimitados', '10 operadores', 'Relatórios avançados', 'Suporte prioritário'], highlight: true },
  { name: 'Enterprise', price: '497', features: ['Números ilimitados', 'Multi-loja', 'API completa', 'Suporte dedicado', 'SLA garantido'], highlight: false },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background bg-noise">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="font-display font-extrabold text-xl text-foreground">
            Zap<span className="text-primary">PDV</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Como funciona</a>
            <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Preços</a>
          </div>
          <Link to="/login">
            <Button className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 rounded-xl">
              Começar grátis
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6"
            >
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse-green" />
              <span className="text-sm text-primary font-medium">PDV 100% no WhatsApp — sem app extra</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-tight mb-6"
            >
              Venda, gerencie e cresça pelo{' '}
              <span className="text-primary">WhatsApp</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-muted-foreground font-light max-w-2xl mx-auto mb-8"
            >
              Bot inteligente que transforma seu WhatsApp em um PDV completo. Pedidos, estoque e relatórios direto nas mensagens.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link to="/login">
                <Button size="lg" className="bg-primary text-primary-foreground font-bold rounded-xl px-8 glow-green hover:bg-primary/90">
                  Testar grátis 14 dias <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/bot-simulator">
                <Button size="lg" variant="outline" className="border-border text-foreground rounded-xl px-8 hover:bg-muted">
                  <MessageSquare className="mr-2 h-4 w-4" /> Ver como funciona
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center justify-center gap-8 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" /> 2min para configurar</span>
              <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-primary" /> 100% no WhatsApp</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> 0 app para baixar</span>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="max-w-md mx-auto"
          >
            <ChatMockup />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">Tudo que você precisa para vender</h2>
            <p className="text-muted-foreground">Recursos pensados para o dia a dia do lojista brasileiro</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl border border-border bg-card p-6 hover:border-primary/20 hover:-translate-y-1 transition-all group"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">Como funciona</h2>
            <p className="text-muted-foreground">Comece a vender em 5 passos simples</p>
          </div>
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex-1 text-center"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3 font-display font-bold text-primary">
                  {i + 1}
                </div>
                <p className="text-sm font-medium text-foreground">{step}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block h-px w-full bg-border mt-6" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">Planos simples, sem surpresas</h2>
            <p className="text-muted-foreground">Comece grátis por 14 dias. Sem cartão de crédito.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`rounded-2xl border p-6 transition-all hover:-translate-y-1 ${
                  plan.highlight
                    ? 'border-primary bg-primary/5 glow-green relative'
                    : 'border-border bg-card'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      <Star className="h-3 w-3" /> Mais popular
                    </span>
                  </div>
                )}
                <h3 className="font-display font-bold text-lg text-foreground mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-display font-bold text-foreground">R${plan.price}</span>
                  <span className="text-muted-foreground text-sm">/mês</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <Button className={`w-full rounded-xl font-bold ${
                    plan.highlight
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}>
                    Começar grátis
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">
            Comece a vender pelo WhatsApp hoje mesmo
          </h2>
          <Link to="/login">
            <Button size="lg" className="bg-primary text-primary-foreground font-bold rounded-xl px-10 glow-green hover:bg-primary/90">
              Começar grátis <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">14 dias grátis. Sem cartão de crédito.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display font-extrabold text-lg text-foreground">
            Zap<span className="text-primary">PDV</span>
          </span>
          <p className="text-xs text-muted-foreground">© 2025 ZapPDV. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
