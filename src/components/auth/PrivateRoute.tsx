import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '@/services/auth.service';

interface PrivateRouteProps {
    allowedRoles?: ('ADMIN' | 'GERENTE' | 'VENDEDOR')[];
}

export function PrivateRoute({ allowedRoles }: PrivateRouteProps) {
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles) {
        const user = authService.getCurrentUser();
        if (!user || !allowedRoles.includes(user.role)) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <Outlet />;
}
