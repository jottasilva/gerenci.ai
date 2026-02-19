import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to dashboard for now (mock)
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-background bg-noise flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>
      <div className="w-full max-w-sm relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="mb-8">
          <h1 className="font-display font-extrabold text-2xl text-foreground mb-1">
            Zap<span className="text-primary">PDV</span>
          </h1>
          <p className="text-sm text-muted-foreground">Entre na sua conta para continuar</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1.5 bg-card border-border rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm text-foreground">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1.5 bg-card border-border rounded-xl"
            />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 glow-green">
            Entrar
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-6">
          Não tem conta?{' '}
          <Link to="/login" className="text-primary hover:underline">Criar conta grátis</Link>
        </p>
      </div>
    </div>
  );
}
