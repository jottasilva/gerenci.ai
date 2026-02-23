import { useState } from 'react';
import {
  Plus, Search, Package as PackageIcon, Pencil, Trash2,
  MoreHorizontal, Filter, AlertTriangle, Warehouse,
  Tag, BarChart3, Database, Check, X, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/shared/PageHeader';
import { EstoqueIndicator } from '@/components/shared/EstoqueIndicator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Produto } from '@/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  useGetProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useGetCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory
} from '@/services/product.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Produtos() {
  const { data: products = [], isLoading, isError } = useGetProducts();
  const { data: categories = [] } = useGetCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('TODOS');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id: number; name: string } | null>(null);
  const [categoryName, setCategoryName] = useState('');

  const [formData, setFormData] = useState<Partial<Produto>>({
    name: '',
    sku: '',
    category: null,
    price: 0,
    stock: 0,
    stock_min: 0,
    is_active: true
  });

  const categoriasFiltro = ['TODOS', ...categories.map((c: any) => c.name)];

  const filtered = products.filter(p => {
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'TODOS' || p.category_name === catFilter;
    return matchSearch && matchCat;
  });

  const handleOpenDialog = (product?: Produto) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        category: product.category ? product.category.toString() : null
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        category: null,
        price: 0,
        stock: 0,
        stock_min: 0,
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.sku) {
      toast.error("Por favor, preencha os campos obrigatórios.");
      return;
    }

    try {
      if (editingProduct) {
        // Clean up data before sending to backend to avoid "stale" alias fields overwriting new data
        const {
          nome, preco, estoque, estoque_min, ativo, categoria,
          categoria_name, id, ...cleanData
        } = { ...editingProduct, ...formData } as any;

        await updateMutation.mutateAsync({ id: editingProduct.id, ...cleanData } as Produto);
      } else {
        await createMutation.mutateAsync(formData as Omit<Produto, 'id'>);
      }
      setIsDialogOpen(false);
    } catch (err) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este produto?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName) return;
    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({ id: editingCategory.id, name: categoryName });
      } else {
        await createCategoryMutation.mutateAsync({ name: categoryName });
      }
      setCategoryName('');
      setEditingCategory(null);
    } catch (err) { }
  };

  const handleEditCategory = (cat: { id: number; name: string }) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm("Deseja realmente excluir esta categoria? Isso removerá o vínculo com todos os produtos.")) {
      await deleteCategoryMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center px-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Carregando catálogo de produtos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center px-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground font-medium">Erro ao carregar produtos. Tente novamente.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Recarregar</Button>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col gap-4">
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Search className="h-4 w-4" /> Pesquisa
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nome ou SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-muted/30 border-none rounded-xl h-11 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Tag className="h-4 w-4" /> Categorias
          </h3>
          <div className="flex flex-col gap-1">
            {categoriasFiltro.map(c => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${catFilter === c
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                <span>{c === 'TODOS' ? 'Todas as Categorias' : c}</span>
                {catFilter === c && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>

        <Separator className="hidden lg:block" />

        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 hidden lg:block">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">Resumo do Catálogo</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total de Itens</span>
              <span className="font-bold">{products.length}</span>
            </div>
            <div className="flex justify-between text-xs text-destructive">
              <span>Estoque Baixo</span>
              <span className="font-bold">{products.filter(p => (p.estoque ?? p.stock) <= (p.estoque_min ?? p.stock_min)).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          titulo="Produtos"
          subtitulo="Gerencie seu catálogo de produtos e preços"
        />
        <div className="flex w-full sm:w-auto gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden flex-1 h-12 rounded-xl border-border">
                <Filter className="mr-2 h-4 w-4" /> Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 border-none">
              <ScrollArea className="h-full p-6">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-left font-display font-bold">Filtrar Produtos</SheetTitle>
                </SheetHeader>
                <SidebarContent />
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <Button
            variant="outline"
            onClick={() => setIsCategoryDialogOpen(true)}
            className="flex-1 sm:flex-none rounded-xl font-bold px-6 border-border h-12"
          >
            <Tag className="mr-2 h-5 w-5" /> Categorias
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="flex-1 sm:flex-none rounded-xl font-bold px-6 shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 transition-all h-12"
          >
            <Plus className="mr-2 h-5 w-5" /> Novo Produto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Filters Sidebar - Desktop */}
        <div className="hidden lg:block lg:col-span-1">
          <SidebarContent />
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          <ScrollArea className="h-auto lg:h-[calc(100vh-14rem)] pr-0 lg:pr-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-20 lg:pb-6">
              {filtered.map(p => (
                <div
                  key={p.id}
                  className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all relative overflow-hidden flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PackageIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 ${p.is_active
                        ? 'text-primary border-primary/30 bg-primary/5'
                        : 'text-muted-foreground border-border bg-muted/50'}`}>
                        {p.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-border shadow-2xl">
                          <DropdownMenuLabel>Gerenciar Produto</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenDialog(p)} className="rounded-lg gap-2">
                            <Pencil className="h-4 w-4" /> Editar Informações
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(p.id)}
                            className="text-destructive focus:text-destructive rounded-lg gap-2"
                          >
                            <Trash2 className="h-4 w-4" /> Excluir do Catálogo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-display font-bold text-foreground text-base leading-snug mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-4">
                      <span className="bg-muted px-2 py-0.5 rounded-md">SKU: {p.sku}</span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <span>{p.category_name}</span>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3 pt-3">
                    <Separator className="bg-border/30" />
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Preço Unitário</span>
                        <span className="text-lg font-display font-bold text-foreground leading-none">
                          R$ {parseFloat(p.price?.toString() || '0').toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div className="flex flex-col sm:items-end gap-1.5 flex-1 max-w-[140px]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estoque</span>
                        <EstoqueIndicator atual={p.stock} minimo={p.stock_min} />
                      </div>
                    </div>
                  </div>

                  {p.stock <= p.stock_min && (
                    <div className="absolute top-0 right-0 h-1 w-full bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse" />
                  )}
                </div>
              ))}

              {/* Add New Product Card - Quick access */}
              <button
                onClick={() => handleOpenDialog()}
                className="rounded-2xl border-2 border-dashed border-border p-5 flex flex-col items-center justify-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all min-h-[220px] group"
              >
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-all">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-foreground block">Novo Produto</span>
                  <span className="text-xs text-muted-foreground">Adicione um novo item ao catálogo</span>
                </div>
              </button>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Product Management Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[90vw] lg:max-w-[70vw] xl:max-w-[50vw] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>Preencha os dados do produto abaixo.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[85vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]">
              <div className="p-8 sm:p-10 bg-primary text-primary-foreground flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 h-64 w-64 bg-white/5 rounded-full -ml-32 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-48 w-48 bg-black/10 rounded-full -mr-24 -mb-24 blur-3xl" />

                <div className="relative z-10 space-y-6">
                  <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                    <Database className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3">{editingProduct ? 'Editar\nCatálogo' : 'Novo\nProduto'}</h2>
                    <p className="text-primary-foreground/70 text-lg max-w-xs">
                      Mantenha seu inventário atualizado para vender melhor pelo WhatsApp.
                    </p>
                  </div>

                  <div className="space-y-3 pt-6 hidden sm:block">
                    {['Controle de estoque automático', 'Organização por categorias', 'Alertas de reposição'].map(feat => (
                      <div key={feat} className="flex items-center gap-2 text-sm font-medium">
                        <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 sm:p-10 bg-card flex flex-col gap-6">
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome do Produto</Label>
                      <Input
                        id="name"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="h-12 rounded-xl bg-muted/30 border-none px-4"
                        placeholder="Ex: Coca-Cola 350ml"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Código / SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku || ''}
                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                        className="h-12 rounded-xl bg-muted/30 border-none px-4"
                        placeholder="REF-123"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Categoria</Label>
                      <Select
                        value={formData.category?.toString() || "none"}
                        onValueChange={(v) => setFormData({ ...formData, category: v === "none" ? null : v })}
                      >
                        <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none px-4">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                          <SelectItem value="none">Sem categoria</SelectItem>
                          {categories.map((c: any) => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preço de Venda</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price || 0}
                          onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                          className="h-12 pl-10 rounded-xl bg-muted/30 border-none font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Estoque Atual</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock || 0}
                        onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                        className="h-12 rounded-xl bg-muted/30 border-none px-4"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Estoque Mínimo</Label>
                      <Input
                        id="stock_min"
                        type="number"
                        value={formData.stock_min || 0}
                        onChange={e => setFormData({ ...formData, stock_min: parseInt(e.target.value) })}
                        className="h-12 rounded-xl bg-muted/30 border-none px-4 text-destructive font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <Switch
                        id="is_active"
                        checked={formData.is_active ?? true}
                        onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                      />
                      <Label htmlFor="is_active" className="text-sm font-bold">Produto Ativo</Label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-border">
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 rounded-xl order-2 sm:order-1">Cancelar</Button>
                  <Button
                    onClick={handleSave}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20 order-1 sm:order-2"
                  >
                    {editingProduct
                      ? (updateMutation.isPending ? 'Salvando...' : 'Salvar')
                      : (createMutation.isPending ? 'Cadastrando...' : 'Cadastrar')}
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {/* Category Management Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
            <DialogDescription>
              Crie e edite as categorias dos seus produtos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome da categoria"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="rounded-xl h-11"
              />
              <Button onClick={handleSaveCategory} className="rounded-xl h-11">
                {editingCategory ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </Button>
              {editingCategory && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryName('');
                  }}
                  className="rounded-xl h-11"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            <ScrollArea className="h-64 pr-4">
              <div className="space-y-2">
                {categories.map((cat: any) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50"
                  >
                    <span className="font-medium">{cat.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCategory(cat)}
                        className="h-8 w-8 rounded-lg"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
