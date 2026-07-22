import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';

// Layout & Guards
import Layout from './components/Layout.js';
import PrivateRoute from './components/PrivateRoute.js';
import RoleRoute from './components/RoleRoute.js';

// Pages
import Login from './pages/Login.js';
import Signup from './pages/Signup.js';
import Dashboard from './pages/Dashboard.js';
import MembersList from './pages/MembersList.js';
import AddMember from './pages/AddMember.js';
import EditMember from './pages/EditMember.js';
import MemberProfile from './pages/MemberProfile.js';
import CertificateGenerator from './pages/CertificateGenerator.js';
import Unauthorized from './pages/Unauthorized.js';
import NotFound from './pages/NotFound.js';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Private Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  {/* Redirect root to dashboard */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/certificates" element={<CertificateGenerator />} />

                  {/* Member Routes guarded by Role Permissions */}
                  <Route element={<RoleRoute permission="member:read" />}>
                    <Route path="/members" element={<MembersList />} />
                    <Route path="/members/:id" element={<MemberProfile />} />
                  </Route>

                  <Route element={<RoleRoute permission="member:create" />}>
                    <Route path="/members/add" element={<AddMember />} />
                  </Route>

                  <Route element={<RoleRoute permission="member:update" />}>
                    <Route path="/members/edit/:id" element={<EditMember />} />
                  </Route>
                </Route>
              </Route>

              {/* Error Pages */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
