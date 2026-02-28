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
            needs_password_setup: u.needs_password_setup || false
        }));
    },

    createOperator: async (operator: any): Promise<Operador> => {
        const names = (operator.nome || '').split(' ');
        const first_name = names[0];
        const last_name = names.slice(1).join(' ');

        const payload: any = {
            first_name,
            last_name,
            login_name: operator.login_name || null,
            whatsapp: operator.whatsapp,
            role: operator.role,
            ativo: operator.ativo ?? true,
        };
        // Only send password if provided — blank means setup on first login
        if (operator.password) {
            payload.password = operator.password;
        } else {
            payload.password = '';
        }
        if (operator.horario_inicio) payload.horario_inicio = operator.horario_inicio;
        if (operator.horario_fim) payload.horario_fim = operator.horario_fim;

        const response = await api.post('users/', payload);
        return response.data;
    },

    updateOperator: async (operator: any): Promise<Operador> => {
        const names = (operator.nome || '').split(' ');
        const first_name = names[0];
        const last_name = names.slice(1).join(' ');

        const payload: any = {
            first_name,
            last_name,
            login_name: operator.login_name || null,
            whatsapp: operator.whatsapp,
            role: operator.role,
            ativo: operator.ativo
        };
        if (operator.password) payload.password = operator.password;
        if (operator.horario_inicio) payload.horario_inicio = operator.horario_inicio;
        if (operator.horario_fim) payload.horario_fim = operator.horario_fim;

        const response = await api.patch(`users/${operator.id}/`, payload);
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
