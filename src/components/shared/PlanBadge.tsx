import { useGetBillingStatus } from '@/services/billing.service';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLAN_CONFIG = {
    basico: {
        label: 'Básico',
        color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
        icon: Zap,
    },
    pro: {
        label: 'Pro',
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        icon: Star,
    },
    enterprise: {
        label: 'Enterprise',
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        icon: Crown,
    },
};

export function PlanBadge() {
    const { data, isLoading } = useGetBillingStatus();
    if (isLoading || !data) return null;

    const { subscription } = data;
    const planSlug = subscription?.plan?.slug;
    const isOnTrial = subscription?.status === 'trial';

    if (isOnTrial) {
        const daysLeft = subscription.days_remaining ?? 0;
        return (
            <div className="mx-3 mb-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-medium">
                <Clock className="h-3 w-3 shrink-0" />
                Trial — {daysLeft}d restantes
            </div>
        );
    }

    if (!planSlug || !PLAN_CONFIG[planSlug]) return null;

    const config = PLAN_CONFIG[planSlug];
    const Icon = config.icon;

    return (
        <div className={cn(
            'mx-3 mb-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium',
            config.color
        )}>
            <Icon className="h-3 w-3 shrink-0" />
            Plano {config.label}
        </div>
    );
}
