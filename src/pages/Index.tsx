import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Package, BarChart3, Users, Bell, Shield,
  MessageSquare, ArrowRight, Check, Star, Zap, Bot, Gauge, Clock, Wifi,
  LayoutDashboard, Mail, Phone, MapPin, Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMockup } from '@/components/landing/ChatMockup';
import { AnimatedBackground } from '@/components/landing/AnimatedBackground';
import { useGetPlans } from '@/services/billing.service';
import { SubscriptionPlan } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const features = [
  { icon: ShoppingCart, title: 'PDV por mensagem', desc: 'Abra pedidos e feche vendas sem sair do chat' },
  { icon: Package, title: 'Estoque automático', desc: 'Cada venda atualiza o estoque em tempo real' },
  { icon: BarChart3, title: 'Relatórios na hora', desc: 'Peça "resumo do dia" e receba em segundos' },
  { icon: Users, title: 'Clientes automáticos', desc: 'Cadastro pelo número, histórico sempre disponível' },
  { icon: Bell, title: 'Alertas inteligentes', desc: 'Estoque baixo, fiado vencido, fechamento do dia' },
  { icon: Shield, title: 'Multi-operador', desc: 'Defina permissões por vendedor, gerente e admin' },
];

const steps = [
  { title: 'Conecte seu WhatsApp', icon: Wifi },
  { title: 'Cadastre seus produtos', icon: Package },
  { title: 'Adicione sua equipe', icon: Users },
  { title: 'Comece a vender pelo chat', icon: MessageSquare },
  { title: 'Acompanhe pelo painel', icon: LayoutDashboard },
];

const defaultPlans = [
  { name: 'Básico', price: '97', features: ['1 número WhatsApp', 'Até 500 produtos', '2 operadores', 'Relatórios básicos'], is_highlighted: false, slug: 'basico' },
  { name: 'Pro', price: '197', features: ['3 números WhatsApp', 'Produtos ilimitados', '10 operadores', 'Relatórios avançados', 'Suporte prioritário'], is_highlighted: true, slug: 'pro' },
  { name: 'Enterprise', price: '497', features: ['Números ilimitados', 'Multi-loja', 'API completa', 'Suporte dedicado', 'SLA garantido'], is_highlighted: false, slug: 'enterprise' },
];

