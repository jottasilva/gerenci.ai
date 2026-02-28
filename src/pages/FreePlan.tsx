import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Bot, Check, ArrowRight, Wifi, MessageSquare,
    ChevronLeft, Sparkles, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InteractiveParticles } from '@/components/landing/InteractiveParticles';
import { toast } from 'sonner';
import { api } from '@/services/api';

export default function FreePlan() {
    const [whatsapp, setWhatsapp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanNumber = whatsapp.replace(/\D/g, '');
        if (cleanNumber.length < 10) {
            toast.error('Por favor, insira um número de WhatsApp válido.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Check if user exists
            const checkRes = await api.post('accounts/check-user/', { whatsapp: cleanNumber });

            if (checkRes.data.exists) {
                toast.error('Este número já possui uma conta ativa. Por favor, faça login.');
                setIsSubmitting(false);
                return;
            }

            // Simulate API call for activation
            await new Promise(resolve => setTimeout(resolve, 1500));

            setIsSubmitting(false);
            setIsSuccess(true);
            toast.success('Assinatura iniciada com sucesso!');
        } catch (err) {
            console.error(err);
            toast.error('Erro ao processar sua solicitação. Tente novamente.');
            setIsSubmitting(false);
        }
    };

    const fadeUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="min-h-screen bg-[#030303] text-white relative overflow-hidden font-sans">
            {/* Background Effect */}
            <InteractiveParticles />
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 py-6 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/20 transition-all">
                            <ChevronLeft className="h-6 w-6 text-orange-500" />
                        </div>
                        <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">Voltar</span>
                    </Link>
                    <img
                        src="https://i.imgur.com/qjT8M0X.png"
                        alt="Gerenci.ai"
                        className="h-8 object-contain"
                    />
                </div>
            </nav>

            <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
                <AnimatePresence mode="wait">
                    {!isSuccess ? (
                        <motion.div
                            key="form"
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, scale: 0.95 }}
                            variants={fadeUp}
                            className="w-full max-w-xl text-center"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-8">
                                <Sparkles className="h-4 w-4 text-orange-500" />
                                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Acesso Vitalício Gratuito</span>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">
                                Comece agora com o <span className="text-orange-500">Plano Free</span>
                            </h1>
                            <p className="text-zinc-400 text-lg mb-12 max-w-lg mx-auto leading-relaxed">
                                Tenha todas as ferramentas essenciais para digitalizar suas vendas via WhatsApp sem custo algum.
                            </p>

                            <div className="bg-zinc-900/50 backdrop-blur-2xl border border-white/5 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Bot className="h-32 w-32" />
                                </div>

                                <form onSubmit={handleSubmit} className="relative z-10">
                                    <div className="text-left mb-8">
                                        <label className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 block">
                                            Seu WhatsApp Profissional
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                                                <MessageSquare className="h-5 w-5" />
                                            </div>
                                            <Input
                                                type="tel"
                                                placeholder="(00) 00000-0000"
                                                className="h-16 pl-12 rounded-2xl bg-black/40 border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20 text-white text-lg font-bold"
                                                value={whatsapp}
                                                onChange={(e) => setWhatsapp(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-16 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processando...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Ativar Grátis Agora <ArrowRight className="h-5 w-5" />
                                            </span>
                                        )}
                                    </Button>

                                    <div className="mt-8 grid grid-cols-2 gap-4">
                                        {[
                                            '1 Número WhatsApp',
                                            'Gestão de Estoque',
                                            'Relatórios de Vendas',
                                            'Acesso ao PDV'
                                        ].map((feat) => (
                                            <div key={feat} className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                                <Check className="h-3 w-3 text-orange-500 shrink-0" />
                                                {feat}
                                            </div>
                                        ))}
                                    </div>
                                </form>
                            </div>

                            <p className="mt-8 text-xs text-zinc-500 italic">
                                * Sem necessidade de cartão de crédito. Uso gratuito para sempre.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-lg text-center bg-zinc-900/80 backdrop-blur-3xl border border-orange-500/30 p-12 rounded-[3.5rem] shadow-[0_0_50px_rgba(249,115,22,0.2)]"
                        >
                            <div className="h-24 w-24 rounded-[2rem] bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mx-auto mb-8 relative">
                                <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full" />
                                <CheckCircle2 className="h-12 w-12 text-orange-500 relative z-10" />
                            </div>

                            <h2 className="text-3xl font-display font-bold mb-4 tracking-tight">Assinatura Concluída!</h2>
                            <p className="text-zinc-400 mb-10 leading-relaxed text-sm">
                                Seu plano free foi ativado com sucesso para o número <strong>{whatsapp}</strong>.
                                Em instantes você receberá um contato em seu WhatsApp para os próximos passos.
                            </p>

                            <div className="space-y-4">
                                <Link to="/dashboard">
                                    <Button className="w-full h-14 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold">
                                        Acessar meu Painel
                                    </Button>
                                </Link>
                                <Link to="/">
                                    <Button variant="ghost" className="w-full h-14 rounded-2xl text-zinc-400 hover:text-white">
                                        Voltar ao Início
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Decorative Orbs */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-orange-500/10 blur-[150px] rounded-full pointer-events-none" />
        </div>
    );
}
