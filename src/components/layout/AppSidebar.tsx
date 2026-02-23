import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse, Users,
  UserCog, Settings, LogOut, Menu, X, Store, CreditCard, Key, HelpCircle
} from 'lucide-react';
import { useState } from 'react';
import { authService } from '@/services/auth.service';
import { useGetStores } from '@/services/store.service';
import { useStoreContext } from '@/contexts/StoreContext';
import { PlanBadge } from '@/components/shared/PlanBadge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'GERENTE'] },
  { label: 'Pedidos', path: '/pedidos', icon: ShoppingCart },
  { label: 'Produtos', path: '/produtos', icon: Package },
  { label: 'Estoque', path: '/estoque', icon: Warehouse, roles: ['ADMIN', 'GERENTE'] },
  { label: 'Clientes', path: '/clientes', icon: Users, roles: ['ADMIN', 'GERENTE'] },
  { label: 'Operadores', path: '/operadores', icon: UserCog, roles: ['ADMIN', 'GERENTE'] },
  { label: 'Configurações', path: '/configuracoes', icon: Settings, roles: ['ADMIN', 'GERENTE'] },
  { label: 'Assinatura', path: '/assinaturas', icon: CreditCard, roles: ['ADMIN', 'GERENTE'] },
];

export function AppSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';

  const { selectedStoreId, selectedStoreName, setSelectedStore } = useStoreContext();
  const { data: stores = [] } = useGetStores();

  const handleLogout = () => {
    // Clear all session data
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('selected_store_id');
    localStorage.removeItem('selected_store_name');
    // Redirect to landing page
    window.location.href = '/';
  };

  const userInitial = user?.first_name?.[0]?.toUpperCase() || 'U';
  const userName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : 'Usuário';
  const userRole = user?.role || '';

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border h-24 flex items-center justify-center">
        <RouterNavLink to="/" className="flex items-center justify-center w-full h-full">
          <img
            src="https://i.imgur.com/qjT8M0X.png"
            alt="Gerenc.AI"
            className="w-full h-full object-contain max-h-14"
          />
        </RouterNavLink>
      </div>

      {/* Admin Store Selector */}
      {isAdmin && stores.length > 0 && (
        <div className="px-4 py-3 border-b border-border bg-primary/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <Store className="h-3 w-3" /> Gerenciando Loja
          </p>
          <Select
            value={selectedStoreId || ''}
            onValueChange={(val) => {
              const store = stores.find(s => String(s.id) === val);
              if (store) setSelectedStore({
                id: String(store.id),
                name: store.name,
                whatsapp: store.whatsapp || ''
              });
            }}
          >
            <SelectTrigger className="h-9 text-sm bg-background border-border rounded-xl">
              <SelectValue placeholder="Selecionar loja..." />
            </SelectTrigger>
            <SelectContent>
              {stores.map(store => (
                <SelectItem key={store.id} value={String(store.id)}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.filter(item => !item.roles || (user && item.roles.includes(user.role))).map(item => {
          const isActive = location.pathname === item.path;
          return (
            <RouterNavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </RouterNavLink>
          );
        })}

        {/* Tutorial Button */}
        <button
          onClick={() => {
            localStorage.removeItem('dashboard_tutorial_seen');
            window.location.reload(); // Simple way to re-trigger since it uses local state
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted mt-2"
        >
          <HelpCircle className="h-4.5 w-4.5 shrink-0" />
          Abrir Tutorial
        </button>
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-border">
        <PlanBadge />
        {/* Selected store info for non-admins */}
        {!isAdmin && user?.store_name && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl bg-muted/50">
            <Store className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{user?.store_name || 'Minha Loja'}</span>
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{userName}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">Nível: {userRole}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col bg-card border-r border-border h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
