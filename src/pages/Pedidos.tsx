import { useState, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import {
  Plus, Search, MoreHorizontal, Check, Clock, Truck, XCircle,
  Package, ShoppingCart, Trash2, Minus, User, CreditCard, Banknote,
  QrCode, AlertTriangle, History, UserCog, Warehouse, Filter, ShoppingBag, Loader2, Calendar,
  Mail, MapPin, Download, Share2, ChevronLeft, ChevronRight, Receipt, Tag, ArrowUp, ArrowDown
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi
} from "@/components/ui/carousel";

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
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro ao atualizar status.");
    }
  };

  const [cart, setCart] = useState<ItemPedido[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('TODOS');
  const [pdvPage, setPdvPage] = useState(1);
  const PDV_PER_PAGE = 12; // 3 rows × 4 cols
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
  const [lastCreatedOrder, setLastCreatedOrder] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const [newClient, setNewClient] = useState({
    nome: '',
    whatsapp: '',
    email: '',
    endereco: ''
  });

  const [cartApi, setCartApi] = useState<CarouselApi>();
  const [pdvApi, setPdvApi] = useState<CarouselApi>();

  const filteredClientes = useMemo(() => customers.filter(c =>
    (c.nome ?? '').toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    (c.whatsapp ?? '').includes(clientSearchQuery)
  ), [customers, clientSearchQuery]);

  // Only categories that have at least 1 active product
  const activeProducts = useMemo(() => products.filter(p => p.ativo), [products]);
  const categorias = useMemo(() => ['TODOS', ...new Set(activeProducts.map(p => p.categoria).filter(Boolean))], [activeProducts]);

  const filteredProducts = useMemo(() => activeProducts.filter(p => {
    const matchSearch = (p.nome ?? '').toLowerCase().includes(search.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'TODOS' || p.categoria === catFilter;
    return matchSearch && matchCat;
  }), [activeProducts, search, catFilter]);

  const pdvTotalPages = Math.max(1, Math.ceil(filteredProducts.length / PDV_PER_PAGE));
  const pdvSlides = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < filteredProducts.length; i += PDV_PER_PAGE) {
      chunks.push(filteredProducts.slice(i, i + PDV_PER_PAGE));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [filteredProducts, PDV_PER_PAGE]);

  const handlePdvCatFilter = (cat: string) => { setCatFilter(cat); setPdvPage(1); };
  const handlePdvSearch = (v: string) => { setSearch(v); setPdvPage(1); };

  const filteredOrders = useMemo(() => orders.filter(p => {
    const custName = p.cliente_name || p.cliente_name_manual || 'Desconhecido';
    const matchSearch = custName.toLowerCase().includes(search.toLowerCase()) || p.id.toString().includes(search);
    const matchStatus = statusFilter === 'TODOS' || p.status === statusFilter;
    return matchSearch && matchStatus;
  }), [orders, search, statusFilter]);

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

      const createdOrder = await createOrderMutation.mutateAsync(orderData);

      // Save created order for receipt
      setLastCreatedOrder({
        ...orderData,
        id: createdOrder?.id || Date.now(),
        created_at: new Date().toISOString(),
        operator_name: 'Admin'
      });

      setCart([]);
      setClienteManual('Balcão');
      setSelectedCliente(null);
      setFormaPagto('DINHEIRO');
      setValorRecebido('');
      setDeliveryMethod('BALCAO');
      setDeliveryAddress('');
      setIsPaymentOpen(false);
      setIsCartOpen(false);

      // Show receipt dialog
      setIsReceiptOpen(true);
    } catch (err: any) {
      console.error("Order creation failed:", err);
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || "Erro ao realizar pedido. Verifique os dados.";
      toast.error(errorMsg);
    }
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

  // Remove direct state hook here to put at top

  // The CartContent is now inlined in the return part below
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

    <div className="flex-1 overflow-hidden relative group px-4 py-2">
      {cart.length > 0 ? (
        <Carousel
          orientation="vertical"
          opts={{ align: "start" }}
          setApi={setCartApi}
          className="w-full h-full max-h-[50vh]"
        >
          <CarouselContent className="-mt-1 h-[45vh]">
            {cart.map(item => (
              <CarouselItem key={item.product} className="pt-1 md:basis-1/4 lg:basis-1/5">
                <div className="p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-sm text-foreground pr-2 truncate">{item.product_name}</h5>
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
              </CarouselItem>
            ))}
          </CarouselContent>

          {cart.length > 4 && (
            <>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 rounded-full shadow-lg border border-border bg-background/80 backdrop-blur-sm"
                  onClick={() => cartApi?.scrollPrev()}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 rounded-full shadow-lg border border-border bg-background/80 backdrop-blur-sm"
                  onClick={() => cartApi?.scrollNext()}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </Carousel>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10 px-8">
          <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <p className="text-sm font-bold">Carrinho Vazio</p>
          <p className="text-xs">Selecione produtos ao lado para iniciar uma venda</p>
        </div>
      )}
    </div>

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
  // CartContent definition ended here, now we will inline it

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

                <div className="flex-1 overflow-hidden relative group px-4 py-2">
                  {cart.length > 0 ? (
                    <Carousel
                      orientation="vertical"
                      opts={{ align: "start" }}
                      setApi={setCartApi}
                      className="w-full h-full max-h-[50vh]"
                    >
                      <CarouselContent className="-mt-1 h-[45vh]">
                        {cart.map(item => (
                          <CarouselItem key={item.product} className="pt-1 md:basis-1/4 lg:basis-1/5">
                            <div className="p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-bold text-sm text-foreground pr-2 truncate">{item.product_name}</h5>
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
                          </CarouselItem>
                        ))}
                      </CarouselContent>

                      {cart.length > 4 && (
                        <>
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7 rounded-full shadow-lg border border-border bg-background/80 backdrop-blur-sm"
                              onClick={() => cartApi?.scrollPrev()}
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7 rounded-full shadow-lg border border-border bg-background/80 backdrop-blur-sm"
                              onClick={() => cartApi?.scrollNext()}
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </Carousel>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10 px-8">
                      <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
                        <ShoppingCart className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-bold">Carrinho Vazio</p>
                      <p className="text-xs">Selecione produtos ao lado para iniciar uma venda</p>
                    </div>
                  )}
                </div>

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
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    {/* Search LEFT */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar produto ou código..."
                        value={search}
                        onChange={e => handlePdvSearch(e.target.value)}
                        className="pl-9 bg-muted/30 border-none transition-all focus-visible:ring-primary/20 rounded-xl"
                      />
                    </div>
                    {/* Scroll to start button */}
                    {filteredProducts.length > PDV_PER_PAGE && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                        onClick={() => pdvApi?.scrollTo(0)}
                        title="Voltar ao início"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {/* Categories BELOW search */}
                  <ScrollArea className="w-full">
                    <div className="flex gap-2 pb-1">
                      {categorias.map(cat => (
                        <Button
                          key={cat}
                          variant={catFilter === cat ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePdvCatFilter(cat)}
                          className="rounded-xl px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                        >
                          {cat === 'TODOS' ? 'Todos' : cat}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="flex-1 relative group">
                {filteredProducts.length > 0 ? (
                  <Carousel
                    setApi={setPdvApi}
                    opts={{ align: "start", loop: false }}
                    className="w-full"
                  >
                    <CarouselContent>
                      {pdvSlides.map((slide, slideIndex) => (
                        <CarouselItem key={slideIndex}>
                          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-4 px-1">
                            {slide.map(product => (
                              <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="group flex flex-col items-start p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all text-left relative overflow-hidden h-full"
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
                        </CarouselItem>
                      ))}
                    </CarouselContent>

                    {filteredProducts.length > PDV_PER_PAGE && (
                      <div className="flex items-center justify-between mt-2 px-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                          Página de Produtos
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-primary/10 hover:bg-primary/5 hover:text-primary transition-all"
                            onClick={() => pdvApi?.scrollTo(0)}
                            title="Voltar ao início"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <CarouselPrevious className="static translate-y-0 h-9 w-9 rounded-xl border-primary/10 hover:bg-primary/5 hover:text-primary transition-all" />
                          <CarouselNext className="static translate-y-0 h-9 w-9 rounded-xl border-primary/10 hover:bg-primary/5 hover:text-primary transition-all" />
                        </div>
                      </div>
                    )}
                  </Carousel>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 opacity-20">
                    <Package className="h-12 w-12 mb-4" />
                    <p className="font-bold">Nenhum produto encontrado</p>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden lg:flex w-[350px] xl:w-[400px] flex-shrink-0 flex-col">
              <Card className="flex-1 border-border bg-card shadow-xl rounded-2xl overflow-hidden flex flex-col">
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="p-5 border-b border-border bg-muted/10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-display font-bold text-foreground text-lg text-primary">Carrinho Atual</h3>
                        <p className="text-xs text-muted-foreground">{cart.length} itens selecionados</p>
                      </div>
                      <div className="flex gap-1">
                        {cart.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => cartApi?.scrollTo(0)}
                            className="h-9 w-9 text-muted-foreground hover:text-primary rounded-xl"
                            title="Voltar ao início"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setCart([])} className="h-9 w-9 text-muted-foreground hover:text-destructive rounded-xl">
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </div>
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

                  <div className="flex-1 overflow-hidden relative group px-4 py-2">
                    {cart.length > 0 ? (
                      <Carousel
                        orientation="vertical"
                        opts={{ align: "start" }}
                        setApi={setCartApi}
                        className="w-full max-h-[80vh]"
                      >
                        <CarouselContent className="-mt-1 h-[45vh]">
                          {cart.map(item => (
                            <CarouselItem key={item.product} className="pt-1 md:basis-1/4 lg:basis-1/5">
                              <div className="p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="font-bold text-sm text-foreground pr-2 truncate">{item.product_name}</h5>
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
                            </CarouselItem>
                          ))}
                        </CarouselContent>

                        {cart.length > 4 && (
                          <>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-7 w-7 rounded-full shadow-lg border border-border bg-background/80 backdrop-blur-sm"
                                onClick={() => cartApi?.scrollPrev()}
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-7 w-7 rounded-full shadow-lg border border-border bg-background/80 backdrop-blur-sm"
                                onClick={() => cartApi?.scrollNext()}
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </>
                        )}
                      </Carousel>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10 px-8">
                        <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
                          <ShoppingCart className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-bold">Carrinho Vazio</p>
                        <p className="text-xs">Selecione produtos ao lado para iniciar uma venda</p>
                      </div>
                    )}
                  </div>

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
                          <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Identificação</th>
                          <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Cliente / Vendedor</th>
                          <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Valores / Entrega</th>
                          <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Status / Itens</th>
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
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-mono text-xs text-muted-foreground font-bold">#{p.id}</span>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                                  <Calendar className="h-2.5 w-2.5" />
                                  <span>{p.created_at ? new Date(p.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-foreground truncate max-w-[150px]">
                                  {p.cliente_name || p.cliente_name_manual || 'Balcão'}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <UserCog className="h-2.5 w-2.5" />
                                  <span className="truncate max-w-[120px]">Vendedor: {p.operador_nome || 'Admin'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-display font-extrabold text-foreground whitespace-nowrap">
                                  R$ {parseFloat(p.total.toString()).toFixed(2).replace('.', ',')}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {p.delivery_method === 'BALCAO' && <Warehouse className="h-3 w-3 text-muted-foreground" />}
                                  {p.delivery_method === 'ENTREGA' && <Truck className="h-3 w-3 text-primary" />}
                                  {p.delivery_method === 'RETIRADA' && <ShoppingBag className="h-3 w-3 text-warning" />}
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground">{p.delivery_method || 'BALCAO'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-start">
                                  <StatusBadge status={p.status} />
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground">
                                  {p.items?.length || 0} {(p.items?.length || 0) === 1 ? 'item' : 'itens'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
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
            <div className="grid grid-cols-1 gap-3">
              {filteredClientes.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCliente(c)}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <h4 className="font-bold text-foreground truncate">{c.nome}</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[10px] bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground font-bold">
                          <QrCode className="h-2.5 w-2.5" />
                          {c.whatsapp}
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1 text-[10px] bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground truncate max-w-[120px]">
                            <Mail className="h-2.5 w-2.5" />
                            {c.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {c.endereco && (
                    <div className="hidden lg:flex flex-1 items-start gap-2 text-[10px] text-muted-foreground italic border-l border-border pl-4 max-w-[200px]">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{c.endereco}</span>
                    </div>
                  )}

                  <div className="flex flex-col items-end sm:border-l border-border sm:pl-4 min-w-fit">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Compras</span>
                    <span className="text-base font-display font-extrabold text-primary">
                      R$ {parseFloat(c.total_compras?.toString() || '0').toFixed(2).replace('.', ',')}
                    </span>
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
          <ScrollArea className="max-h-[80vh]">
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
        <DialogContent className="w-[95vw] sm:max-w-[420px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>Recibo do pedido.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[85vh]">
            {/* Receipt / Nota — Premium Design */}
            <div id="receipt-box" className="bg-[#fdfdfd] text-gray-900 relative overflow-hidden font-sans">

              {/* Subtle Noise/Grain Effect Overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

              {/* Watermark "PAGO" */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none select-none opacity-[0.03]">
                <span className="text-[120px] font-black border-8 border-emerald-600 text-emerald-600 px-8 py-2 rounded-3xl">PAGO</span>
              </div>

              {/* Header with Glassmorphism / Modern Gradient */}
              <div className="relative bg-gradient-to-br from-[#059669] via-[#047857] to-[#064e3b] px-10 pt-10 pb-12 text-white text-center">
                {/* Visual elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-[60px]" />
                  <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-emerald-400 blur-[40px]" />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  {store?.logo ? (
                    <img src={store.logo} className="h-16 w-16 rounded-2xl object-cover mx-auto mb-4 ring-4 ring-white/10 shadow-2xl" alt="Logo" />
                  ) : (
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md mb-4 ring-2 ring-white/10 shadow-2xl">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <h2 className="text-2xl font-black tracking-tight leading-none mb-2 uppercase">{store?.name || 'Gerenc.AI'}</h2>
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    <p className="text-[9px] text-white uppercase font-black tracking-[0.2em]">Comprovante Oficial</p>
                  </div>
                </div>

                {/* Serated top edge for the content area */}
                <div className="absolute -bottom-0.5 left-0 right-0 h-4 flex overflow-hidden">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className="flex-1 h-full bg-[#fdfdfd]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                  ))}
                </div>
              </div>

              <div className="px-6 pb-8 pt-10">
                {/* Main Order Info Chip */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Identificador</p>
                    <h3 className="text-3xl font-black text-gray-900 leading-none flex items-baseline gap-1">
                      <span className="text-gray-300 font-light text-xl">#</span>
                      {selectedOrder?.id}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Emitido em</p>
                    <div className="bg-gray-100/80 px-3 py-1.5 rounded-xl border border-gray-200/50">
                      <p className="font-mono text-gray-700 text-[11px] font-bold">
                        {selectedOrder?.created_at && new Date(selectedOrder.created_at).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Dashboard Style */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[
                    { label: 'Cliente', value: selectedOrder?.cliente_name || selectedOrder?.cliente_name_manual || 'Consumidor Final', icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Operador', value: selectedOrder?.operador_nome || selectedOrder?.operator_name || 'Admin Principal', icon: UserCog, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                    {
                      label: 'Pagamento',
                      value: selectedOrder?.payment_method || selectedOrder?.forma_pagto,
                      icon: (selectedOrder?.payment_method || selectedOrder?.forma_pagto) === 'PIX' ? QrCode : Banknote,
                      color: 'text-amber-500', bg: 'bg-amber-50'
                    },
                    {
                      label: 'Método',
                      value: selectedOrder?.delivery_method || 'BALCÃO',
                      icon: selectedOrder?.delivery_method === 'ENTREGA' ? Truck : selectedOrder?.delivery_method === 'RETIRADA' ? ShoppingBag : Warehouse,
                      color: 'text-emerald-500', bg: 'bg-emerald-50'
                    }
                  ].map((inf, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`h-6 w-6 rounded-lg ${inf.bg} flex items-center justify-center`}>
                          <inf.icon className={`h-3 w-3 ${inf.color}`} />
                        </div>
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{inf.label}</span>
                      </div>
                      <p className="font-black text-gray-900 text-[11px] truncate uppercase">{inf.value}</p>
                    </div>
                  ))}
                </div>

                {selectedOrder?.delivery_method === 'ENTREGA' && (selectedOrder?.delivery_address || (selectedOrder as any)?.endereco_entrega) && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 mb-8 flex items-start gap-3 shadow-inner">
                    <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-emerald-100">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mb-1">Destino da Entrega</p>
                      <p className="text-[11px] font-bold text-gray-700 leading-snug truncate">{selectedOrder.delivery_address || (selectedOrder as any)?.endereco_entrega}</p>
                    </div>
                  </div>
                )}

                {/* Items Section */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Resumo dos Itens</h4>
                    <span className="text-[10px] text-gray-400 font-bold">{(selectedOrder?.items || selectedOrder?.itens || []).length} posições</span>
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] overflow-hidden">
                    {(selectedOrder?.items || selectedOrder?.itens || []).map((item: any, idx: number) => (
                      <div key={idx} className={`group flex items-center gap-4 p-4 ${idx !== 0 ? 'border-t border-gray-50' : ''}`}>
                        <div className="h-10 w-10 flex flex-col items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                          <span className="text-[14px] font-black text-gray-900 group-hover:text-emerald-700">{item.quantity}</span>
                          <span className="text-[8px] text-gray-400 font-black uppercase tracking-tighter -mt-1">un</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-black text-gray-900 leading-tight mb-0.5 truncate uppercase">{item.product_name}</p>
                          <p className="text-[10px] text-gray-400 font-mono font-medium">R$ {parseFloat(item.unit_price?.toString() || '0').toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[13px] font-black text-gray-900 font-mono">
                            R$ {parseFloat(item.subtotal.toString()).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="relative mt-12 mb-8">
                  {/* Perforated separator */}
                  <div className="absolute -top-6 left-0 right-0 flex gap-2 justify-between px-2 opacity-20 overflow-hidden">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="h-1 w-1 rounded-full bg-gray-400" />
                    ))}
                  </div>

                  <div className="bg-[#047857] rounded-3xl p-6 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[120%] bg-white/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="space-y-3 relative z-10">
                      <div className="flex justify-between items-center text-emerald-100/80">
                        <span className="text-[10px] font-black uppercase tracking-widest">Subtotal Bruto</span>
                        <span className="text-[12px] font-mono font-bold italic">R$ {parseFloat((selectedOrder?.total || 0).toString()).toFixed(2).replace('.', ',')}</span>
                      </div>

                      {Number(selectedOrder?.delivery_fee || (selectedOrder as any)?.taxa_entrega || 0) > 0 && (
                        <div className="flex justify-between items-center text-emerald-100/80">
                          <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 align-middle">
                            <Truck className="h-2.5 w-2.5" /> Entrega
                          </span>
                          <span className="text-[12px] font-mono font-bold">+ R$ {parseFloat((selectedOrder?.delivery_fee || (selectedOrder as any)?.taxa_entrega || 0).toString()).toFixed(2).replace('.', ',')}</span>
                        </div>
                      )}

                      <div className="h-px bg-white/10 my-2" />

                      <div className="flex justify-between items-end">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] mb-1">Total Geral</span>
                        <span className="text-3xl font-black font-mono tracking-tighter">
                          R$ {parseFloat((selectedOrder?.total || 0).toString()).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Message */}
                <div className="text-center py-4 border-t border-gray-100 mt-4">
                  <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-1 italic">Obrigado pela preferência!</p>
                  <p className="text-[9px] text-gray-400 font-medium">Volte sempre a {store?.name || 'Gerenc.AI'}</p>
                </div>

                {/* Decorative Bottom */}
                <div className="flex justify-center gap-1.5 mt-4 opacity-10">
                  <div className="h-1 w-12 rounded-full bg-gray-400" />
                  <div className="h-1 w-4 rounded-full bg-gray-400" />
                  <div className="h-1 w-2 rounded-full bg-gray-400" />
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 bg-card border-t border-border flex flex-col sm:flex-row gap-3">
            {/* Status change */}
            <div className="flex-1 flex items-center gap-2">
              <StatusBadge status={selectedOrder?.status || 'REALIZADO'} />
              <select
                value={selectedOrder?.status}
                onChange={(e) => handleUpdateStatus((selectedOrder as any).id, e.target.value as StatusPedido)}
                disabled={updateStatusMutation.isPending}
                className="flex-1 h-10 rounded-xl bg-muted/50 border-none px-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:bg-muted transition-colors"
              >
                <option value="REALIZADO">Realizado</option>
                <option value="PREPARANDO">Preparando</option>
                <option value="ENVIADO">Enviado</option>
                <option value="FINALIZADO">Finalizado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            {/* Share as JPG */}
            <Button
              variant="outline"
              className="h-10 rounded-xl font-bold gap-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
              onClick={async () => {
                const el = document.getElementById('receipt-box');
                if (!el) return;
                try {
                  const dataUrl = await htmlToImage.toJpeg(el, {
                    quality: 1,
                    backgroundColor: '#ffffff',
                    width: 640,
                    height: 980,
                    style: {
                      width: '640px',
                      height: '980px',
                      transform: 'scale(1)',
                      margin: '0',
                      padding: '10px'
                    }
                  });
                  const link = document.createElement('a');
                  link.download = `pedido-${selectedOrder?.id}.jpg`;
                  link.href = dataUrl;
                  link.click();
                  toast.success('📄 Recibo exportado (640x980px)!');
                } catch (err) {
                  console.error(err);
                }
              }}
            >
              <Share2 className="h-4 w-4" /> Compartilhar JPG
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post-finalize Receipt Dialog — Premium */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[720px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl flex flex-col bg-background max-h-[95vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>Recibo Digital</DialogTitle>
            <DialogDescription>Recibo do pedido finalizado em 640x980.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto bg-muted/20 p-4 sm:p-8 flex justify-center items-start min-h-0" style={{ maxHeight: '80vh' }}>
            {/* Wrapper with scale for preview if screen is small */}
            <div className="origin-top scale-[0.5] sm:scale-[0.75] transition-transform duration-300">
              <div
                id="finalize-receipt"
                className="bg-[#fdfdfd] text-gray-900 shadow-2xl flex flex-col relative font-sans"
                style={{
                  width: '640px',
                  minHeight: '100px', // Allow content to determine height
                  minWidth: '640px',
                }}
              >
                {/* Subtle Noise/Grain Effect Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

                {/* Watermark "PAGO" */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none select-none opacity-[0.03]">
                  <span className="text-[180px] font-black border-[12px] border-emerald-600 text-emerald-600 px-12 py-4 rounded-[4rem]">PAGO</span>
                </div>

                {/* Success + Store Header */}
                <div className="relative bg-gradient-to-br from-[#059669] via-[#047857] to-[#064e3b] px-12 pt-12 pb-10 text-white text-center overflow-hidden flex flex-col items-center justify-center flex-shrink-0">
                  <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-[60px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-emerald-400 blur-[40px]" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center w-full">
                    <h2 className="text-4xl font-black tracking-tighter uppercase mb-6">{store?.name || 'GERENC.AI'}</h2>

                    <div className="w-full flex justify-between items-end border-t border-white/20 pt-6 mt-2">
                      <div className="text-left">
                        <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em] mb-1">Recibo Digital</p>
                        <h3 className="text-4xl font-black text-white leading-none">
                          <span className="text-white/40 font-light text-2xl">#</span>
                          {lastCreatedOrder?.id}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em] mb-1">Data e Hora</p>
                        <p className="font-black text-white text-sm">
                          {lastCreatedOrder?.created_at && new Date(lastCreatedOrder.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Serated top edge for the content area */}
                  <div className="absolute -bottom-0.5 left-0 right-0 h-6 flex overflow-hidden">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="flex-1 h-full bg-[#fdfdfd]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                    ))}
                  </div>
                </div>

                {/* White Body - Content Area */}
                <div className="px-12 pt-10 pb-12 flex-1 flex flex-col">
                  {/* Items List */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-6 px-1">
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.25em]">Detalhamento</h4>
                      <span className="text-xs text-gray-400 font-bold">{(lastCreatedOrder?.items || []).length} itens</span>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] overflow-hidden">
                      {(lastCreatedOrder?.items || []).map((item: any, idx: number) => (
                        <div key={idx} className={`flex items-center gap-6 p-6 ${idx !== 0 ? 'border-t border-gray-50' : ''}`}>
                          <div className="h-12 w-12 flex flex-col items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">
                            <span className="text-lg font-black text-gray-900">{item.quantity}</span>
                            <span className="text-[8px] text-gray-400 font-black uppercase tracking-tighter -mt-1">un</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-black text-gray-900 leading-tight mb-0.5 uppercase">{item.product_name}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[15px] font-black text-gray-900 font-mono whitespace-nowrap">
                              R$ {parseFloat(item.subtotal.toString()).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mt-12 mb-4 relative">
                    {/* Perforated separator */}
                    <div className="absolute -top-8 left-0 right-0 flex gap-3 justify-between px-4 opacity-20 overflow-hidden">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      ))}
                    </div>

                    <div className="bg-[#047857] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-emerald-900/40 relative overflow-hidden">
                      <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[120%] bg-white/5 rounded-full blur-3xl pointer-events-none" />

                      <div className="space-y-4 relative z-10">
                        <div className="h-px bg-white/10 my-4" />

                        <div className="flex justify-between items-end">
                          <span className="text-xs font-black uppercase tracking-[0.4em] mb-2">Total Consolidado</span>
                          <span className="text-5xl font-black font-mono tracking-tighter">
                            R$ {parseFloat((lastCreatedOrder?.total || 0).toString()).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Information (Footer) moved to bottom as requested */}
                  <div className="mt-12 bg-gray-50/50 rounded-[2.5rem] p-8 border border-gray-100">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 leading-none">Cliente</p>
                          <p className="font-black text-gray-900 text-sm uppercase italic">{lastCreatedOrder?.customer_name_manual || 'Consumidor'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 leading-none">Pagamento</p>
                          <p className="font-black text-gray-900 text-sm uppercase italic">{lastCreatedOrder?.payment_method || '---'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 leading-none">Forma de Entrega</p>
                          <p className="font-black text-gray-900 text-sm uppercase italic">{lastCreatedOrder?.delivery_method || 'BALCÃO'}</p>
                        </div>
                        {lastCreatedOrder?.delivery_method === 'ENTREGA' && lastCreatedOrder?.delivery_address && (
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 leading-none">Endereço</p>
                            <p className="font-bold text-gray-700 text-xs leading-tight">{lastCreatedOrder.delivery_address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Final Branding & Footer Message */}
                  <div className="text-center py-10 mt-6">
                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2 italic">Agradecemos sua Preferência!</p>
                    <p className="text-[10px] text-gray-400 font-medium">Este documento digital é um comprovante de venda.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-card border-t border-border flex gap-4 mt-auto shrink-0">
            <Button variant="outline" onClick={() => setIsReceiptOpen(false)} className="flex-1 h-14 rounded-2xl font-bold text-base">Fechar</Button>
            <Button
              className="flex-3 h-14 rounded-2xl font-black gap-2 transition-all bg-[#10b981] hover:bg-[#059669] text-white text-lg"
              onClick={async () => {
                const el = document.getElementById('finalize-receipt');
                if (!el) return;
                try {
                  const dataUrl = await htmlToImage.toJpeg(el, {
                    quality: 1,
                    backgroundColor: '#ffffff',
                    width: 640,
                  });
                  const link = document.createElement('a');
                  link.download = `recibo-${lastCreatedOrder?.id}.jpg`;
                  link.href = dataUrl;
                  link.click();
                  toast.success('🎉 Recibo salvo com largura 640px!');
                } catch (err) { console.error(err); }
              }}
            >
              <Share2 className="h-6 w-6" /> COMPARTILHAR JPG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
