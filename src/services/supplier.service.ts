import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { toast } from 'sonner';
import { Fornecedor } from '@/types';

export const supplierService = {
    getSuppliers: async (): Promise<Fornecedor[]> => {
        const response = await api.get('suppliers/');
        return response.data;
    },

    createSupplier: async (supplier: Omit<Fornecedor, 'id'>): Promise<Fornecedor> => {
        const response = await api.post('suppliers/', supplier);
        return response.data;
    },

    updateSupplier: async (supplier: Fornecedor): Promise<Fornecedor> => {
        const { id, ...data } = supplier as any;
        // Remove read-only fields
        delete data.store;
        delete data.created_at;
        const response = await api.patch(`suppliers/${id}/`, data);
        return response.data;
    },

    deleteSupplier: async (id: string): Promise<void> => {
        await api.delete(`suppliers/${id}/`);
    }
};

export const useGetSuppliers = () => {
    return useQuery({
        queryKey: ['suppliers'],
        queryFn: supplierService.getSuppliers,
    });
};

export const useCreateSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: supplierService.createSupplier,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success("Fornecedor cadastrado com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Erro ao cadastrar fornecedor.");
        }
    });
};

export const useUpdateSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: supplierService.updateSupplier,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success("Fornecedor atualizado!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Erro ao atualizar fornecedor.");
        }
    });
};

export const useDeleteSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: supplierService.deleteSupplier,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success("Fornecedor removido!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Erro ao remover fornecedor.");
        }
    });
};
