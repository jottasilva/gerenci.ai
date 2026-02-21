import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  Building2, MessageSquare, Banknote, Bell, Save,
  Smartphone, Shield, Globe, Mail, MapPin, Check,
  Settings as SettingsIcon, Database, Zap, SmartphoneNfc,
  Loader2, User as UserIcon, UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// ... rest of imports
import { authService } from '@/services/auth.service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useGetStore, useUpdateStore, StoreSettings } from '@/services/store.service';
import { useGetBillingStatus } from '@/services/billing.service';

export default function Configuracoes() {
  const navigate = useNavigate();
  const { data: store, isLoading: isLoadingStore } = useGetStore();
  const { data: billing } = useGetBillingStatus();
  const updateStore = useUpdateStore();

  const [formData, setFormData] = useState<Partial<StoreSettings>>({});

  const [userFormData, setUserFormData] = useState({
    first_name: '',
    last_name: '',
    whatsapp: '',
    password: '',
  });

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        cnpj: store.cnpj || '',
        email: store.email || '',
        address: store.address || '',
        whatsapp: store.whatsapp || '',
        instagram: store.instagram || '',
        website: store.website || '',
        welcome_message: store.welcome_message || '',
        out_of_hours_message: store.out_of_hours_message || '',
        delivery_fee: store.delivery_fee || '0.00',
        bot_active: store.bot_active ?? true,
      });
    }

    const user = authService.getCurrentUser();
    if (user) {
      setUserFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        whatsapp: user.whatsapp || '',
        password: '',
      });
    }
  }, [store]);

  const handleUserSave = async () => {
    try {
      const dataToSave = { ...userFormData };
      if (!dataToSave.password) delete dataToSave.password;

      await authService.updateProfile(dataToSave);
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil.");
    }
  };

  const handleInputChange = (field: keyof StoreSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateStore.mutate(formData);
  };

  const isLoading = isLoadingStore || updateStore.isPending;

  if (isLoadingStore) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader titulo="Configurações" subtitulo="Gerencie as preferências da sua empresa" />
        <Button
          onClick={handleSave}
          disabled={isLoading || !store}
          className="w-full sm:w-auto rounded-xl font-bold px-6 shadow-lg shadow-primary/20 h-12"
        >
          {updateStore.isPending ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando...</>
          ) : (
            <><Save className="mr-2 h-5 w-5" /> Salvar Alterações</>
          )}
        </Button>
      </div>

      <Tabs defaultValue="empresa" className="w-full">
        <ScrollArea className="w-full whitespace-nowrap mb-6">
          <TabsList className="inline-flex w-auto min-w-full md:min-w-0 md:w-auto h-auto p-1 bg-muted/50 rounded-2xl">
            <TabsTrigger value="empresa" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Building2 className="h-4 w-4 mr-2" /> Empresa
            </TabsTrigger>
            <TabsTrigger value="perfil" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <UserCircle className="h-4 w-4 mr-2" /> Minha Conta
            </TabsTrigger>
            <TabsTrigger value="bot" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <MessageSquare className="h-4 w-4 mr-2" /> Bot & Zap
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Banknote className="h-4 w-4 mr-2" /> Financeiro
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="rounded-xl py-2.5 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Bell className="h-4 w-4 mr-2" /> Alertas
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="flex-1">
          {/* Empresa Tab */}
          <TabsContent value="empresa" className="m-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/10">
                    <CardTitle className="text-lg">Perfil da Empresa</CardTitle>
                    <CardDescription>Informações básicas que aparecem nos orçamentos e pedidos</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome Fantasia</Label>
                        <Input
                          value={formData.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="rounded-xl bg-muted/30 border-none h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CNPJ / CPF</Label>
                        <Input
                          value={formData.cnpj || ''}
                          onChange={(e) => handleInputChange('cnpj', e.target.value)}
                          className="rounded-xl bg-muted/30 border-none h-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail de Contato</Label>
                      <Input
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="rounded-xl bg-muted/30 border-none h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Endereço Completo</Label>
                      <Textarea
                        value={formData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="rounded-xl bg-muted/30 border-none resize-none h-24"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/10">
                    <CardTitle className="text-lg">Redes Sociais & Links</CardTitle>
                    <CardDescription>Links que o bot enviará para seus clientes</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Instagram (User)</Label>
                        <Input
                          placeholder="@zappdv_br"
                          value={formData.instagram || ''}
                          onChange={(e) => handleInputChange('instagram', e.target.value)}
                          className="rounded-xl bg-muted/30 border-none h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Site / Catálogo</Label>
                        <Input
                          placeholder="https://loja.com"
                          value={formData.website || ''}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className="rounded-xl bg-muted/30 border-none h-11"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-border rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/10">
                    <CardTitle className="text-lg text-center">Logo da Loja</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center">
                    <input
                      type="file"
                      id="logo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('logo', file);
                          try {
                            await updateStore.mutateAsync(formData as any);
                            toast.success("Logo atualizada!");
                          } catch (err: any) {
                            console.error(err);
                            const msg = err.response?.data ? JSON.stringify(err.response.data) : "Erro ao carregar logo.";
                            toast.error(msg);
                          }
                        }
                      }}
                    />
                    <div
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      className="h-32 w-32 rounded-3xl bg-primary/10 border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2 mb-4 hover:bg-primary/5 transition-all cursor-pointer group"
                    >
                      {store?.logo ? (
                        <img src={store.logo} className="h-full w-full object-cover rounded-3xl" />
                      ) : (
                        <>
                          <Building2 className="h-8 w-8 text-primary/40 group-hover:text-primary transition-colors" />
                          <span className="text-[10px] font-bold text-primary/60 uppercase group-hover:text-primary transition-colors">Adicionar Logo</span>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground">Recomendado: 512x512px. Formatos PNG ou JPG.</p>
                  </CardContent>
                </Card>

                <Card className="border-border rounded-2xl shadow-sm overflow-hidden border-primary/20">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg flex items-center gap-2 text-primary font-display font-bold">
                      <Zap className="h-5 w-5 fill-primary/20" /> Plano Atual
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold">
                        {billing?.subscription?.plan?.name || 'Carregando...'}
                      </span>
                      <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {billing?.subscription?.status || 'Ativo'}
                      </span>
                    </div>
                    {billing?.subscription?.trial_end && (
                      <p className="text-xs text-muted-foreground mb-4">
                        Seu período de teste termina em {new Date(billing.subscription.trial_end).toLocaleDateString()}.
                      </p>
                    )}
                    <Button variant="outline" onClick={() => navigate('/assinaturas')} className="w-full rounded-xl text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5 h-10">Gerenciar Assinatura</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Perfil Tab */}
          <TabsContent value="perfil" className="m-0 focus-visible:outline-none">
            <div className="max-w-2xl mx-auto lg:mx-0">
              <Card className="border-border rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10">
                  <CardTitle className="text-lg">Meus Dados</CardTitle>
                  <CardDescription>Gerencie suas informações de acesso e perfil</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primeiro Nome</Label>
                      <Input
                        value={userFormData.first_name}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        className="rounded-xl bg-muted/30 border-none h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sobrenome</Label>
                      <Input
                        value={userFormData.last_name}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        className="rounded-xl bg-muted/30 border-none h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp (Login)</Label>
                    <Input
                      value={userFormData.whatsapp}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                      className="rounded-xl bg-muted/30 border-none h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Novo PIN (Deixe em branco para não alterar)</Label>
                    <Input
                      type="password"
                      placeholder="****"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="rounded-xl bg-muted/30 border-none h-11"
                    />
                  </div>

                  <Button
                    onClick={handleUserSave}
                    className="w-full sm:w-auto rounded-xl font-bold px-8 h-12 shadow-lg shadow-primary/10 mt-4"
                  >
                    Salvar Dados de Perfil
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bot & WhatsApp Tab */}
          <TabsContent value="bot" className="m-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Conexão WhatsApp</CardTitle>
                      <CardDescription>Status da conexão com o número do bot</CardDescription>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                      <Check className="h-3 w-3" /> CONECTADO
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Smartphone className="h-6 w-6" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-sm font-bold">{formData.whatsapp || '(Não definido)'}</p>
                      <p className="text-xs text-muted-foreground">Bot Ativo e pronto para pedidos</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Automação Ativa</Label>
                        <p className="text-[10px] text-muted-foreground">O bot responderá mensagens automaticamente</p>
                      </div>
                      <Switch
                        checked={formData.bot_active}
                        onCheckedChange={(val) => handleInputChange('bot_active', val)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                      <div className="space-y-0.5">
                        <Label>IA de Comandos Naturais</Label>
                        <p className="text-[10px] text-muted-foreground font-bold text-primary">RECURSO PRO (EM BREVE)</p>
                      </div>
                      <Switch disabled />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10">
                  <CardTitle className="text-lg">Mensagens Automáticas</CardTitle>
                  <CardDescription>Customize o que o bot diz aos clientes</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Mensagem de Boas-vindas</Label>
                    <Textarea
                      value={formData.welcome_message || ''}
                      onChange={(e) => handleInputChange('welcome_message', e.target.value)}
                      className="rounded-xl bg-muted/30 border-none resize-none h-28"
                    />
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Use *texto* para negrito e _texto_ para itálico.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Resposta Fora de Horário</Label>
                    <Textarea
                      value={formData.out_of_hours_message || ''}
                      onChange={(e) => handleInputChange('out_of_hours_message', e.target.value)}
                      placeholder="No momento estamos fechados..."
                      className="rounded-xl bg-muted/30 border-none resize-none h-28"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financeiro Tab */}
          <TabsContent value="financeiro" className="m-0 focus-visible:outline-none">
            <Card className="border-border rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/10">
                <CardTitle className="text-lg">Configurações de Venda</CardTitle>
                <CardDescription>Defina taxas, moedas e comportamentos do PDV</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Taxa Fixa de Entrega</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</span>
                          <Input
                            value={formData.delivery_fee || ''}
                            onChange={(e) => handleInputChange('delivery_fee', e.target.value)}
                            className="pl-9 rounded-xl bg-muted/30 border-none h-11"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Moeda</Label>
                        <Select defaultValue="BRL">
                          <SelectTrigger className="rounded-xl bg-muted/30 border-none h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border">
                            <SelectItem value="BRL">Real (R$)</SelectItem>
                            <SelectItem value="USD">Dólar ($)</SelectItem>
                            <SelectItem value="EUR">Euro (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between opacity-50">
                        <div className="space-y-0.5">
                          <Label>Permitir Venda sem Estoque</Label>
                          <p className="text-[10px] text-muted-foreground">Recurso disponível em breve</p>
                        </div>
                        <Switch disabled />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between opacity-50">
                        <div className="space-y-0.5">
                          <Label>Imprimir Cupom Automaticamente</Label>
                          <p className="text-[10px] text-muted-foreground">Recurso disponível em breve</p>
                        </div>
                        <Switch disabled />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-6 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col justify-center">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                      <Shield className="h-4 w-4" /> Regras de Controle de Débito
                    </CardTitle>
                    <div className="space-y-4">
                      <div className="space-y-2 opacity-50">
                        <Label className="text-xs">Limite Máximo de Débito por Cliente</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</span>
                          <Input defaultValue="500,00" disabled className="pl-9 rounded-xl bg-background border-border h-11" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between opacity-50">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold">Bloquear Inadimplentes</Label>
                          <p className="text-[10px] text-muted-foreground">Não permite novas vendas se houver contas vencidas</p>
                        </div>
                        <Switch disabled />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações Tab */}
          <TabsContent value="notificacoes" className="m-0 focus-visible:outline-none">
            <div className="max-w-2xl mx-auto lg:mx-0">
              <Card className="border-border rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10">
                  <CardTitle className="text-lg font-display font-bold">Central de Alertas</CardTitle>
                  <CardDescription>Escolha como e quando você quer ser notificado</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="space-y-4 opacity-50">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                      <Database className="h-3 w-3" /> Inventário (BREVE)
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 pr-4">
                        <Label className="font-bold">Destaque de Estoque Baixo</Label>
                        <p className="text-[10px] text-muted-foreground">Notificar quando atingir estoque mínimo</p>
                      </div>
                      <Switch disabled />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 pr-4">
                        <Label className="font-bold">Relatório de Reposição Semanal</Label>
                        <p className="text-[10px] text-muted-foreground">Enviar às segundas 08:00 no WhatsApp admin</p>
                      </div>
                      <Switch disabled />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                      <Globe className="h-3 w-3" /> Administrativo
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 pr-4">
                        <Label className="font-bold">Resumo de Fechamento de Caixa</Label>
                        <p className="text-[10px] text-muted-foreground">Enviar faturamento do dia para o proprietário</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 pr-4">
                        <Label className="font-bold">Alerta de Login em Novo Dispositivo</Label>
                        <p className="text-[10px] text-muted-foreground">Segurança para sua conta administrativa</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
