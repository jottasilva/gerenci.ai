import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pedido } from '@/types';
import { api } from './api';
import { toast } from 'sonner';

export const orderService = {
    getOrders: async (): Promise<Pedido[]> => {
        const response = await api.get('orders/');
        return response.data;
    },

    createOrder: async (order: any): Promise<Pedido> => {
        const response = await api.post('orders/', order);
        return response.data;
    },

    updateOrderStatus: async (id: string, status: string): Promise<Pedido> => {
        const response = await api.patch(`orders/${id}/`, { status });
        return response.data;
    },

    getStats: async (period: string = 'diario'): Promise<any> => {
        const response = await api.get('orders/stats/', { params: { period } });
        return response.data;
    }
};

export const useGetDashboardStats = (period: string = 'diario') => {
    return useQuery({
        queryKey: ['dashboard-stats', period],
        queryFn: () => orderService.getStats(period),
        staleTime: 60 * 1000, // 1 minute
    });
};

export const useGetOrders = () => {
    return useQuery({
        queryKey: ['orders'],
        queryFn: orderService.getOrders,
    });
};

export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: orderService.createOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Pedido realizado com sucesso!");
        },
    });
};

export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string, status: string }) => orderService.updateOrderStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success("Status do pedido atualizado!");
        },
    });
};
