import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cliente } from '@/types';
import { api } from './api';
import { toast } from 'sonner';

export const customerService = {
    getCustomers: async (): Promise<Cliente[]> => {
        const response = await api.get('customers/');
        return response.data;
    },

    createCustomer: async (customer: Omit<Cliente, 'id'>): Promise<Cliente> => {
        const response = await api.post('customers/', customer);
        return response.data;
    },

    updateCustomer: async (customer: Cliente): Promise<Cliente> => {
        const response = await api.put(`customers/${customer.id}/`, customer);
        return response.data;
    },

    deleteCustomer: async (id: string): Promise<void> => {
        await api.delete(`customers/${id}/`);
    }
};

export const useGetCustomers = () => {
    return useQuery({
        queryKey: ['customers'],
        queryFn: customerService.getCustomers,
    });
};

export const useCreateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: customerService.createCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success("Cliente cadastrado com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao cadastrar cliente.");
        }
    });
};

export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: customerService.updateCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success("Dados do cliente atualizados!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao atualizar cliente.");
        }
    });
};

export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: customerService.deleteCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success("Cliente removido com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao remover cliente.");
        }
    });
};
