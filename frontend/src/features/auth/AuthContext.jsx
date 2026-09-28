import React, { createContext, useState, useEffect } from 'react';
import api from '../../shared/api/axios';
import { clearSession } from '../../shared/utils/token';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user');

        if (!userData) {
            clearSession();
            setLoading(false);
            return;
        }

        let parsedUser;
        try {
            parsedUser = JSON.parse(userData);
        } catch {
            clearSession();
            setLoading(false);
            return;
        }

        api.get('/auth/profile', { skipAuthRedirect: true })
            .then((response) => {
                if (response.data.success) {
                    setUser({ ...parsedUser, role: response.data.data.role });
                } else {
                    clearSession();
                }
            })
            .catch(() => {
                clearSession();
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });
            if (response.data.success) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setUser(response.data.user);
            }
            return response.data;
        } catch (error) {
            return error.response?.data || { success: false, message: "Terjadi kesalahan server" };
        }
    };

    const logout = () => {
        api.post('/auth/logout', null, { skipAuthRedirect: true }).catch(() => {});
        clearSession();
        setUser(null);
    };

    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