const planStyles: Record<string, { card: string; badge: string; button: string; icon: string }> = {
  basico: {
    card: 'border-slate-800 bg-slate-900/40 hover:border-slate-700',
    badge: 'bg-slate-700 text-slate-200',
    button: 'bg-slate-800 text-slate-200 hover:bg-slate-700',
    icon: 'text-slate-400',
  },
  pro: {
    card: 'border-primary/50 bg-primary/10 hover:border-primary relative shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)]',
    badge: 'bg-primary text-primary-foreground',
    button: 'bg-primary text-primary-foreground hover:bg-primary/90',
    icon: 'text-primary',
  },
  enterprise: {
    card: 'border-indigo-500/40 bg-indigo-500/10 hover:border-indigo-400 relative',
    badge: 'bg-indigo-500 text-white',
    button: 'bg-indigo-500 text-white hover:bg-indigo-400',
    icon: 'text-indigo-400',
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { data: serverPlans } = useGetPlans();

  const displayPlans = serverPlans && serverPlans.length > 0 ? serverPlans : defaultPlans;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <nav className={`fixed left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'top-0 bg-background/80 backdrop-blur-xl border-b border-border' : 'top-4'
        }`}>
        <div className="w-[80vw] md:max-w-7xl mx-auto h-16 flex items-center justify-between">
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center h-14 w-48"
          >
            <img
              src="https://i.imgur.com/9bkJZlL.png"
              alt="ZapPDV"
              className="w-full h-full object-contain"
            />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Recursos</a>
            <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Como funciona</a>
            <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Preços</a>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="outline" className="border-border text-foreground rounded-xl">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Painel
                </Button>
              </Link>
              <Link to="/login">
                <Button className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 rounded-xl">
                  Começar grátis
                </Button>
              </Link>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="text-left">
                      <img
                        src="https://i.imgur.com/MLqNJHh.png"
                        alt="Gerenci.AI | Gestão na Palma da mão"
                        className="h-8 object-contain"
                      />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-6 mt-12 px-2">
                    <a href="#recursos" className="text-lg font-medium hover:text-primary transition-colors">Recursos</a>
                    <a href="#como-funciona" className="text-lg font-medium hover:text-primary transition-colors">Como funciona</a>
                    <a href="#precos" className="text-lg font-medium hover:text-primary transition-colors">Preços</a>
                    <div className="h-px bg-border my-2" />
                    <Link to="/dashboard" className="w-full">
                      <Button variant="outline" className="w-full justify-start text-lg h-12 rounded-xl">
                        <LayoutDashboard className="mr-3 h-5 w-5" /> Painel
                      </Button>
                    </Link>
                    <Link to="/login" className="w-full">
                      <Button className="w-full text-lg h-12 rounded-xl font-bold">
                        Começar grátis
                      </Button>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Always visible on small screens (non-desktop) but hidden when dashboard link is visible */}
            <Link to="/login" className="sm:hidden">
              <Button className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 rounded-xl px-4 py-2 text-sm h-9">
                Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-4 overflow-hidden">
        <AnimatedBackground />
        {/* Gradient overlays */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[150px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px] animate-float [animation-delay:1.5s]" />
        </div>

        <div className="w-[80vw] md:max-w-7xl mx-auto relative z-10">
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
              className="text-4xl sm:text-5xl lg:text-7xl font-hero font-black text-foreground leading-[1.1] mb-6 tracking-tight"
            >
              Venda, gerencie e cresça pelo{' '}
              <span className="text-gradient-green">WhatsApp</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground font-light max-w-2xl mx-auto mb-8"
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
                <Button size="lg" className="bg-primary text-primary-foreground font-bold rounded-xl px-8 hover:bg-primary/90 text-base h-12">
                  Testar grátis 14 dias <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" /> 2min para configurar</span>
              <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-primary" /> 100% no WhatsApp</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> 0 app para baixar</span>
            </motion.div>
          </div>

          {/* Bot simulator + System info */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start w-[80vw] md:max-w-7xl mx-auto">
            <div className="lg:col-span-3">
              <ChatMockup />
            </div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="lg:col-span-2 space-y-4"
            >
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Como funciona na prática</h3>
              {[
                { icon: Bot, title: 'Bot Inteligente', desc: 'Responde comandos naturais como "add coca 3" e processa pedidos automaticamente.' },
                { icon: Gauge, title: 'Estoque em Tempo Real', desc: 'Cada venda atualiza o estoque instantaneamente. Alertas automáticos de reposição.' },
                { icon: Clock, title: 'Relatórios Instantâneos', desc: 'Peça "resumo do dia" e receba faturamento, ticket médio e top produtos.' },
                { icon: Wifi, title: 'Zero Infraestrutura', desc: 'Funciona 100% via WhatsApp. Sem app, sem hardware, sem complicação.' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + i * 0.15 }}
                  className="flex gap-3 p-4 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all group"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-0.5">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-20 px-4">
        <div className="w-[80vw] md:max-w-7xl mx-auto">
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
      <section id="como-funciona" className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-orange-500/[0.02] -skew-y-3 transform origin-right" />

        <div className="w-[80vw] md:max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4 font-hero">Como funciona</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Tudo o que você precisa em 5 passos simples para transformar seu atendimento</p>
          </div>

          {/* Desktop Stepper */}
          <div className="hidden md:flex items-start justify-between gap-4 relative">
            <div className="absolute top-12 left-0 right-0 h-0.5 bg-border z-0" />
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex-1 flex flex-col items-center text-center relative z-10"
              >
                <div className="h-24 w-24 rounded-3xl bg-card border border-border shadow-sm flex items-center justify-center mb-6 group hover:border-orange-500/50 hover:shadow-orange-500/10 transition-all duration-300">
                  <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-sm shadow-lg">
                    {i + 1}
                  </div>
                  <step.icon className="h-10 w-10 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-sm font-bold text-foreground max-w-[150px] leading-tight">
                  {step.title}
                </h3>
              </motion.div>
            ))}
          </div>

          {/* Mobile Stepper */}
          <div className="md:hidden space-y-12 relative before:absolute before:left-[23px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-orange-500/50 before:via-orange-500/20 before:to-transparent">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex gap-6 relative"
              >
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
                    <step.icon className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-[10px] shadow-md">
                    {i + 1}
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="text-lg font-bold text-foreground mb-1 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {i === 0 && 'Configure seu bot em minutos e conecte com seu WhatsApp profissional.'}
                    {i === 1 && 'Importe sua planilha ou cadastre seus produtos pelo próprio chat.'}
                    {i === 2 && 'Crie acessos para seus vendedores com diferentes permissões.'}
                    {i === 3 && 'Receba pedidos automáticos e responda comandos naturais.'}
                    {i === 4 && 'Acompanhe tudo em tempo real pelo seu dashboard exclusivo.'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-20 px-4">
        <div className="w-[80vw] md:max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">Planos simples, sem surpresas</h2>
            <p className="text-muted-foreground">Comece grátis por 14 dias. Sem cartão de crédito.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {displayPlans.map((plan, i) => {
              const style = planStyles[plan.slug] || planStyles.basico;
              return (
                <motion.div
                  key={plan.name}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className={`rounded-2xl border p-6 transition-all hover:-translate-y-1 ${style.card}`}
                >
                  {plan.is_highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full shadow-lg ${style.badge}`}>
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
                        <Check className={`h-4 w-4 flex-shrink-0 ${style.icon}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/login">
                    <Button className={`w-full rounded-xl font-bold ${style.button}`}>
                      Começar grátis
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-4">
        <div className="w-[80vw] md:max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">
            Comece a vender pelo WhatsApp hoje mesmo
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="bg-primary text-primary-foreground font-bold rounded-xl px-10 hover:bg-primary/90">
                Começar grátis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="border-border text-foreground rounded-xl px-10 hover:bg-muted">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Acessar Painel
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">14 dias grátis. Sem cartão de crédito.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 shadow-sm bg-card/10">
        <div className="w-[80vw] md:max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <Link to="/" className="flex items-center mb-3 h-14 w-40">
                <img
                  src="https://i.imgur.com/9bkJZlL.png"
                  alt="ZapPDV"
                  className="w-full h-full object-contain"
                />
              </Link>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Transforme seu WhatsApp em um PDV completo. Venda, gerencie estoque e acompanhe relatórios em tempo real.
              </p>
            </div>
            <div>
              <h4 className="font-display font-bold text-foreground mb-3">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#recursos" className="hover:text-foreground transition-colors">Recursos</a></li>
                <li><a href="#precos" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-foreground mb-3">Acesso</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Painel de Controle</Link></li>
                <li><Link to="/login" className="hover:text-foreground transition-colors">Login</Link></li>
                <li><Link to="/pedidos" className="hover:text-foreground transition-colors">Pedidos</Link></li>
                <li><Link to="/produtos" className="hover:text-foreground transition-colors">Produtos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-foreground mb-3">Contato</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> contato@gerencia.store</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> (43) 98844-1992</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Jacarezinho, PR</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2025 ZapPDV. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos de uso</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
