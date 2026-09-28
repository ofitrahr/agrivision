export const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const redirectToLogin = () => {
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};
