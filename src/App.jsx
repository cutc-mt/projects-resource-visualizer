import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout/Layout';
import { DashboardView, LeadsView, ProjectsView, ResourcesView } from './views';
import './App.css';

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

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
