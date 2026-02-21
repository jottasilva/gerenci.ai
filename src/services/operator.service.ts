import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { toast } from 'sonner';
import { Operador } from '@/types';

export const operatorService = {
    getOperators: async (): Promise<Operador[]> => {
        const response = await api.get('users/');
        // Map backend User fields to frontend Operador fields if necessary
        // Backend: { id, first_name, last_name, whatsapp, role, ativo }
        // Frontend Operador: { id, nome, whatsapp, role, ativo }
        return response.data.map((u: any) => ({
            id: u.id.toString(),
            nome: `${u.first_name} ${u.last_name}`.trim(),
            whatsapp: u.whatsapp,
            role: u.role,
            ativo: u.ativo
        }));
    },

    createOperator: async (operator: Omit<Operador, 'id'>): Promise<Operador> => {
        // Map frontend -> backend
        const names = operator.nome.split(' ');
        const first_name = names[0];
        const last_name = names.slice(1).join(' ');

        const response = await api.post('users/', {
            first_name,
            last_name,
            whatsapp: operator.whatsapp,
            role: operator.role,
            ativo: operator.ativo,
            password: '123' // Default password/PIN for new operators
        });
        return response.data;
    },

    updateOperator: async (operator: Operador): Promise<Operador> => {
        const names = operator.nome.split(' ');
        const first_name = names[0];
        const last_name = names.slice(1).join(' ');

        const response = await api.patch(`users/${operator.id}/`, {
            first_name,
            last_name,
            whatsapp: operator.whatsapp,
            role: operator.role,
            ativo: operator.ativo
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
