import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../features/auth/AuthContext';
import Layout from '../../shared/components/Layout';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Memuat aplikasi...</div>;
    
    if (!user) return <Navigate to="/login" replace />;
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <div style={{padding: '50px', textAlign: 'center', color: 'red'}}>Akses Ditolak. Anda tidak memiliki izin.</div>;
    }

    return <Layout />;
};

export default ProtectedRoute;
