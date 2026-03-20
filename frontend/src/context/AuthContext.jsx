import { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('momentpick_token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setAdmin(res.data);
                } catch (err) {
                    localStorage.removeItem('momentpick_token');
                    setAdmin(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        localStorage.setItem('momentpick_token', res.data.token);
        setAdmin({ username: res.data.username, isAdmin: true });
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('momentpick_token');
        setAdmin(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ admin, login, logout, isAdmin: !!admin?.isAdmin, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
