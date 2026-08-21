import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { useAuthStore } from './store/authStore';
import { useClientStore } from './store/clientStore';
import { useJobStore } from './store/jobStore';
import { useFreelancerStore, useEquipmentStore } from './store/otherStores';
import BottomNav from './components/layout/BottomNav';
import LoginPage       from './pages/LoginPage';
import DashboardPage   from './pages/DashboardPage';
import JobsPage        from './pages/JobsPage';
import JobDetailPage   from './pages/JobDetailPage';
import ClientsPage     from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import AgendaPage      from './pages/AgendaPage';
import CRMPage         from './pages/MaisPage';
import GoalsPage       from './pages/GoalsPage';
import ProductionPage  from './pages/ProductionPage';
import FreelancersPage from './pages/FreelancersPage';
import EquipmentPage   from './pages/EquipmentPage';
import InboxPage       from './pages/InboxPage';

export default function App() {
  const { session, initialized, initialize } = useAuthStore();
  const fetchClients = useClientStore((s) => s.fetchClients);
  const fetchJobsData = useJobStore((s) => s.fetchData);
  const fetchFreelancers = useFreelancerStore((s) => s.fetchFreelancers);
  const fetchRentals = useEquipmentStore((s) => s.fetchRentals);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (session) {
      fetchClients();
      fetchJobsData();
      fetchFreelancers();
      fetchRentals();
    }
  }, [session, fetchClients, fetchJobsData, fetchFreelancers, fetchRentals]);

  if (!initialized) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<><DashboardPage    /><BottomNav /></>} />
        <Route path="/inbox"             element={<><InboxPage        /><BottomNav /></>} />
        <Route path="/projetos"          element={<><JobsPage         /><BottomNav /></>} />
        <Route path="/projetos/:id"      element={<><JobDetailPage    /><BottomNav /></>} />
        <Route path="/clientes"          element={<><ClientsPage      /><BottomNav /></>} />
        <Route path="/clientes/:id"      element={<><ClientDetailPage /><BottomNav /></>} />
        <Route path="/agenda"            element={<><AgendaPage       /><BottomNav /></>} />
        <Route path="/mais"              element={<><CRMPage          /><BottomNav /></>} />
        <Route path="/crm"               element={<><CRMPage          /><BottomNav /></>} />
        <Route path="/metas"             element={<><GoalsPage        /><BottomNav /></>} />
        <Route path="/producao"          element={<><ProductionPage   /><BottomNav /></>} />
        <Route path="/freelancers"       element={<><FreelancersPage  /><BottomNav /></>} />
        <Route path="/equipamentos"      element={<><EquipmentPage    /><BottomNav /></>} />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
