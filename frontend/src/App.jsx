import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './app/routes/ProtectedRoute';
import LandingPage from './pages/public/LandingPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import Login from './pages/auth/Login';
import CompanyList from './pages/admin/CompanyList';
import CompanyUsers from './pages/admin/CompanyUsers';
import CompanyPermissions from './pages/admin/CompanyPermissions';
import GlobalGIS from './pages/admin/GlobalGIS';
import AdminTraceability from './pages/admin/AdminTraceability';

import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerProfile from './pages/manager/ManagerProfile';
import ManagerFarmers from './pages/manager/ManagerFarmers';
import ManagerGIS from './pages/manager/ManagerGIS';
import ManagerAgronomy from './pages/manager/ManagerAgronomy';
import ManagerEconomics from './pages/manager/ManagerEconomics';
import ManagerTraceability from './pages/manager/ManagerTraceability';

import BoardDashboard from './pages/board/BoardDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rute Super Admin */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/companies" element={<CompanyList />} />
            <Route path="/admin/companies/:companyId/users" element={<CompanyUsers />} />
            <Route path="/admin/companies/:companyId/permissions" element={<CompanyPermissions />} />
            <Route path="/admin/gis" element={<GlobalGIS />} />
            <Route path="/admin/traceability" element={<AdminTraceability />} />
        </Route>

        {/* Rute Manager Klien */}
        <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
            <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/profile" element={<ManagerProfile />} />
            <Route path="/manager/farmers" element={<ManagerFarmers />} />
            <Route path="/manager/gis" element={<ManagerGIS />} />
            <Route path="/manager/agronomy" element={<ManagerAgronomy />} />
            <Route path="/manager/economics" element={<ManagerEconomics />} />
            <Route path="/manager/traceability" element={<ManagerTraceability />} />
        </Route>

        {/* Rute Board */}
        <Route element={<ProtectedRoute allowedRoles={['board']} />}>
            <Route path="/board/dashboard" element={<BoardDashboard />} />
        </Route>
        
        <Route path="*" element={<div style={{padding: '50px'}}>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
