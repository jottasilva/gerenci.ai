import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { toast } from 'sonner';

export interface StoreSettings {
    id?: number;
    name: string;
    cnpj?: string | null;
    email?: string | null;
    whatsapp?: string;
    address?: string | null;
    instagram?: string | null;
    website?: string | null;
    welcome_message?: string | null;
    out_of_hours_message?: string | null;
    delivery_fee?: number | string | null;
    bot_active?: boolean;
    logo?: string | null;
    is_active?: boolean;
}

export const storeService = {
    getStore: async (): Promise<StoreSettings> => {
        const response = await api.get('store/me/');
        return response.data;
    },

    updateStore: async (data: Partial<StoreSettings>): Promise<StoreSettings> => {
        const response = await api.patch('store/me/', data);
        return response.data;
    },

    // Keep existing getStores for admin store selector
    getStores: async (): Promise<StoreSettings[]> => {
        const response = await api.get('stores/');
        return response.data;
    },
};

export const useGetStore = () =>
    useQuery({
        queryKey: ['store-settings'],
        queryFn: storeService.getStore,
    });

export const useUpdateStore = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: storeService.updateStore,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['store-settings'] });
            toast.success('Configurações salvas com sucesso!');
        },
        onError: (error: any) => {
            console.error(error);
            const msg = error.response?.data ? JSON.stringify(error.response.data) : 'Erro ao salvar configurações.';
            toast.error(msg);
        },
    });
};

export function useGetStores() {
    return useQuery({
        queryKey: ['stores'],
        queryFn: storeService.getStores,
    });
}
