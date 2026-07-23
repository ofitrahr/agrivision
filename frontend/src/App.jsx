import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './app/routes/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import Login from './pages/auth/Login';
import CompanyList from './pages/admin/CompanyList';
import CompanyUsers from './pages/admin/CompanyUsers';
import GlobalGIS from './pages/admin/GlobalGIS';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/companies" element={<CompanyList />} />
            <Route path="/admin/companies/:companyId/users" element={<CompanyUsers />} />
            <Route path="/admin/gis" element={<GlobalGIS />} />
        </Route>
        
        <Route path="*" element={<div style={{padding: '50px'}}>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
