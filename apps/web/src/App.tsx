import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/Layout';

// Asset Pages
import AssetListPage from './pages/assets/AssetListPage';
import AssetDetailPage from './pages/assets/AssetDetailPage';
import AssetFormPage from './pages/assets/AssetFormPage';
import AssetQRPage from './pages/assets/AssetQRPage';

// Maintenance Pages
import MaintenanceListPage from './pages/maintenance/MaintenanceListPage';
import MaintenanceDetailPage from './pages/maintenance/MaintenanceDetailPage';
import SchedulesPage from './pages/maintenance/SchedulesPage';

// Fault Pages
import FaultsListPage from './pages/faults/FaultsListPage';
import FaultDetailPage from './pages/faults/FaultDetailPage';

// Admin Pages
import HospitalsPage from './pages/admin/HospitalsPage';
import UsersPage from './pages/admin/UsersPage';
import VendorsPage from './pages/admin/VendorsPage';
import VendorDetailPage from './pages/admin/VendorDetailPage';
import CompliancePage from './pages/admin/CompliancePage';
import InventoryPage from './pages/admin/InventoryPage';
import ReportsPage from './pages/admin/ReportsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import QRGeneratorPage from './pages/admin/QRGeneratorPage';
import ScanLogsPage from './pages/admin/ScanLogsPage';

// Public Pages
import PublicScanPage from './pages/public/PublicScanPage';
import PublicFaultPage from './pages/public/PublicFaultPage';
import { ability, AbilityContext } from './lib/ability';
import ProtectedRoute from './components/ProtectedRoute';

import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: any) => {
        const message = error.response?.data?.error?.message || 'Something went wrong';
        console.error('Mutation Error:', message);
      }
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AbilityContext.Provider value={ability}>
        <AuthProvider>
          <Router>
            <Toaster position="top-right" />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/scan/:assetTag" element={<PublicScanPage />} />
              <Route path="/fault/:assetTag" element={<PublicFaultPage />} />

              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                
                {/* Assets */}
                <Route path="assets" element={<AssetListPage />} />
                <Route path="assets/new" element={<AssetFormPage />} />
                <Route path="assets/:id" element={<AssetDetailPage />} />
                <Route path="assets/:id/edit" element={<AssetFormPage />} />
                <Route path="assets/:id/qr" element={<AssetQRPage />} />

                {/* Maintenance */}
                <Route path="maintenance" element={<MaintenanceListPage />} />
                <Route path="maintenance/:id" element={<MaintenanceDetailPage />} />
                <Route path="schedules" element={<SchedulesPage />} />

                {/* Faults */}
                <Route path="faults" element={<FaultsListPage />} />
                <Route path="faults/:id" element={<FaultDetailPage />} />

                {/* QR Management */}
                <Route path="qr-generator" element={<QRGeneratorPage />} />
                <Route path="scan-logs" element={<ScanLogsPage />} />

                {/* Admin */}
                <Route path="hospitals" element={<HospitalsPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="vendors" element={<VendorsPage />} />
                <Route path="vendors/:id" element={<VendorDetailPage />} />
                <Route path="compliance" element={<CompliancePage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </AbilityContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
