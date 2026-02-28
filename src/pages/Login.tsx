import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Phone, Lock, Sparkles, Store, CheckCircle2, KeyRound, ArrowRight } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import { AnimatedBackground } from '@/components/landing/AnimatedBackground';

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'whatsapp' | 'password' | 'setup' | 'register'>('whatsapp');
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [whatsapp, setWhatsapp] = useState('');
  const [pin, setPin] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // User info from pre-check
  const [userInfo, setUserInfo] = useState<{ first_name?: string; exists: boolean; needs_setup: boolean } | null>(null);

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsapp) {
      toast.error("Informe seu WhatsApp.");
      return;
    }

    setIsLoading(true);
    try {
      const check = await authService.checkUser(whatsapp);
      setUserInfo(check);

      if (check.exists) {
        if (check.needs_setup) {
          setStep('setup');
          toast.info(`Olá ${check.first_name || ''}, você precisa criar uma senha.`);
        } else {
          setStep('password');
        }
      } else {
        setStep('register');
        toast.info("WhatsApp não encontrado. Vamos criar sua conta?");
      }
    } catch (err: any) {
      toast.error("Erro ao verificar conta.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'password') {
      if (!pin) {
        toast.error("Informe sua senha.");
        return;
      }
      setIsLoading(true);
      try {
        await authService.login(whatsapp, pin);
        toast.success("Bem-vindo de volta!");
        navigate('/dashboard');
      } catch (err: any) {
        toast.error(err.response?.data?.detail || "Senha incorreta.");
      } finally {
        setIsLoading(false);
      }
    } else if (step === 'setup') {
      if (!pin || pin !== confirmPin) {
        toast.error("As senhas não coincidem.");
        return;
      }
      setIsLoading(true);
      try {
        await authService.setupPassword(whatsapp, pin, confirmPin);
        toast.success("Senha criada com sucesso!");
        // Auto-login
        await authService.login(whatsapp, pin);
        navigate('/dashboard');
      } catch (err: any) {
        toast.error("Erro ao criar senha.");
      } finally {
        setIsLoading(false);
      }
    } else if (step === 'register') {
      if (!businessName || !pin || pin !== confirmPin) {
        toast.error("Preencha todos os campos corretamente.");
        return;
      }
      setIsLoading(true);
      try {
        await authService.register({ businessName, whatsapp, pin });
        toast.success("Conta criada! Fazendo login...");
        await authService.login(whatsapp, pin);
        navigate('/dashboard');
      } catch (err: any) {
        toast.error(err.message || "Erro ao criar conta.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center px-4 overflow-hidden">
      <AnimatedBackground />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] animate-pulse [animation-delay:2s]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full sm:w-[25vw] relative z-10"
      >
        <button
          onClick={() => step === 'whatsapp' ? navigate('/') : setStep('whatsapp')}
          className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground mb-6 group transition-colors"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> Voltar
        </button>

        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="mb-6 flex flex-col items-center text-center">
            <motion.div
              layoutId="logo"
              className="mb-4 h-20 flex items-center justify-center"
            >
              <img src="https://i.imgur.com/qjT8M0X.png" alt="ZapPDV" className="w-full h-full object-contain max-h-16 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <h2 className="text-xl font-display font-bold text-foreground mb-1 flex items-center justify-center gap-2">
                  {step === 'whatsapp' && 'Acessar Painel'}
                  {step === 'password' && `Olá, ${userInfo?.first_name || 'Operador'}`}
                  {step === 'setup' && 'Criar Senha'}
                  {step === 'register' && 'Criar Conta'}
                  <Sparkles className="h-5 w-5 text-primary" />
                </h2>
                <p className="text-[13px] text-muted-foreground leading-tight px-4">
                  {step === 'whatsapp' && 'Login para gerenciar sua loja via WhatsApp'}
                  {step === 'password' && 'Informe sua senha para entrar no sistema'}
                  {step === 'setup' && 'Defina uma senha para seu primeiro acesso'}
                  {step === 'register' && 'Comece a gerenciar seu negócio agora'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <form onSubmit={step === 'whatsapp' ? handleNextStep : handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {step === 'whatsapp' && (
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">WhatsApp</Label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        placeholder="11999998888"
                        value={whatsapp}
                        onChange={e => setWhatsapp(e.target.value)}
                        className="pl-9 h-10 bg-muted/30 border-border/50 rounded-xl text-sm"
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {(step === 'password' || step === 'setup' || step === 'register') && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center mb-2">
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                    <p className="text-sm font-bold text-foreground font-mono">{whatsapp}</p>
                  </div>
                )}

                {step === 'register' && (
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Nome da Empresa</Label>
                    <div className="relative group">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        placeholder="Ex: Minha Loja"
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        className="pl-9 h-10 bg-muted/30 border-border/50 rounded-xl text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                {(step === 'password' || step === 'setup' || step === 'register') && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <Label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/70">
                        {step === 'password' ? 'Senha' : 'Crie sua Senha'}
                      </Label>
                      {step === 'password' && <button type="button" className="text-[11px] text-primary hover:underline font-bold uppercase">Esqueceu?</button>}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="password"
                        placeholder="••••"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        className="pl-9 h-10 bg-muted/30 border-border/50 rounded-xl text-sm"
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {(step === 'setup' || step === 'register') && (
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Confirmar Senha</Label>
                    <div className="relative group">
                      <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="password"
                        placeholder="••••"
                        value={confirmPin}
                        onChange={e => setConfirmPin(e.target.value)}
                        className="pl-9 h-10 bg-muted/30 border-border/50 rounded-xl text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2 group text-sm"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Processando...</>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {step === 'whatsapp' && 'Avançar'}
                  {step === 'password' && 'Entrar no Sistema'}
                  {step === 'setup' && 'Salvar e Entrar'}
                  {step === 'register' && 'Criar Conta'}
                  {step === 'whatsapp' ? <ArrowRight className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </span>
              )}
            </Button>
          </form>

          {step === 'whatsapp' && (
            <div className="mt-6 pt-4 border-t border-border/50 text-center">
              <p className="text-[12px] text-muted-foreground">
                Não tem uma conta? {' '}
                <button
                  onClick={() => setStep('register')}
                  className="text-primary font-bold hover:underline transition-all"
                >
                  Começar grátis
                </button>
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 p-3 rounded-xl bg-primary/5 border border-primary/10 text-[11px] text-muted-foreground/80 text-center italic">
          {step === 'whatsapp' ? 'Ambiente Real: Use seu WhatsApp e senha cadastrados.' : 'Conectando ao seu painel administrativo.'}
        </div>
      </motion.div>
    </div>
  );
}
