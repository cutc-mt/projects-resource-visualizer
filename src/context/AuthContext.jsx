import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Simple password for manager mode (in production, use proper authentication)
const MANAGER_PASSWORD = 'manager123';

export function AuthProvider({ children }) {
    const [isManager, setIsManager] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check for saved session on mount
    useEffect(() => {
        const saved = sessionStorage.getItem('isManager');
        if (saved === 'true') {
            setIsManager(true);
        }
        setIsLoading(false);
    }, []);

    const login = (password) => {
        if (password === MANAGER_PASSWORD) {
            setIsManager(true);
            sessionStorage.setItem('isManager', 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsManager(false);
        sessionStorage.removeItem('isManager');
    };

    const value = {
        isManager,
        isLoading,
        login,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export default AuthContext;
