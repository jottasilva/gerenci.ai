import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Produto } from '@/types';
import { api } from './api';
import { toast } from 'sonner';

export const productService = {
    getProducts: async (): Promise<Produto[]> => {
        const response = await api.get('products/');
        return response.data;
    },

    getCategories: async () => {
        const response = await api.get('categories/');
        return response.data;
    },

    createProduct: async (product: Omit<Produto, 'id'>): Promise<Produto> => {
        const response = await api.post('products/', product);
        return response.data;
    },

    updateProduct: async (product: Produto): Promise<Produto> => {
        const response = await api.put(`products/${product.id}/`, product);
        return response.data;
    },

    deleteProduct: async (id: string): Promise<void> => {
        await api.delete(`products/${id}/`);
    },

    getStockMovements: async () => {
        const response = await api.get('stock-movements/');
        return response.data;
    },

    createStockMovement: async (movement: any) => {
        const response = await api.post('stock-movements/', movement);
        return response.data;
    }
};

// Hooks
export const useGetProducts = () => {
    return useQuery({
        queryKey: ['products'],
        queryFn: productService.getProducts,
    });
};

export const useGetCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: productService.getCategories,
    });
};

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productService.createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Produto criado com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao criar produto.");
        }
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productService.updateProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Produto atualizado com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao atualizar produto.");
        }
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productService.deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Produto removido com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao remover produto.");
        }
    });
};

export const useGetStockMovements = () => {
    return useQuery({
        queryKey: ['stock-movements'],
        queryFn: productService.getStockMovements,
    });
};

export const useCreateStockMovement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productService.createStockMovement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Movimentação registrada com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao registrar movimentação.");
        }
    });
};
