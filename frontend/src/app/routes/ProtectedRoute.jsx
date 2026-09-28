import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../features/auth/AuthContext';
import Layout from '../../shared/components/Layout';

const ROLE_HOME = {
    super_admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    board: '/board/dashboard',
};

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Memuat aplikasi...</div>;
    
    if (!user) return <Navigate to="/login" replace />;
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const home = ROLE_HOME[user.role];
        return <Navigate to={home || '/login'} replace />;
    }

    return <Layout />;
};

export default ProtectedRoute;
