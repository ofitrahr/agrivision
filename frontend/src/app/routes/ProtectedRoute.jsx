import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../features/auth/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Memuat aplikasi...</div>;
    
    if (!user) return <Navigate to="/login" replace />;
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <div style={{padding: '50px', textAlign: 'center', color: 'red'}}>Akses Ditolak. Anda tidak memiliki izin.</div>;
    }

    return <Outlet />;
};

export default ProtectedRoute;
