import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                if (userData.token) {
                    setToken(userData.token);
                }
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        if (userData.token) {
            setToken(userData.token);
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
    };

    // --- THIS NEW FUNCTION IS THE KEY ---
    // It updates the user details in the context without losing the token.
    const updateUserInContext = (updatedUserData) => {
        const currentUserData = JSON.parse(localStorage.getItem('user'));
        const newUserData = {
            ...currentUserData, // Keep old data like token
            ...updatedUserData, // Overwrite with new data like bio, profilePicture
        };
        localStorage.setItem('user', JSON.stringify(newUserData));
        setUser(newUserData);
    };
    // ------------------------------------

    const value = { user, token, login, logout, updateUserInContext, loading };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};