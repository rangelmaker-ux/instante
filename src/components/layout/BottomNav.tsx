import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  MessageCircle,
  MoreHorizontal,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Início' },
  { to: '/projetos',  icon: Briefcase,       label: 'Projetos' },
  { to: '/inbox',     icon: MessageCircle,   label: 'Inbox' },
  { to: '/clientes',  icon: Users,           label: 'Clientes' },
  { to: '/mais',      icon: MoreHorizontal,  label: 'Mais' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
        const isActive =
          to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-wrap">
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
            </div>
            <span className="nav-label">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
