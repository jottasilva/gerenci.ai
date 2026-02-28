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

    createCategory: async (category: { name: string }) => {
        const response = await api.post('categories/', category);
        return response.data;
    },

    updateCategory: async (category: { id: number; name: string }) => {
        const response = await api.put(`categories/${category.id}/`, category);
        return response.data;
    },

    deleteCategory: async (id: number) => {
        await api.delete(`categories/${id}/`);
    },

    createProduct: async (product: any): Promise<Produto> => {
        // WHITELIST: Only these fields are writable on the backend
        const writableFields = ['name', 'sku', 'category', 'price', 'cost_price', 'stock', 'min_stock', 'is_active', 'supplier', 'description'];
        const formData = new FormData();
        for (const key of writableFields) {
            let value = product[key];
            // Map stock_min -> min_stock
            if (key === 'min_stock' && value === undefined) value = product['stock_min'];
            if (value !== null && value !== undefined && value !== '') {
                formData.append(key, String(value));
            }
        }
        // Handle image file separately
        if (product.image instanceof File) {
            formData.append('image', product.image);
        }
        const response = await api.post('products/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    updateProduct: async (product: any): Promise<Produto> => {
        // WHITELIST: Only these fields are writable on the backend
        const writableFields = ['name', 'sku', 'category', 'price', 'cost_price', 'stock', 'min_stock', 'is_active', 'supplier', 'description'];
        // Nullable FK fields — send empty string to clear, never send 'none'/'null'
        const nullableFkFields = ['category', 'supplier'];
        const formData = new FormData();
        for (const key of writableFields) {
            let value = product[key];
            // Map stock_min -> min_stock
            if (key === 'min_stock' && value === undefined) value = product['stock_min'];
            // Clean nullable FK values: convert 'none'/'null'/null to empty string (tells DRF to clear)
            if (nullableFkFields.includes(key)) {
                if (value === null || value === 'none' || value === 'null') {
                    formData.append(key, '');  // DRF accepts '' for nullable FK
                    continue;
                }
            }
            if (value !== null && value !== undefined && value !== '') {
                formData.append(key, String(value));
            }
        }
        // Handle image: only send if it's a new File, skip existing URL strings
        if (product.image instanceof File) {
            formData.append('image', product.image);
        }
        const response = await api.patch(`products/${product.id}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
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
        // Map frontend field names to backend
        const payload = {
            product: movement.product,
            movement_type: movement.type || movement.movement_type,
            quantity: movement.quantity,
            reason: movement.reason
        };
        const response = await api.post('stock-movements/', payload);
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

export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productService.createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success("Categoria criada com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao criar categoria.");
        }
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productService.updateCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Products might have category name updated
            toast.success("Categoria atualizada com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao atualizar categoria.");
        }
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productService.deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Categoria removida com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao remover categoria.");
        }
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
