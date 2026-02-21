import { api } from './api';
import { useQuery } from '@tanstack/react-query';

export interface PlanLimits {
    max_products: number;        // -1 = unlimited
    max_operators: number;
    max_whatsapp: number;
    advanced_reports: boolean;
    api_access: boolean;
    multi_store: boolean;
    priority_support: boolean;
    dedicated_support: boolean;
    sla: boolean;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    slug: 'basico' | 'pro' | 'enterprise';
    price: string;
    limits: PlanLimits;
    features: string[];
    is_highlighted: boolean;
    description: string;
}

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

    generateKey: async (data: { plan: number; duration_days: number; key: string }): Promise<any> => {
        const response = await api.post('license-keys/', data);
        return response.data;
    },

    activateKey: async (key: string): Promise<any> => {
        const response = await api.post('license-keys/activate/', { key });
        return response.data;
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
