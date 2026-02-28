import { useState, useRef } from 'react';
import {
  Plus, Search, Package as PackageIcon, Pencil, Trash2,
  MoreHorizontal, Filter, AlertTriangle, Warehouse,
  Tag, BarChart3, Database, Check, X, Loader2,
  ImagePlus, DollarSign, BarChart2, Settings2, Truck,
  ChevronLeft, ChevronRight
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
  useDeleteCategory,
  useCreateStockMovement
} from '@/services/product.service';
import { useGetSuppliers } from '@/services/supplier.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRODUCTS_PER_PAGE = 16; // 4 rows × 4 cols on desktop

export default function Produtos() {
  const { data: products = [], isLoading, isError } = useGetProducts();
  const { data: categories = [] } = useGetCategories();
  const { data: suppliers = [] } = useGetSuppliers();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const stockMovementMutation = useCreateStockMovement();

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState<Partial<Produto>>({
    name: '',
    sku: '',
    category: null,
    price: 0,
    stock: 0,
    stock_min: 0,
    is_active: true
  });

  // Only categories that have at least 1 product
  const categoriesWithProducts = categories.filter((c: any) =>
    products.some(p => p.category_name === c.name)
  );
  const categoriasFiltro = ['TODOS', ...categoriesWithProducts.map((c: any) => c.name)];

  // Count products per category for badges
  const getCategoryCount = (catName: string) => {
    if (catName === 'TODOS') return products.length;
    return products.filter(p => p.category_name === catName).length;
  };

  // Filter + sort by most sold (stock descending as proxy, since we don't have sales data)
  const filtered = products
    .filter(p => {
      const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === 'TODOS' || p.category_name === catFilter;
      return matchSearch && matchCat;
    })
    .sort((a, b) => (b.stock || 0) - (a.stock || 0)); // Most stocked first (proxy for popular)

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Reset page when filter changes
  const handleCatFilter = (cat: string) => {
    setCatFilter(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleOpenDialog = (product?: Produto) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        category: product.category ? product.category.toString() : null
      });
      setImagePreview((product as any).image || null);
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
      setImagePreview(null);
    }
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.sku) {
      toast.error("Por favor, preencha os campos obrigatórios.", { style: { background: '#DC2626', color: '#fff', border: 'none' } });
      return;
    }

    try {
      // Build payload with ONLY writable fields — never spread the whole product
      const buildPayload = () => {
        const payload: any = {
          name: formData.name,
          sku: formData.sku,
          price: formData.price || 0,
          stock: formData.stock || 0,
          min_stock: formData.stock_min || (formData as any).min_stock || 0,
          is_active: formData.is_active ?? true,
        };
        if (formData.category && formData.category !== 'none') {
          payload.category = formData.category;
        } else {
          payload.category = null;
        }
        if ((formData as any).cost_price != null) payload.cost_price = (formData as any).cost_price;
        if ((formData as any).supplier && (formData as any).supplier !== 'none') {
          payload.supplier = (formData as any).supplier;
        }
        if ((formData as any).description) payload.description = (formData as any).description;
        if (imageFile) payload.image = imageFile;
        return payload;
      };

      if (editingProduct) {
        const oldStock = editingProduct.stock || 0;
        const newStock = formData.stock || 0;
        const stockDiff = newStock - oldStock;

        const payload = { id: editingProduct.id, ...buildPayload() };
        await updateMutation.mutateAsync(payload);

        // Auto-create stock movement when stock changes
        if (stockDiff !== 0) {
          try {
            await stockMovementMutation.mutateAsync({
              product: editingProduct.id,
              type: stockDiff > 0 ? 'ENTRADA' : 'SAIDA',
              quantity: Math.abs(stockDiff),
              reason: `Edição de produto — ${stockDiff > 0 ? 'aumento' : 'baixa'} de ${Math.abs(stockDiff)} un via edição`
            });
          } catch (e) { /* stock movement is secondary */ }
        }

        // Build change summary for toast
        const changes: string[] = [];
        if (editingProduct.name !== formData.name) changes.push('nome');
        if (editingProduct.price !== formData.price) changes.push('preço');
        if (stockDiff !== 0) changes.push(`estoque (${stockDiff > 0 ? '+' : ''}${stockDiff})`);
        if (editingProduct.is_active !== formData.is_active) changes.push(formData.is_active ? 'ativado' : 'desativado');

        const summary = changes.length > 0 ? `Alterações: ${changes.join(', ')}` : 'Dados salvos';
        toast.success(`✅ Produto atualizado! ${summary}`, {
          style: { background: '#059669', color: '#fff', border: 'none' },
          duration: 4000
        });
      } else {
        const payload = buildPayload();
        const created = await createMutation.mutateAsync(payload);

        // Auto-create stock movement for new product
        if ((formData.stock || 0) > 0) {
          try {
            await stockMovementMutation.mutateAsync({
              product: created.id,
              type: 'ENTRADA',
              quantity: formData.stock,
              reason: 'Cadastro inicial de produto'
            });
          } catch (e) { /* stock movement is secondary */ }
        }

        toast.success(`🆕 Produto "${formData.name}" cadastrado com sucesso!`, {
          style: { background: '#059669', color: '#fff', border: 'none' },
          duration: 4000
        });
      }
      setIsDialogOpen(false);
    } catch (err) {
      toast.error("❌ Erro ao salvar produto. Tente novamente.", {
        style: { background: '#DC2626', color: '#fff', border: 'none' }
      });
    }
  };

  const handleDelete = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (window.confirm("Deseja realmente excluir este produto?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success(`🗑️ Produto "${product?.name}" removido do catálogo.`, {
          style: { background: '#F59E0B', color: '#000', border: 'none' },
          duration: 3000
        });
      } catch {
        toast.error("❌ Erro ao excluir produto.", {
          style: { background: '#DC2626', color: '#fff', border: 'none' }
        });
      }
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName) return;
    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({ id: editingCategory.id, name: categoryName });
        toast.success(`📁 Categoria "${categoryName}" atualizada!`, {
          style: { background: '#3B82F6', color: '#fff', border: 'none' }
        });
      } else {
        await createCategoryMutation.mutateAsync({ name: categoryName });
        toast.success(`📁 Categoria "${categoryName}" criada!`, {
          style: { background: '#059669', color: '#fff', border: 'none' }
        });
      }
      setCategoryName('');
      setEditingCategory(null);
    } catch (err) {
      toast.error("Erro ao salvar categoria.", {
        style: { background: '#DC2626', color: '#fff', border: 'none' }
      });
    }
  };

  const handleEditCategory = (cat: { id: number; name: string }) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm("Deseja realmente excluir esta categoria? Isso removerá o vínculo com todos os produtos.")) {
      try {
        await deleteCategoryMutation.mutateAsync(id);
        toast.success("📁 Categoria removida.", {
          style: { background: '#F59E0B', color: '#000', border: 'none' }
        });
      } catch {
        toast.error("Erro ao excluir categoria.", {
          style: { background: '#DC2626', color: '#fff', border: 'none' }
        });
      }
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

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
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
                {/* Mobile filters */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome ou SKU..."
                      value={search}
                      onChange={e => handleSearchChange(e.target.value)}
                      className="pl-9 bg-muted/30 border-none rounded-xl h-11"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    {categoriasFiltro.map(c => (
                      <button
                        key={c}
                        onClick={() => handleCatFilter(c)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${catFilter === c
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                      >
                        <span>{c === 'TODOS' ? 'Todas' : c}</span>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">{getCategoryCount(c)}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
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

      {/* 🔍 SEARCH BAR — Above categories */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou SKU..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="pl-9 bg-muted/30 border-none rounded-xl h-11 focus-visible:ring-primary/20 hidden lg:flex"
        />
      </div>

      {/* 🏷️ CATEGORIES — Below search, horizontal pills, no empty categories */}
      <div className="hidden lg:flex items-center gap-2 flex-wrap">
        {categoriasFiltro.map(c => (
          <button
            key={c}
            onClick={() => handleCatFilter(c)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${catFilter === c
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
          >
            {c === 'TODOS' ? 'Todos' : c}
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${catFilter === c ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
              {getCategoryCount(c)}
            </span>
          </button>
        ))}
      </div>

      {/* Products Grid + Catalog Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Products Grid — takes 4/5 */}
        <div className="lg:col-span-4">
          {paginatedProducts.length === 0 ? (
            <div className="text-center py-16">
              <PackageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-bold text-foreground mb-1">Nenhum produto encontrado</h3>
              <p className="text-sm text-muted-foreground">Tente alterar os filtros ou cadastre um novo produto.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {paginatedProducts.map(p => (
                  <div
                    key={p.id}
                    className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all relative overflow-hidden flex flex-col h-full"
                  >
                    <div className="flex items-start justify-between mb-4">
                      {(p as any).image ? (
                        <img
                          src={(p as any).image}
                          alt={p.name}
                          className="h-12 w-12 rounded-2xl object-cover group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <PackageIcon className="h-6 w-6 text-primary" />
                        </div>
                      )}
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
                        {p.category_name && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                            <span>{p.category_name}</span>
                          </>
                        )}
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
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="h-9 rounded-xl gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-9 w-9 rounded-xl text-sm font-bold transition-all ${currentPage === page
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="h-9 rounded-xl gap-1"
                  >
                    Próxima <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Catalog Summary — Desktop sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4 sticky top-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Resumo do Catálogo</span>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total de Itens</span>
                <span className="font-bold">{products.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Exibindo</span>
                <span className="font-bold">{filtered.length}</span>
              </div>
              <div className="flex justify-between text-xs text-destructive">
                <span>Estoque Baixo</span>
                <span className="font-bold">{products.filter(p => (p.estoque ?? p.stock) <= (p.estoque_min ?? p.stock_min)).length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Categorias</span>
                <span className="font-bold">{categoriesWithProducts.length}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Página</span>
              <span className="font-bold">{currentPage} / {totalPages}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Management Dialog — 60vw */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[60vw] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-display font-bold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>Preencha os dados do produto abaixo.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh]">
            <div className="p-6 space-y-6">

              {/* 📷 Imagem do Produto */}
              <div className="space-y-3">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full h-40 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/20 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 group overflow-hidden relative"
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                        <div className="flex items-center gap-2 text-white text-sm font-bold">
                          <ImagePlus className="h-5 w-5" />
                          Trocar Imagem
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                        <ImagePlus className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground">Adicionar imagem</p>
                        <p className="text-xs text-muted-foreground">Clique para selecionar</p>
                      </div>
                    </>
                  )}
                </button>
              </div>

              {/* Two-column layout for 60vw */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* 📦 Informações Básicas */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <PackageIcon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Informações Básicas</h3>
                    </div>
                    <div className="space-y-3 pl-9">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground">Nome do Produto *</Label>
                        <Input
                          value={formData.name || ''}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="h-11 rounded-xl bg-muted/30 border-none px-4"
                          placeholder="Ex: Coca-Cola 350ml"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground">Código / SKU *</Label>
                        <Input
                          value={formData.sku || ''}
                          onChange={e => setFormData({ ...formData, sku: e.target.value })}
                          className="h-11 rounded-xl bg-muted/30 border-none px-4"
                          placeholder="REF-123"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground">Categoria</Label>
                        <Select
                          value={formData.category?.toString() || "none"}
                          onValueChange={(v) => setFormData({ ...formData, category: v === "none" ? null : v })}
                        >
                          <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none px-4">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border">
                            <SelectItem value="none">Sem categoria</SelectItem>
                            {categories.map((c: any) => (
                              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* ⚙️ Status */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Settings2 className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Status</h3>
                    </div>
                    <div className="pl-9">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
                        <div>
                          <p className="text-sm font-bold">Produto Ativo</p>
                          <p className="text-xs text-muted-foreground">Desative para ocultar do catálogo e PDV</p>
                        </div>
                        <Switch
                          checked={formData.is_active ?? true}
                          onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* 💰 Venda */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Venda</h3>
                    </div>
                    <div className="space-y-3 pl-9">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground">Preço de Venda</Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.price || 0}
                              onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                              className="h-11 pl-11 rounded-xl bg-muted/30 border-none font-bold"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground">Valor de Custo</Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={(formData as any).cost_price || 0}
                              onChange={e => setFormData({ ...formData, cost_price: parseFloat(e.target.value) } as any)}
                              className="h-11 pl-11 rounded-xl bg-muted/30 border-none font-bold"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground">Fornecedor</Label>
                        <Select
                          value={(formData as any).supplier?.toString() || "none"}
                          onValueChange={(v) => setFormData({ ...formData, supplier: v === "none" ? null : v } as any)}
                        >
                          <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none px-4">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border">
                            <SelectItem value="none">Sem fornecedor</SelectItem>
                            {suppliers.map((s: any) => (
                              <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 📊 Estoque */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <BarChart2 className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Estoque</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pl-9">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground">Estoque Atual</Label>
                        <Input
                          type="number"
                          value={formData.stock || 0}
                          onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                          className="h-11 rounded-xl bg-muted/30 border-none px-4 font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-destructive/80">Estoque Mínimo</Label>
                        <Input
                          type="number"
                          value={formData.stock_min || 0}
                          onChange={e => setFormData({ ...formData, stock_min: parseInt(e.target.value) })}
                          className="h-11 rounded-xl bg-destructive/5 border border-destructive/10 px-4 font-bold text-destructive"
                        />
                      </div>
                    </div>
                    {editingProduct && (formData.stock || 0) !== (editingProduct.stock || 0) && (
                      <div className="ml-9 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-500 font-medium">
                        ℹ️ Movimentação automática será lançada: <strong>{((formData.stock || 0) - (editingProduct.stock || 0)) > 0 ? 'Entrada' : 'Saída'}</strong> de <strong>{Math.abs((formData.stock || 0) - (editingProduct.stock || 0))}</strong> unidade(s)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-6 pt-0">
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 rounded-xl order-2 sm:order-1">Cancelar</Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20 order-1 sm:order-2"
              >
                {editingProduct
                  ? (updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações')
                  : (createMutation.isPending ? 'Cadastrando...' : 'Cadastrar Produto')}
              </Button>
            </div>
          </div>
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
                {categories.map((cat: any) => {
                  const count = products.filter(p => p.category_name === cat.name).length;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cat.name}</span>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">{count}</Badge>
                      </div>
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
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
