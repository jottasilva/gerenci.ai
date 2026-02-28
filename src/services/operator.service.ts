import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { toast } from 'sonner';
import { Operador } from '@/types';

export const operatorService = {
    getOperators: async (): Promise<Operador[]> => {
        const response = await api.get('users/');
        return response.data.map((u: any) => ({
            id: u.id.toString(),
            nome: `${u.first_name} ${u.last_name}`.trim(),
            login_name: u.login_name || '',
            whatsapp: u.whatsapp,
            role: u.role,
            ativo: u.ativo,
            profile_image: u.profile_image,
            needs_password_setup: u.needs_password_setup || false
        }));
    },

    createOperator: async (data: FormData): Promise<Operador> => {
        // Handle name splitting if name is in FormData
        const nome = data.get('nome') as string;
        if (nome) {
            const names = nome.split(' ');
            data.append('first_name', names[0]);
            data.append('last_name', names.slice(1).join(' '));
            data.delete('nome');
        }

        const response = await api.post('users/', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    updateOperator: async ({ id, data }: { id: string; data: FormData }): Promise<Operador> => {
        // Handle name splitting if name is in FormData
        const nome = data.get('nome') as string;
        if (nome) {
            const names = nome.split(' ');
            data.append('first_name', names[0]);
            data.append('last_name', names.slice(1).join(' '));
            data.delete('nome');
        }

        const response = await api.patch(`users/${id}/`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteOperator: async (id: string): Promise<void> => {
        await api.delete(`users/${id}/`);
    }
};

export const useGetOperators = () => {
    return useQuery({
        queryKey: ['operators'],
        queryFn: operatorService.getOperators,
    });
};

export const useCreateOperator = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: operatorService.createOperator,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operators'] });
            toast.success("Operador cadastrado com sucesso!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao cadastrar operador.");
        }
    });
};

export const useUpdateOperator = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: operatorService.updateOperator,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operators'] });
            toast.success("Operador atualizado!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao atualizar operador.");
        }
    });
};

export const useDeleteOperator = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: operatorService.deleteOperator,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operators'] });
            toast.success("Operador removido!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao remover operador.");
        }
    });
};
