import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import { DashboardView, LeadsView, ProjectsView, ResourcesView, LoginView } from './views';
import './App.css';

// Protected route component for manager-only access
function ProtectedRoute({ children }) {
  const { isManager, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!isManager) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Main content component with view switching
function AppContent() {
  const { currentView } = useApp();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'leads':
        return <LeadsView />;
      case 'projects':
        return <ProjectsView />;
      case 'resources':
        return <ResourcesView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <Layout>
      {renderView()}
    </Layout>
  );
}

// Manager-only dashboard (all features enabled)
function ManagerDashboard() {
  return (
    <AppProvider managerMode={true}>
      <AppContent />
    </AppProvider>
  );
}

// Public dashboard (view-only mode)
function PublicDashboard() {
  return (
    <AppProvider managerMode={false}>
      <AppContent />
    </AppProvider>
  );
}

function App() {
  const { isManager } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicDashboard />} />
      <Route path="/login" element={
        isManager ? <Navigate to="/manager" replace /> : <LoginView />
      } />

      {/* Protected Manager Routes */}
      <Route
        path="/manager/*"
        element={
          <ProtectedRoute>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
