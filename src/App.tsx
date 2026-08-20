import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import BottomNav from './components/layout/BottomNav';
import DashboardPage   from './pages/DashboardPage';
import JobsPage        from './pages/JobsPage';
import JobDetailPage   from './pages/JobDetailPage';
import ClientsPage     from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import AgendaPage      from './pages/AgendaPage';
import MaisPage        from './pages/MaisPage';
import FreelancersPage from './pages/FreelancersPage';
import EquipmentPage   from './pages/EquipmentPage';
import InboxPage       from './pages/InboxPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<><DashboardPage    /><BottomNav /></>} />
        <Route path="/inbox"             element={<><InboxPage        /><BottomNav /></>} />
        <Route path="/projetos"          element={<><JobsPage          /><BottomNav /></>} />
        <Route path="/projetos/:id"      element={<><JobDetailPage     /><BottomNav /></>} />
        <Route path="/clientes"          element={<><ClientsPage       /><BottomNav /></>} />
        <Route path="/clientes/:id"      element={<><ClientDetailPage  /><BottomNav /></>} />
        <Route path="/agenda"            element={<><AgendaPage        /><BottomNav /></>} />
        <Route path="/mais"              element={<><MaisPage          /><BottomNav /></>} />
        <Route path="/freelancers"       element={<><FreelancersPage   /><BottomNav /></>} />
        <Route path="/equipamentos"      element={<><EquipmentPage     /><BottomNav /></>} />
      </Routes>
    </BrowserRouter>
  );
}
