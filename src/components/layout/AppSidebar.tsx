import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse, Users,
  UserCog, BarChart3, Settings, MessageSquare, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Pedidos', path: '/pedidos', icon: ShoppingCart },
  { label: 'Produtos', path: '/produtos', icon: Package },
  { label: 'Estoque', path: '/estoque', icon: Warehouse },
  { label: 'Clientes', path: '/clientes', icon: Users },
  { label: 'Operadores', path: '/operadores', icon: UserCog },
  { label: 'Relatórios', path: '/relatorios', icon: BarChart3 },
  { label: 'Configurações', path: '/configuracoes', icon: Settings },
  { label: 'Bot Simulator', path: '/bot-simulator', icon: MessageSquare },
];

export function AppSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-border">
        <RouterNavLink to="/" className="font-display font-extrabold text-xl text-foreground">
          Zap<span className="text-primary">PDV</span>
        </RouterNavLink>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <RouterNavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </RouterNavLink>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">A</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Admin</p>
            <p className="text-xs text-muted-foreground truncate">admin@zappdv.com</p>
          </div>
          <RouterNavLink to="/" className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </RouterNavLink>
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
