import { api } from './api';
import { Operador } from '@/types';

export interface AuthResponse {
    user: Operador;
    access: string;
    refresh: string;
}

export const authService = {
    login: async (whatsapp: string, pin: string): Promise<AuthResponse> => {
        const response = await api.post('auth/token/', {
            whatsapp,
            password: pin
        });

        // Check if user needs to set up password
        if (response.data.needs_password_setup) {
            const error: any = new Error('needs_password_setup');
            error.needs_password_setup = true;
            error.whatsapp = response.data.whatsapp;
            throw error;
        }

        const { access, refresh } = response.data;

        // Get user profile after login
        const userResponse = await api.get('users/me/', {
            headers: { Authorization: `Bearer ${access}` }
        });
        const user = userResponse.data;

        localStorage.setItem('token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user', JSON.stringify(user));

        return { user, access, refresh };
    },

    setupPassword: async (whatsapp: string, newPassword: string, confirmPassword: string): Promise<any> => {
        const response = await api.post('auth/setup-password/', {
            whatsapp,
            new_password: newPassword,
            confirm_password: confirmPassword
        });
        return response.data;
    },

    register: async (data: any) => {
        const response = await api.post('auth/register/', {
            whatsapp: data.whatsapp,
            password: data.pin,
            business_name: data.businessName,
            first_name: data.businessName.split(' ')[0], // Simple mock
        });
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('selected_store_id');
        localStorage.removeItem('selected_store_name');
        window.location.href = '/';
    },

    getCurrentUser: (): Operador | null => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    updateProfile: async (data: Partial<Operador> & { password?: string }): Promise<Operador> => {
        const response = await api.patch('users/me/', data);
        const updatedUser = response.data;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
    },
    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    }
};
