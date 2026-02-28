import { api } from './api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubscriptionPlan, PlanLimits } from '@/types';
import { toast } from 'sonner';
export type { SubscriptionPlan, PlanLimits };

export interface SubscriptionData {
    id: string;
    plan: SubscriptionPlan | null;
    status: 'trial' | 'active' | 'canceled' | 'expired';
    start_date: string;
    end_date: string | null;
    trial_end: string | null;
    is_active: boolean;
    days_remaining: number | null;
}

export interface UsageData {
    products_count: number;
    operators_count: number;
    whatsapp_numbers_count: number;
    last_updated: string;
}

export interface LimitWarning {
    current: number;
    limit: number;
    pct: number;
}

export interface BillingStatus {
    subscription: SubscriptionData;
    usage: UsageData;
    limits: PlanLimits;
    warnings: Record<string, LimitWarning>;
}

export interface BillingEvent {
    id: string;
    event_type: string;
    payload: Record<string, unknown>;
    created_at: string;
}

export const billingService = {
    getStatus: async (): Promise<BillingStatus> => {
        const response = await api.get('billing/status/');
        return response.data;
    },

    getPlans: async (): Promise<SubscriptionPlan[]> => {
        const response = await api.get('plans/');
        return response.data;
    },

    subscribe: async (planSlug: string): Promise<SubscriptionData> => {
        const response = await api.post('billing/subscribe/', { plan_slug: planSlug });
        return response.data;
    },

    getHistory: async (): Promise<BillingEvent[]> => {
        const response = await api.get('billing/history/');
        return response.data;
    },

    getKeys: async (): Promise<any[]> => {
        const response = await api.get('license-keys/');
        return response.data;
    },

    generateKey: async (data: {
        plan: number;
        duration_days: number;
        key: string;
        operators_limit?: number;
        managers_limit?: number;
    }): Promise<any> => {
        const response = await api.post('license-keys/', data);
        return response.data;
    },

    activateKey: async (key: string): Promise<any> => {
        const response = await api.post('license-keys/activate/', { key });
        return response.data;
    },

    deleteKey: async (id: number): Promise<void> => {
        await api.delete(`license-keys/${id}/`);
    },

    renewKey: async (id: number): Promise<any> => {
        const response = await api.post(`license-keys/${id}/renew/`);
        return response.data;
    },

    extendSubscription: async (id: number): Promise<any> => {
        const response = await api.post(`license-keys/${id}/extend_subscription/`);
        return response.data;
    },

    // Plan CRUD
    createPlan: async (data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
        const response = await api.post('plans/', data);
        return response.data;
    },

    updatePlan: async (id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
        const response = await api.put(`plans/${id}/`, data);
        return response.data;
    },

    deletePlan: async (id: number): Promise<void> => {
        await api.delete(`plans/${id}/`);
    },
};

export function useGetBillingStatus() {
    return useQuery({
        queryKey: ['billing-status'],
        queryFn: billingService.getStatus,
        staleTime: 30_000, // 30s
        retry: false,
    });
}

export function useGetPlans() {
    return useQuery({
        queryKey: ['billing-plans'],
        queryFn: billingService.getPlans,
        staleTime: 5 * 60_000, // 5 min
    });
}

export function useGetLicenseKeys() {
    return useQuery({
        queryKey: ['license-keys'],
        queryFn: billingService.getKeys,
    });
}

export function useGenerateLicenseKey() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: billingService.generateKey,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['license-keys'] });
        }
    });
}

export function useDeleteLicenseKey() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: billingService.deleteKey,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['license-keys'] });
        }
    });
}

export function useRenewLicenseKey() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: billingService.renewKey,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['license-keys'] });
        }
    });
}

export function useExtendSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: billingService.extendSubscription,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['license-keys'] });
            toast.success('Assinatura renovada com sucesso!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'Erro ao renovar assinatura.');
        }
    });
}

export function usePlanMutations() {
    const queryClient = useQueryClient();
    return {
        create: useMutation({
            mutationFn: billingService.createPlan,
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing-plans'] })
        }),
        update: useMutation({
            mutationFn: (data: { id: number; data: Partial<SubscriptionPlan> }) => billingService.updatePlan(data.id, data.data),
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing-plans'] })
        }),
        delete: useMutation({
            mutationFn: billingService.deletePlan,
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing-plans'] })
        })
    };
}
