import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './app/routes/ProtectedRoute';
import LandingPage from './pages/public/LandingPage';
import TraceabilityDashboard from './pages/public/TraceabilityDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminActivityLogsPage from './pages/admin/AdminActivityLogsPage';
import Login from './pages/auth/Login';
import CompanyList from './pages/admin/CompanyList';
import ProjectList from './pages/admin/ProjectList';
import CompanyUsers from './pages/admin/CompanyUsers';
import CompanyPermissions from './pages/admin/CompanyPermissions';
import GIS from './pages/admin/GIS';
import AdminTraceability from './pages/admin/AdminTraceability';

import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerActivityLogsPage from './pages/manager/ManagerActivityLogsPage';
import ManagerProfile from './pages/manager/ManagerProfile';
import ManagerFarmers from './pages/manager/ManagerFarmers';

import ManagerAgronomy from './pages/manager/ManagerAgronomy';
import ManagerFarmManagement from './pages/manager/ManagerFarmManagement';
import ManagerEconomics from './pages/manager/ManagerEconomics';
import ManagerTraceability from './pages/manager/ManagerTraceability';

import BoardDashboard from './pages/board/BoardDashboard';

import UserProfile from './pages/shared/UserProfile';
import PlatformSettings from './pages/shared/PlatformSettings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/trace/:batchNumber" element={<TraceabilityDashboard />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rute Bersama (Authenticated) */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin', 'manager', 'board']} />}>
            <Route path="/settings" element={<PlatformSettings />} />
        </Route>
        
        {/* Rute Super Admin */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/activities" element={<AdminActivityLogsPage />} />
            <Route path="/admin/settings" element={<PlatformSettings />} />
            <Route path="/admin/companies" element={<CompanyList />} />
            <Route path="/admin/companies/:companyId/projects" element={<ProjectList />} />
            <Route path="/admin/companies/:companyId/users" element={<CompanyUsers />} />
            <Route path="/admin/projects/:projectId/permissions" element={<CompanyPermissions />} />
            <Route path="/admin/gis" element={<GIS />} />
            <Route path="/admin/traceability" element={<AdminTraceability />} />
            <Route path="/admin/profile" element={<UserProfile />} />
        </Route>

        {/* Rute Manager Klien */}
        <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
            <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/activities" element={<ManagerActivityLogsPage />} />
            <Route path="/manager/settings" element={<PlatformSettings />} />
            <Route path="/manager/profile" element={<ManagerProfile />} />
            <Route path="/manager/farmers" element={<ManagerFarmers />} />

            <Route path="/manager/farm-management" element={<ManagerFarmManagement />} />
            <Route path="/manager/agronomy" element={<ManagerAgronomy />} />
            <Route path="/manager/economics" element={<ManagerEconomics />} />
            <Route path="/manager/traceability" element={<ManagerTraceability />} />
            <Route path="/manager/profile-user" element={<UserProfile />} />
        </Route>

        {/* Rute Board */}
        <Route element={<ProtectedRoute allowedRoles={['board']} />}>
            <Route path="/board/dashboard" element={<BoardDashboard />} />
            <Route path="/board/settings" element={<PlatformSettings />} />
            <Route path="/board/profile" element={<UserProfile />} />
        </Route>
        
        <Route path="*" element={<div style={{padding: '50px'}}>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
