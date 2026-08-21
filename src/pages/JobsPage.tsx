import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useJobStore } from '../store/jobStore';
import { useClientStore } from '../store/clientStore';
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS, formatCurrency, formatShortDate, computeJobFinance } from '../lib/finance';
import JobModal from '../components/modals/JobModal';

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all',         label: 'Todos' },
  { key: 'negotiating', label: 'Negociação' },
  { key: 'confirmed',   label: 'Confirmado' },
  { key: 'in_progress', label: 'Em execução' },
  { key: 'delivered',   label: 'Entregue' },
  { key: 'completed',   label: 'Concluído' },
];

export default function JobsPage() {
  const navigate = useNavigate();
  const jobs = useJobStore((s) => s.jobs);
  const payments = useJobStore((s) => s.payments);
  const jobFreelancers = useJobStore((s) => s.jobFreelancers);
  const clients = useClientStore((s) => s.clients);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const filtered = jobs
    .filter((j) => filter === 'all' || j.status === filter)
    .filter((j) => {
      if (!search) return true;
      const client = clients.find((c) => c.id === j.clientId);
      const text = `${j.title} ${client?.name ?? ''} ${client?.company ?? ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Projetos</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Novo
        </button>
      </div>

      {/* SEARCH */}
      <div className="search-bar">
        <Search size={16} style={{ color: 'var(--charcoal-light)', flexShrink: 0 }} />
        <input
          placeholder="Buscar projeto ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* FILTER CHIPS */}
      <div className="filter-row">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`chip ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="page-content" style={{ paddingTop: 8 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p className="text-sm">Nenhum projeto encontrado.</p>
            {jobs.length === 0 && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Criar projeto
              </button>
            )}
          </div>
        ) : (
          <div className="desktop-grid flex flex-col gap-3">
            {filtered.map((job) => {
              const client = clients.find((c) => c.id === job.clientId);
              const summary = computeJobFinance(job, payments, jobFreelancers);
              const pct = job.totalValue > 0 ? (summary.totalPaid / job.totalValue) * 100 : 0;

              return (
              <div
                key={job.id}
                className="card animate-in"
                onClick={() => navigate(`/projetos/${job.id}`)}
              >
                <div className="card-row" style={{ marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-semibold truncate" style={{ fontSize: '0.9375rem' }}>{job.title}</p>
                    <p className="text-xs text-muted truncate" style={{ marginTop: 2 }}>
                      {client?.name ?? 'Cliente removido'}
                      {client?.company ? ` — ${client.company}` : ''}
                    </p>
                  </div>
                  <span className={`badge ${JOB_STATUS_COLORS[job.status] ?? 'badge-neutral'}`} style={{ flexShrink: 0 }}>
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="progress-bar" style={{ marginBottom: 8 }}>
                  <div
                    className={`progress-fill ${pct >= 100 ? 'progress-success' : 'progress-copper'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                <div className="card-row">
                  <span className="text-xs text-muted">
                    {job.serviceDate ? `📅 ${formatShortDate(job.serviceDate)}` : 'Sem data'}
                  </span>
                  <div style={{ flex: 1 }} />
                  <span className="text-xs text-muted" style={{ marginRight: 8 }}>
                    {formatCurrency(summary.totalPaid)} / {formatCurrency(job.totalValue)}
                  </span>
                  {summary.totalPending > 0 && (
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                      {formatCurrency(summary.totalPending)} pendente
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => setShowModal(true)} aria-label="Novo projeto">
        <Plus size={24} />
      </button>

      {showModal && (
        <JobModal
          onClose={() => setShowModal(false)}
          onCreated={(id) => navigate(`/projetos/${id}`)}
        />
      )}
    </div>
  );
}
