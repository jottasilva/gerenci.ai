import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import {
  Plus, Search, MoreHorizontal, Check, Clock, Truck, XCircle,
  Package, ShoppingCart, Trash2, Minus, User, CreditCard, Banknote,
  QrCode, AlertTriangle, History, UserCog, Warehouse, Filter, ShoppingBag, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge, PagamentoBadge } from '@/components/shared/StatusBadge';
import { StatusPedido, Pedido, ItemPedido, FormaPagamento, Produto, Cliente } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useGetProducts } from '@/services/product.service';
import { useGetStore } from '@/services/store.service';
import { useGetCustomers, useCreateCustomer } from '@/services/customer.service';
import { useGetOrders, useCreateOrder, useUpdateOrderStatus } from '@/services/order.service';

export default function Pedidos() {
  const { data: products = [], isLoading: isLoadingProducts } = useGetProducts();
  const { data: customers = [], isLoading: isLoadingCustomers } = useGetCustomers();
  const { data: orders = [], isLoading: isLoadingOrders } = useGetOrders();
  const { data: store } = useGetStore();
  const queryClient = useQueryClient();
  const createOrderMutation = useCreateOrder();
  const createCustomerMutation = useCreateCustomer();
  const updateStatusMutation = useUpdateOrderStatus();

  const handleUpdateStatus = async (id: string, status: StatusPedido) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (err) { }
  };

  const [cart, setCart] = useState<ItemPedido[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('TODOS');
  const [statusFilter, setStatusFilter] = useState<StatusPedido | 'TODOS'>('TODOS');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [clienteManual, setClienteManual] = useState('Balcão');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [formaPagto, setFormaPagto] = useState<FormaPagamento>('DINHEIRO');
  const [valorRecebido, setValorRecebido] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'BALCAO' | 'ENTREGA' | 'RETIRADA'>('BALCAO');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);

  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [isClientCreateOpen, setIsClientCreateOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  const [newClient, setNewClient] = useState({
    nome: '',
    whatsapp: '',
    email: '',
    endereco: ''
  });

  const filteredClientes = customers.filter(c =>
    (c.nome ?? '').toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    (c.whatsapp ?? '').includes(clientSearchQuery)
  );

  const categorias = ['TODOS', ...new Set(products.map(p => p.categoria))];

  const filteredProducts = products.filter(p => {
    const matchSearch = (p.nome ?? '').toLowerCase().includes(search.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'TODOS' || p.categoria === catFilter;
    return matchSearch && matchCat && p.ativo;
  });

  const filteredOrders = orders.filter(p => {
    const custName = p.cliente_name || p.cliente_name_manual || 'Desconhecido';
    const matchSearch = custName.toLowerCase().includes(search.toLowerCase()) || p.id.toString().includes(search);
    const matchStatus = statusFilter === 'TODOS' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const addToCart = (product: Produto) => {
    const stockActual = product.estoque ?? product.stock;
    const price = Number(product.price);
    const existing = cart.find(item => item.product === product.id);

    if (existing) {
      if (existing.quantity + 1 > stockActual) {
        toast.error(`Estoque insuficiente! Disponível: ${stockActual}`);
        return;
      }
      setCart(cart.map(item =>
        item.product === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * (item.unit_price || 0) }
          : item
      ));
    } else {
      if (stockActual < 1) {
        toast.error(`Produto sem estoque!`);
        return;
      }
      setCart([...cart, {
        product: product.id,
        product_name: product.nome || product.name,
        quantity: 1,
        unit_price: price,
        subtotal: price
      } as ItemPedido]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    const stockActual = product?.estoque ?? product?.stock ?? 9999;

    setCart(cart.map(item => {
      if (item.product === productId) {
        const newQty = Math.max(1, (item.quantity ?? 1) + delta);
        if (newQty > stockActual) {
          toast.error(`Estoque insuficiente! Disponível: ${stockActual}`);
          return item;
        }
        return { ...item, quantity: newQty, subtotal: newQty * (item.unit_price ?? 0) };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const feeValue = deliveryMethod === 'ENTREGA' ? Number(store?.delivery_fee || 0) : 0;
  const finalTotal = cartTotal + feeValue;

  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      toast.error("O carrinho está vazio!");
      return;
    }
    setIsPaymentOpen(true);
  };

  const handleConfirmPayment = async () => {
    try {
      const orderData = {
        customer: selectedCliente?.id || null,
        customer_name_manual: selectedCliente ? null : clienteManual,
        total: finalTotal,
        discount: 0,
        forma_pagto: formaPagto,
        payment_method: formaPagto,
        status: 'FINALIZADO',
        received_amount: Number(valorRecebido) || finalTotal,
        change_amount: Math.max(0, (Number(valorRecebido) || finalTotal) - finalTotal),
        delivery_method: deliveryMethod,
        delivery_fee: feeValue,
        delivery_address: deliveryMethod === 'ENTREGA' ? deliveryAddress : null,
        items: cart.map(item => ({
          product: item.product,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal
        }))
      };

      await createOrderMutation.mutateAsync(orderData);

      setCart([]);
      setClienteManual('Balcão');
      setSelectedCliente(null);
      setFormaPagto('DINHEIRO');
      setValorRecebido('');
      setDeliveryMethod('BALCAO');
      setDeliveryAddress('');
      setIsPaymentOpen(false);
      setIsCartOpen(false);
    } catch (err) { }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Deseja realmente cancelar este pedido? O estoque será estornado.")) return;
    try {
      await api.post(`orders/${orderId}/cancel/`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsOrderDetailOpen(false);
      toast.success("Pedido cancelado com sucesso!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro ao cancelar pedido.");
    }
  };

  const handleSelectCliente = (c: Cliente) => {
    setSelectedCliente(c);
    setClienteManual(c.nome);
    setIsClientSearchOpen(false);
    toast.success(`Cliente ${c.nome} selecionado`);
  };

  const handleCreateCliente = async () => {
    if (!newClient.nome) {
      toast.error("Nome é obrigatório");
      return;
    }
    try {
      const created = await createCustomerMutation.mutateAsync({ ...newClient, ativo: true } as Omit<Cliente, 'id'>);
      setSelectedCliente(created);
      setClienteManual(created.nome);
      setIsClientCreateOpen(false);
      setNewClient({ nome: '', whatsapp: '', email: '', endereco: '' });
    } catch (err) { }
  };

  if (isLoadingProducts || isLoadingCustomers) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground">Preparando frente de caixa...</p>
      </div>
    );
  }

  const CartContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-border bg-muted/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-foreground text-lg">Carrinho Atual</h3>
            <p className="text-xs text-muted-foreground">{cart.length} itens selecionados</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCart([])} className="h-9 w-9 text-muted-foreground hover:text-destructive rounded-xl">
            <Trash2 className="h-4.5 w-4.5" />
          </Button>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 mb-2">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary/60">Cliente</p>
            <p className="text-sm font-bold text-foreground truncate">{selectedCliente?.nome || 'Cliente Balcão'}</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setIsClientSearchOpen(true)} className="h-8 px-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10">
              Mudar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsClientCreateOpen(true)} className="h-8 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted">
              Novo
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {cart.length > 0 ? (
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.product} className="p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-bold text-sm text-foreground pr-2">{item.product_name}</h5>
                  <span className="font-display font-bold text-sm text-foreground whitespace-nowrap">
                    R$ {parseFloat(item.subtotal.toString()).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-medium">R$ {parseFloat(item.unit_price.toString()).toFixed(2)} / un</span>
                  <div className="flex items-center gap-2 bg-background rounded-lg border border-border p-1">
                    <button
                      onClick={() => updateQuantity(item.product, -1)}
                      className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product, 1)}
                      className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center text-primary"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20 px-8">
            <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <p className="text-sm font-bold">Carrinho Vazio</p>
            <p className="text-xs">Selecione produtos ao lado para iniciar uma venda</p>
          </div>
        )}
      </ScrollArea>

      <div className="p-5 bg-muted/10 border-t border-border space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>R$ {(Number(cartTotal) || 0).toFixed(2).replace('.', ',')}</span>
          </div>
          {deliveryMethod === 'ENTREGA' && (
            <div className="flex justify-between text-sm text-primary font-bold">
              <span>Taxa de Entrega</span>
              <span>R$ {feeValue.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-display font-extrabold text-foreground">
            <span>Total Geral</span>
            <span className="text-primary text-xl">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <Button
          disabled={cart.length === 0 || createOrderMutation.isPending}
          onClick={handleFinalizeSale}
          className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-display font-bold text-lg shadow-lg shadow-primary/20"
        >
          {createOrderMutation.isPending ? 'Processando...' : 'Finalizar Venda'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-2rem)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 flex-shrink-0">
        <PageHeader titulo="PDV de Vendas" subtitulo="Sistema de frente de caixa rápido" />
        <div className="lg:hidden w-full flex gap-2">
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button className="flex-1 h-12 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20">
                <ShoppingBag className="mr-2 h-5 w-5" /> Ver Carrinho ({cart.length})
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-3xl border-none">
              <CartContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="vender" className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <TabsList className="grid w-full sm:w-[300px] grid-cols-2 bg-muted/50 rounded-xl">
              <TabsTrigger value="vender" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ShoppingCart className="h-4 w-4 mr-2" /> Vender
              </TabsTrigger>
              <TabsTrigger value="historico" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <History className="h-4 w-4 mr-2" /> Histórico
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="vender" className="flex-1 h-full m-0 flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <Card className="flex-shrink-0 border-border bg-card shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar produto ou código..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-9 bg-muted/30 border-none transition-all focus-visible:ring-primary/20 rounded-xl"
                    />
                  </div>
                  <ScrollArea className="flex-shrink-0 w-full sm:w-auto">
                    <div className="flex gap-2 pb-2 sm:pb-0">
                      {categorias.map(cat => (
                        <Button
                          key={cat}
                          variant={catFilter === cat ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCatFilter(cat)}
                          className="rounded-xl px-4 text-xs font-bold uppercase tracking-wider"
                        >
                          {cat === 'TODOS' ? 'Todos' : cat}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <ScrollArea className="flex-1 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20 lg:pb-4">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="group flex flex-col items-start p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all text-left relative overflow-hidden"
                    >
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-2 mb-1">{product.nome}</h4>
                      <div className="flex items-center justify-between w-full mb-3">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{product.categoria_name || product.categoria}</p>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${product.estoque <= product.estoque_min
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-primary/10 text-primary'
                          }`}>
                          <Warehouse className="h-3 w-3" />
                          {product.estoque} un
                        </div>
                      </div>
                      <div className="mt-auto w-full flex items-center justify-between">
                        <span className="text-base font-display font-extrabold text-foreground">
                          R$ {parseFloat(product.price.toString()).toFixed(2).replace('.', ',')}
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Plus className="h-4 w-4" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="hidden lg:flex w-[350px] xl:w-[400px] flex-shrink-0 flex-col">
              <Card className="flex-1 border-border bg-card shadow-xl rounded-2xl overflow-hidden flex flex-col">
                <CartContent />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="historico" className="flex-1 m-0 data-[state=active]:block">
            <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar histórico..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-muted/30 border-none rounded-xl"
                  />
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-18rem)]">
                {isLoadingOrders ? (
                  <div className="p-20 flex flex-col items-center justify-center opacity-50">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Carregando histórico...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground bg-muted/10">
                          <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px]"># Pedido</th>
                          <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Cliente</th>
                          <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Total</th>
                          <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Status</th>
                          <th className="w-10 px-6"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((p, i) => (
                          <tr
                            key={p.id}
                            className={`border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-muted/5' : ''}`}
                            onClick={() => {
                              setSelectedOrder(p);
                              setIsOrderDetailOpen(true);
                            }}
                          >
                            <td className="py-4 px-6 font-mono text-xs text-muted-foreground">#{p.id}</td>
                            <td className="py-4 px-6 font-bold text-foreground">
                              {p.cliente_name || p.cliente_name_manual || 'Balcão'}
                            </td>
                            <td className="py-4 px-6 font-display font-extrabold text-foreground">R$ {parseFloat(p.total.toString()).toFixed(2).replace('.', ',')}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                {p.delivery_method === 'BALCAO' && <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />}
                                {p.delivery_method === 'ENTREGA' && <Truck className="h-3.5 w-3.5 text-primary" />}
                                {p.delivery_method === 'RETIRADA' && <ShoppingBag className="h-3.5 w-3.5 text-warning" />}
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">{p.delivery_method || 'BALCAO'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6"><StatusBadge status={p.status} /></td>
                            <td className="py-4 px-6 text-right">
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isClientSearchOpen} onOpenChange={setIsClientSearchOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[70vw] lg:max-w-[60vw] h-[90vh] sm:h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          <DialogHeader className="p-6 sm:p-8 bg-muted/30 border-b border-border">
            <DialogTitle className="text-xl sm:text-2xl font-display font-bold">Selecionar Cliente</DialogTitle>
            <DialogDescription>Pesquise e selecione um cliente da base</DialogDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou WhatsApp..."
                value={clientSearchQuery}
                onChange={e => setClientSearchQuery(e.target.value)}
                className="pl-11 h-12 bg-background border-border rounded-xl focus-visible:ring-primary/20"
              />
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClientes.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCliente(c)}
                  className="flex flex-col p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{c.nome}</h4>
                      <p className="text-xs text-muted-foreground">{c.whatsapp}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isClientCreateOpen} onOpenChange={setIsClientCreateOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[80vw] lg:max-w-[60vw] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>Cadastre um novo cliente rapidamente.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 sm:p-10 bg-primary text-primary-foreground flex flex-col justify-center relative overflow-hidden">
              <h2 className="text-3xl font-display font-bold mb-4">Novo Cliente</h2>
              <p className="text-primary-foreground/70">Cadastre o cliente rapidamente.</p>
            </div>
            <div className="p-8 sm:p-10 bg-card flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4">
                <Input
                  value={newClient.nome}
                  onChange={e => setNewClient({ ...newClient, nome: e.target.value })}
                  className="h-12 rounded-xl bg-muted/30 border-none"
                  placeholder="Nome Completo"
                />
                <Input
                  value={newClient.whatsapp}
                  onChange={e => setNewClient({ ...newClient, whatsapp: e.target.value })}
                  className="h-12 rounded-xl bg-muted/30 border-none"
                  placeholder="WhatsApp"
                />
              </div>
              <Button onClick={handleCreateCliente} className="h-12 rounded-xl font-bold shadow-lg shadow-primary/20">Cadastrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[80vw] lg:max-w-[50vw] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Finalizar Venda</DialogTitle>
            <DialogDescription>Revise e confirme a forma de pagamento.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[90vh]">
            <div className="bg-primary p-8 text-primary-foreground">
              <h2 className="text-2xl font-display font-bold">Finalizar Venda</h2>
              <div className="mt-8 space-y-1">
                <div className="flex justify-between text-xs opacity-70">
                  <span>Itens: R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                  {deliveryMethod === 'ENTREGA' && <span>Entrega: R$ {feeValue.toFixed(2).replace('.', ',')}</span>}
                </div>
                <div className="mt-8 flex justify-between items-end">
                  <span className="text-2xl sm:text-4xl font-display font-extrabold">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6 bg-card">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Forma de Pagamento</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(['DINHEIRO', 'PIX'] as FormaPagamento[]).map(metodo => (
                    <button
                      key={metodo}
                      onClick={() => setFormaPagto(metodo)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${formaPagto === metodo
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/40'
                        }`}
                    >
                      {metodo === 'DINHEIRO' && <Banknote className="h-6 w-6" />}
                      {metodo === 'PIX' && <QrCode className="h-6 w-6" />}
                      <span className="text-[10px] font-bold uppercase tracking-wider">{metodo.replace(/_/g, ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Tipo de Entrega</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BALCAO', 'ENTREGA', 'RETIRADA'] as const).map(metodo => (
                    <button
                      key={metodo}
                      onClick={() => setDeliveryMethod(metodo)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${deliveryMethod === metodo
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/40'
                        }`}
                    >
                      {metodo === 'BALCAO' && <Warehouse className="h-5 w-5" />}
                      {metodo === 'ENTREGA' && <Truck className="h-5 w-5" />}
                      {metodo === 'RETIRADA' && <ShoppingBag className="h-5 w-5" />}
                      <span className="text-[10px] font-bold uppercase tracking-wider">{metodo}</span>
                    </button>
                  ))}
                </div>
              </div>

              {deliveryMethod === 'ENTREGA' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Endereço de Entrega</Label>
                  <Textarea
                    placeholder="Rua, número, bairro e complementos..."
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    className="rounded-xl bg-muted/30 border-none resize-none h-24"
                  />
                </div>
              )}

              {formaPagto === 'DINHEIRO' && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground">Valor Recebido</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={valorRecebido}
                      onChange={e => setValorRecebido(e.target.value)}
                      className="bg-background border-border text-lg font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground">Troco</Label>
                    <div className="h-10 flex items-center px-3 rounded-md bg-background border border-border font-display font-bold text-lg text-primary">
                      R$ {Math.max(0, (Number(valorRecebido) || 0) - finalTotal).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                </div>
              )}

              {formaPagto === 'PIX' && (
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col items-center text-center gap-4">
                  <div className="h-32 w-32 bg-white p-2 rounded-xl flex items-center justify-center border border-border shadow-inner">
                    <QrCode className="h-24 w-24 text-foreground opacity-20" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Aguardando Pagamento PIX</p>
                    <p className="text-xs text-muted-foreground">O QR Code aparecerá aqui após integração</p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleConfirmPayment}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-lg shadow-xl shadow-primary/20"
              >
                Finalizar Venda
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-muted/30 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-display font-bold">Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
                <DialogDescription>
                  {selectedOrder?.created_at && new Date(selectedOrder.created_at).toLocaleString()}
                </DialogDescription>
              </div>
              <StatusBadge status={selectedOrder?.status || 'REALIZADO'} />
            </div>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-bold">{selectedOrder?.cliente_name || selectedOrder?.cliente_name_manual || 'Balcão'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Forma de Pagamento:</span>
                <span className="font-bold">{selectedOrder?.payment_method || selectedOrder?.forma_pagto}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Operador:</span>
                <span className="font-bold">{selectedOrder?.operador_nome || selectedOrder?.operator_name || 'Admin'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Tipo de Entrega:</span>
                <div className="flex items-center gap-2 font-bold">
                  {selectedOrder?.delivery_method === 'BALCAO' && <Warehouse className="h-4 w-4" />}
                  {selectedOrder?.delivery_method === 'ENTREGA' && <Truck className="h-4 w-4" />}
                  {selectedOrder?.delivery_method === 'RETIRADA' && <ShoppingBag className="h-4 w-4" />}
                  {selectedOrder?.delivery_method || 'BALCAO'}
                </div>
              </div>
              {selectedOrder?.delivery_method === 'ENTREGA' && (selectedOrder?.delivery_address || (selectedOrder as any)?.endereco_entrega) && (
                <div className="space-y-1 pt-2 border-t border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Endereço de Entrega:</span>
                  <p className="text-sm bg-muted/30 p-3 rounded-xl border border-border/50 italic">{selectedOrder.delivery_address || (selectedOrder as any)?.endereco_entrega}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Itens do Pedido</p>
              <div className="space-y-2 border border-border rounded-xl p-3 bg-muted/10">
                {(selectedOrder?.items || selectedOrder?.itens || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-none">
                    <span>{item.quantity}x {item.product_name}</span>
                    <span className="font-bold">R$ {parseFloat(item.subtotal.toString()).toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
                {Number(selectedOrder?.delivery_fee || (selectedOrder as any)?.taxa_entrega || 0) > 0 && (
                  <div className="flex justify-between text-sm py-1 font-bold text-primary">
                    <span>Taxa de Entrega</span>
                    <span>R$ {parseFloat((selectedOrder?.delivery_fee || (selectedOrder as any)?.taxa_entrega || 0).toString()).toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-border gap-4">
              <div className="space-y-1 min-w-fit">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-display font-extrabold text-primary">R$ {parseFloat((selectedOrder?.total || 0).toString()).toFixed(2).replace('.', ',')}</p>
              </div>

              <div className="flex-1 max-w-[200px] space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Alterar Status</p>
                <select
                  value={selectedOrder?.status}
                  onChange={(e) => handleUpdateStatus((selectedOrder as any).id, e.target.value as StatusPedido)}
                  disabled={updateStatusMutation.isPending}
                  className="w-full h-10 rounded-xl bg-muted/50 border-none px-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:bg-muted transition-colors"
                >
                  <option value="REALIZADO">Realizado (Inicial)</option>
                  <option value="PREPARANDO">Preparando</option>
                  <option value="ENVIADO">Enviado</option>
                  <option value="FINALIZADO">Finalizado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
