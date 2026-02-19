import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Pedidos from "./pages/Pedidos";
import Produtos from "./pages/Produtos";
import Estoque from "./pages/Estoque";
import Clientes from "./pages/Clientes";
import Operadores from "./pages/Operadores";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import BotSimulator from "./pages/BotSimulator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/bot-simulator" element={<BotSimulator />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/operadores" element={<Operadores />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
