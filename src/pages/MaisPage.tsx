import { useNavigate } from 'react-router-dom';
import {
  Users, Package, BarChart2, ChevronRight,
} from 'lucide-react';
import { useFreelancerStore, useEquipmentStore } from '../store/otherStores';
import { useJobStore } from '../store/jobStore';
import { computeJobFinance, formatCurrency } from '../lib/finance';

export default function MaisPage() {
  const navigate = useNavigate();
  const freelancers = useFreelancerStore((s) => s.freelancers);
  const rentals = useEquipmentStore((s) => s.rentals);
  const jobs = useJobStore((s) => s.jobs);
  const payments = useJobStore((s) => s.payments);
  const jobFreelancers = useJobStore((s) => s.jobFreelancers);

  const summaries = jobs
    .filter((j) => j.status !== 'cancelled')
    .map((j) => computeJobFinance(j, payments, jobFreelancers));

  const rangelTotal   = summaries.reduce((s, x) => s + x.rangelGross, 0);
  const felipeTotal   = summaries.reduce((s, x) => s + x.felipeGross, 0);
  const companyTotal  = summaries.reduce((s, x) => s + x.companyGross, 0);
  const rangelPaid    = summaries.reduce((s, x) => s + x.rangelPaid, 0);
  const felipePaid    = summaries.reduce((s, x) => s + x.felipePaid, 0);
  const companyPaid   = summaries.reduce((s, x) => s + x.companyPaid, 0);

  const MENU_ITEMS = [
    {
      icon: Users,
      label: 'Freelancers',
      desc: `${freelancers.length} cadastrado${freelancers.length !== 1 ? 's' : ''}`,
      to: '/freelancers',
    },
    {
      icon: Package,
      label: 'Equipamentos',
      desc: `${rentals.length} contrato${rentals.length !== 1 ? 's' : ''} de locação`,
      to: '/equipamentos',
    },
    {
      icon: BarChart2,
      label: 'Financeiro',
      desc: 'Visão consolidada',
      to: '/financeiro',
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Mais</h1>
      </div>

      <div className="page-content">
        {/* PARTNER CARDS */}
        <div className="section animate-in">
          <p className="section-title">Resumo dos sócios</p>

          <div className="split-row" style={{ paddingTop: 0 }}>
            <div className="split-avatar">RM</div>
            <div className="split-info">
              <p className="split-name">Rangel Marques</p>
              <div className="progress-bar" style={{ marginTop: 4 }}>
                <div
                  className="progress-fill progress-copper"
                  style={{ width: `${rangelTotal > 0 ? (rangelPaid / rangelTotal) * 100 : 0}%` }}
                />
              </div>
              <p className="split-meta" style={{ marginTop: 2 }}>Total bruto: {formatCurrency(rangelTotal)}</p>
            </div>
            <div className="split-values">
              <p className="split-paid" style={{ color: 'var(--success)' }}>{formatCurrency(rangelPaid)}</p>
              <p className="split-pending">{formatCurrency(rangelTotal - rangelPaid)} pend.</p>
            </div>
          </div>

          <div className="divider" style={{ margin: '0 0 0 46px' }} />

          <div className="split-row" style={{ paddingBottom: 0 }}>
            <div className="split-avatar">FR</div>
            <div className="split-info">
              <p className="split-name">Felipe Rodrigues</p>
              <div className="progress-bar" style={{ marginTop: 4 }}>
                <div
                  className="progress-fill progress-copper"
                  style={{ width: `${felipeTotal > 0 ? (felipePaid / felipeTotal) * 100 : 0}%` }}
                />
              </div>
              <p className="split-meta" style={{ marginTop: 2 }}>Total bruto: {formatCurrency(felipeTotal)}</p>
            </div>
            <div className="split-values">
              <p className="split-paid" style={{ color: 'var(--success)' }}>{formatCurrency(felipePaid)}</p>
              <p className="split-pending">{formatCurrency(felipeTotal - felipePaid)} pend.</p>
            </div>
          </div>

          <div className="divider" />

          <div className="flex items-center justify-between" style={{ padding: '4px 0' }}>
            <div className="flex items-center gap-2">
              <div className="split-avatar" style={{ fontSize: '1rem' }}>🏦</div>
              <div>
                <p className="split-name">Caixa da empresa</p>
                <p className="split-meta">Total bruto: {formatCurrency(companyTotal)}</p>
              </div>
            </div>
            <div className="split-values">
              <p className="split-paid" style={{ color: 'var(--success)' }}>{formatCurrency(companyPaid)}</p>
              <p className="split-pending">{formatCurrency(companyTotal - companyPaid)} pend.</p>
            </div>
          </div>
        </div>

        {/* NAVIGATION MENU */}
        <div className="section animate-in" style={{ animationDelay: '0.05s', padding: 0 }}>
          {MENU_ITEMS.map(({ icon: Icon, label, desc, to }, i) => (
            <div
              key={to}
              className="list-item"
              style={{ padding: '14px 16px', cursor: 'pointer', borderBottom: i < MENU_ITEMS.length - 1 ? '1px solid var(--border-light)' : 'none' }}
              onClick={() => navigate(to)}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, background: 'var(--copper-pale)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={18} style={{ color: 'var(--copper-dark)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p className="font-semibold" style={{ fontSize: '0.9375rem' }}>{label}</p>
                <p className="text-xs text-muted">{desc}</p>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--charcoal-light)' }} />
            </div>
          ))}
        </div>

        {/* APP INFO */}
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <p className="text-xs text-muted">Instante Comunicação · Gestão interna v1.0</p>
        </div>
      </div>
    </div>
  );
}
