import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { useJobStore } from '../store/jobStore';
import { useClientStore } from '../store/clientStore';
import { computeJobFinance, formatCurrency } from '../lib/finance';
import JobModal from '../components/modals/JobModal';

export default function DashboardPage() {
  const navigate = useNavigate();
  const jobs = useJobStore((s) => s.jobs);
  const payments = useJobStore((s) => s.payments);
  const jobFreelancers = useJobStore((s) => s.jobFreelancers);
  const clients = useClientStore((s) => s.clients);
  const [showNewJob, setShowNewJob] = useState(false);

  // Active jobs (not cancelled)
  const activeJobs = jobs.filter((j) => j.status !== 'cancelled');

  // Summaries
  const summaries = activeJobs.map((j) => computeJobFinance(j, payments, jobFreelancers));

  const totalFaturado = summaries.reduce((s, x) => s + x.job.totalValue, 0);
  const totalRecebido = summaries.reduce((s, x) => s + x.totalPaid, 0);
  const totalPendente = summaries.reduce((s, x) => s + x.totalPending, 0);
  const rangelPendente = summaries.reduce((s, x) => s + x.rangelPending, 0);
  const felipePendente = summaries.reduce((s, x) => s + x.felipePending, 0);

  // Upcoming services (sorted by serviceDate)
  const upcoming = [...jobs]
    .filter((j) => j.serviceDate && j.status !== 'cancelled' && j.status !== 'completed')
    .sort((a, b) => (a.serviceDate! > b.serviceDate! ? 1 : -1))
    .slice(0, 5);

  // Jobs with pending payments
  const withPending = summaries
    .filter((s) => s.totalPending > 0 && s.job.status !== 'cancelled')
    .slice(0, 3);

  return (
    <div className="page">
      {/* HEADER */}
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Instante</h1>
          <p className="text-xs text-muted" style={{ marginTop: 1 }}>Gestão audiovisual</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNewJob(true)}>
          <Plus size={15} /> Projeto
        </button>
      </div>

      <div className="page-content">

        {/* STATS */}
        <div className="stats-grid animate-in">
          <div className="stat-card accent">
            <p className="stat-label">Total faturado</p>
            <p className="stat-value">{formatCurrency(totalFaturado)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">A receber</p>
            <p className="stat-value" style={{ color: totalPendente > 0 ? 'var(--warning)' : 'var(--success)' }}>
              {formatCurrency(totalPendente)}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Recebido</p>
            <p className="stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(totalRecebido)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Projetos ativos</p>
            <p className="stat-value">{activeJobs.filter(j => j.status !== 'completed').length}</p>
          </div>
        </div>

        {/* SPLIT PENDING */}
        {(rangelPendente > 0 || felipePendente > 0) && (
          <div className="section animate-in" style={{ animationDelay: '0.05s' }}>
            <p className="section-title">Pendente por sócio</p>
            <div className="split-row" style={{ paddingTop: 0 }}>
              <div className="split-avatar">RM</div>
              <div className="split-info">
                <p className="split-name">Rangel Marques</p>
              </div>
              <div className="split-values">
                <p className="split-paid" style={{ color: rangelPendente > 0 ? 'var(--warning)' : 'var(--success)' }}>
                  {formatCurrency(rangelPendente)}
                </p>
                <p className="split-pending">a receber</p>
              </div>
            </div>
            <div className="divider" style={{ margin: '0 0 0 46px' }} />
            <div className="split-row" style={{ paddingBottom: 0 }}>
              <div className="split-avatar">FR</div>
              <div className="split-info">
                <p className="split-name">Felipe Rodrigues</p>
              </div>
              <div className="split-values">
                <p className="split-paid" style={{ color: felipePendente > 0 ? 'var(--warning)' : 'var(--success)' }}>
                  {formatCurrency(felipePendente)}
                </p>
                <p className="split-pending">a receber</p>
              </div>
            </div>
          </div>
        )}

        {/* UPCOMING SERVICES */}
        {upcoming.length > 0 && (
          <div className="section animate-in" style={{ animationDelay: '0.08s' }}>
            <p className="section-title">Próximos serviços</p>
            {upcoming.map((job) => {
              const client = clients.find((c) => c.id === job.clientId);
              return (
                <div
                  key={job.id}
                  className="list-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/projetos/${job.id}`)}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'var(--copper-pale)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--copper-dark)', lineHeight: 1 }}>
                      {job.serviceDate ? new Date(job.serviceDate + 'T12:00:00').getDate() : '—'}
                    </span>
                    <span style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--copper-light)', textTransform: 'uppercase' }}>
                      {job.serviceDate ? new Date(job.serviceDate + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }) : ''}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-semibold truncate" style={{ fontSize: '0.9rem' }}>{job.title}</p>
                    <p className="text-xs text-muted truncate">{client?.name ?? 'Cliente'}</p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--charcoal-light)', flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        )}

        {/* PAYMENTS PENDING */}
        {withPending.length > 0 && (
          <div className="section animate-in" style={{ animationDelay: '0.1s' }}>
            <p className="section-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={13} /> Pagamentos pendentes
              </span>
            </p>
            {withPending.map(({ job, totalPending }) => {
              const client = clients.find((c) => c.id === job.clientId);
              return (
                <div
                  key={job.id}
                  className="list-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/projetos/${job.id}`)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-semibold truncate" style={{ fontSize: '0.875rem' }}>{job.title}</p>
                    <p className="text-xs text-muted">{client?.name ?? ''}</p>
                  </div>
                  <p style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                    {formatCurrency(totalPending)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* EMPTY */}
        {jobs.length === 0 && (
          <div className="empty-state animate-in" style={{ paddingTop: 32 }}>
            <p className="text-sm text-muted" style={{ marginTop: 2 }}>Nenhum projeto cadastrado ainda.</p>
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowNewJob(true)}>
              <Plus size={16} /> Novo projeto
            </button>
          </div>
        )}

      </div>

      {showNewJob && (
        <JobModal
          onClose={() => setShowNewJob(false)}
          onCreated={(id) => navigate(`/projetos/${id}`)}
        />
      )}
    </div>
  );
}
