import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { StoreProvider } from "@/contexts/StoreContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Pedidos from "./pages/Pedidos";
import Produtos from "./pages/Produtos";
import Estoque from "./pages/Estoque";
import Clientes from "./pages/Clientes";
import Operadores from "./pages/Operadores";
import Configuracoes from "./pages/Configuracoes";
import Assinaturas from "./pages/Assinaturas";
import AdminKeys from "./pages/AdminKeys";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Privacidade from "./pages/Privacidade";
import Termos from "./pages/Termos";
import Fornecedores from "./pages/Fornecedores";
import FreePlan from "./pages/FreePlan";
import { CookieBanner } from "@/components/CookieBanner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Don't retry on 401
    }
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/free" element={<FreePlan />} />

          <Route element={<PrivateRoute />}>
            <Route element={<StoreProvider><DashboardLayout /></StoreProvider>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pedidos" element={<Pedidos />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Restricted pages - Management Only */}
              <Route element={<PrivateRoute allowedRoles={['ADMIN', 'GERENTE']} />}>
                <Route path="/estoque" element={<Estoque />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/operadores" element={<Operadores />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/assinaturas" element={<Assinaturas />} />
                <Route path="/fornecedores" element={<Fornecedores />} />
              </Route>

              {/* Only Admin */}
              <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin/keys" element={<AdminKeys />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
