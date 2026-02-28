import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Phone, Lock, Sparkles, Store, CheckCircle2, KeyRound } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import { AnimatedBackground } from '@/components/landing/AnimatedBackground';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'setup-password'>('login');
  const [isLoading, setIsLoading] = useState(false);

  // States
  const [whatsapp, setWhatsapp] = useState('');
  const [pin, setPin] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  // Setup password states
  const [setupWhatsapp, setSetupWhatsapp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'setup-password') {
      // Password setup flow
      if (!newPassword || !confirmNewPassword) {
        toast.error("Preencha a nova senha e a confirmação.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        toast.error("As senhas não coincidem.");
        return;
      }
      setIsLoading(true);
      try {
        await authService.setupPassword(setupWhatsapp, newPassword, confirmNewPassword);
        toast.success("Senha criada com sucesso! Fazendo login...");
        // Auto-login after setup
        try {
          await authService.login(setupWhatsapp, newPassword);
          navigate('/dashboard');
        } catch {
          toast.success("Senha criada! Faça login com sua nova senha.");
          setMode('login');
          setWhatsapp(setupWhatsapp);
          setPin('');
        }
      } catch (err: any) {
        toast.error(err.response?.data?.detail || "Erro ao criar senha.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'login') {
      if (!whatsapp || !pin) {
        toast.error("Preencha todos os campos.");
        return;
      }
      setIsLoading(true);
      try {
        await authService.login(whatsapp, pin);
        toast.success("Bem-vindo de volta!");
        navigate('/dashboard');
      } catch (err: any) {
        if (err.needs_password_setup) {
          // Switch to password setup mode
          setSetupWhatsapp(err.whatsapp || whatsapp);
          setMode('setup-password');
          setNewPassword('');
          setConfirmNewPassword('');
          toast.info("🔑 Crie sua senha de acesso para continuar.");
        } else {
          toast.error(err.message || "Erro ao fazer login.");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Cadastro flow
      if (!businessName || !whatsapp || !pin || !confirmPin) {
        toast.error("Preencha todos os campos do cadastro.");
        return;
      }
      if (pin !== confirmPin) {
        toast.error("As senhas não coincidem.");
        return;
      }

      setIsLoading(true);
      try {
        await authService.register({ businessName, whatsapp, pin });
        toast.success("Conta criada com sucesso! Faça login para continuar.");
        setMode('login');
      } catch (err: any) {
        toast.error(err.message || "Erro ao criar conta.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isLogin = mode === 'login';
  const isSetupPassword = mode === 'setup-password';

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center px-4 overflow-hidden">
      <AnimatedBackground />

      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] animate-pulse [animation-delay:2s]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full sm:w-[25vw] relative z-10"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground mb-6 group transition-colors"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> Voltar
        </Link>

        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          {/* Subtle top light effect */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="mb-6 flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="mb-4 h-20 flex items-center justify-center"
            >
              <img
                src="https://i.imgur.com/qjT8M0X.png"
                alt="ZapPDV"
                className="w-full h-full object-contain max-h-16 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              />
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={isSetupPassword ? 'setup-head' : isLogin ? 'login-head' : 'register-head'}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-display font-bold text-foreground mb-1 flex items-center justify-center gap-2">
                  {isSetupPassword ? 'Criar Senha' : isLogin ? 'Acessar Painel' : 'Criar Conta'}
                  {isSetupPassword ? <KeyRound className="h-5 w-5 text-primary" /> : <Sparkles className="h-5 w-5 text-primary" />}
                </h2>
                <p className="text-[13px] text-muted-foreground leading-tight px-4">
                  {isSetupPassword
                    ? 'Defina sua senha de acesso ao sistema'
                    : isLogin
                      ? 'Login para gerenciar sua loja via WhatsApp'
                      : 'Comece a gerenciar seu negócio agora mesmo'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={isSetupPassword ? 'setup-fields' : isLogin ? 'login-fields' : 'register-fields'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {isSetupPassword ? (
                  <>
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
                      <p className="text-xs text-muted-foreground">Criando senha para</p>
                      <p className="text-sm font-bold text-foreground font-mono">{setupWhatsapp}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Nova Senha</Label>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                          <KeyRound className="h-3.5 w-3.5" />
                        </div>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Crie sua senha"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="pl-9 h-10 bg-muted/30 border-border/50 rounded-xl focus:ring-primary/20 focus:border-primary/30 transition-all text-sm"
                          disabled={isLoading}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmNewPassword" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Confirmar Senha</Label>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        <Input
                          id="confirmNewPassword"
                          type="password"
                          placeholder="Confirme sua senha"
                          value={confirmNewPassword}
                          onChange={e => setConfirmNewPassword(e.target.value)}
                          className="pl-9 h-10 bg-muted/30 border-border/50 rounded-xl focus:ring-primary/20 focus:border-primary/30 transition-all text-sm"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {!isLogin && (
                      <div className="space-y-1.5">
                        <Label htmlFor="businessName" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Nome da Empresa</Label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                            <Store className="h-3.5 w-3.5" />
                          </div>
                          <Input
                            id="businessName"
                            placeholder="Ex: Minha Loja"
                            value={businessName}
                            onChange={e => setBusinessName(e.target.value)}
                            className="pl-9 h-10 bg-muted/30 border-border/50 rounded-xl focus:ring-primary/20 focus:border-primary/30 transition-all text-sm"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="whatsapp" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">WhatsApp</Label>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                          <Phone className="h-3.5 w-3.5" />
                        </div>
                        <Input
                          id="whatsapp"
                          placeholder="11999998888"
                          value={whatsapp}
                          onChange={e => setWhatsapp(e.target.value)}
                          className="pl-9 h-10 bg-muted/30 border-border/50 rounded-xl focus:ring-primary/20 focus:border-primary/30 transition-all text-sm"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center ml-1">
                        <Label htmlFor="pin" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/70">PIN / Senha</Label>
                        {isLogin && <Link to="#" className="text-[11px] text-primary hover:underline font-bold uppercase">Esqueceu?</Link>}
                      </div>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                          <Lock className="h-3.5 w-3.5" />
                        </div>
                        <Input
                          id="pin"
                          type="password"
                          placeholder="••••"
                          value={pin}
                          onChange={e => setPin(e.target.value)}
                          className="pl-9 h-10 bg-muted/30 border-border/50 rounded-xl focus:ring-primary/20 focus:border-primary/30 transition-all text-sm"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {!isLogin && (
                      <div className="space-y-1.5">
                        <Label htmlFor="confirmPin" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Confirmar PIN</Label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </div>
                          <Input
                            id="confirmPin"
                            type="password"
                            placeholder="••••"
                            value={confirmPin}
                            onChange={e => setConfirmPin(e.target.value)}
                            className="pl-9 h-10 bg-muted/30 border-border/50 rounded-xl focus:ring-primary/20 focus:border-primary/30 transition-all text-sm"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2 group text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Processando...
                </>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isSetupPassword ? 'Criar Senha e Entrar' : isLogin ? 'Entrar no Sistema' : 'Finalizar Cadastro'}
                  {isSetupPassword ? <KeyRound className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" /> : <Sparkles className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border/50 text-center">
            <p className="text-[12px] text-muted-foreground">
              {isSetupPassword ? (
                <>
                  <button
                    onClick={() => setMode('login')}
                    className="text-primary font-bold hover:underline transition-all"
                  >
                    ← Voltar ao login
                  </button>
                </>
              ) : (
                <>
                  {isLogin ? 'Não tem uma conta?' : 'Já possui uma conta?'} {' '}
                  <button
                    onClick={() => setMode(isLogin ? 'register' : 'login')}
                    className="text-primary font-bold hover:underline transition-all"
                  >
                    {isLogin ? 'Começar grátis' : 'Fazer login'}
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-3 rounded-xl bg-primary/5 border border-primary/10 text-[11px] text-muted-foreground/80 text-center italic"
        >
          {isSetupPassword
            ? 'Seu administrador criou sua conta. Defina uma senha para acessar.'
            : isLogin
              ? 'Ambiente Real: Use seu WhatsApp e senha cadastrados.'
              : 'Sua conta estará pronta para uso instantaneamente.'}
        </motion.div>
      </motion.div>
    </div>
  );
}
