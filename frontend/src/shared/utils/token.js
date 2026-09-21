const decodePayload = (token) => {
    try {
        const segment = token.split('.')[1];
        const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        return JSON.parse(atob(padded));
    } catch {
        return null;
    }
};

export const isTokenValid = (token) => {
    const payload = token ? decodePayload(token) : null;
    return Boolean(payload?.exp) && payload.exp * 1000 > Date.now();
};

export const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const redirectToLogin = () => {
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};
