import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';

interface StoreOption {
    id: string;
    name: string;
    whatsapp: string;
}

interface StoreContextType {
    selectedStoreId: string | null;
    selectedStoreName: string | null;
    setSelectedStore: (store: StoreOption) => void;
    isAdmin: boolean;
}

const StoreContext = createContext<StoreContextType>({
    selectedStoreId: null,
    selectedStoreName: null,
    setSelectedStore: () => { },
    isAdmin: false,
});

export function StoreProvider({ children }: { children: ReactNode }) {
    const user = authService.getCurrentUser();
    const isAdmin = user?.role === 'ADMIN' || false;
    const queryClient = useQueryClient();

    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(() => {
        return localStorage.getItem('selected_store_id');
    });
    const [selectedStoreName, setSelectedStoreName] = useState<string | null>(() => {
        return localStorage.getItem('selected_store_name');
    });

    const setSelectedStore = (store: StoreOption) => {
        setSelectedStoreId(store.id);
        setSelectedStoreName(store.name);
        localStorage.setItem('selected_store_id', store.id);
        localStorage.setItem('selected_store_name', store.name);

        // Invalidate all queries to force reload of data for the new store
        queryClient.invalidateQueries();
    };

    return (
        <StoreContext.Provider value={{ selectedStoreId, selectedStoreName, setSelectedStore, isAdmin }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStoreContext() {
    return useContext(StoreContext);
}
