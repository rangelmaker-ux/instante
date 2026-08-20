import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Phone, Mail, ChevronRight } from 'lucide-react';
import { useClientStore } from '../store/clientStore';
import { useJobStore } from '../store/jobStore';
import { computeJobFinance, formatCurrency, formatDate, JOB_STATUS_LABELS, JOB_STATUS_COLORS } from '../lib/finance';
import PageHeader from '../components/layout/PageHeader';
import ClientModal from '../components/modals/ClientModal';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getClient = useClientStore((s) => s.getClient);
  const deleteClient = useClientStore((s) => s.deleteClient);
  const jobs = useJobStore((s) => s.jobs);
  const payments = useJobStore((s) => s.payments);
  const jobFreelancers = useJobStore((s) => s.jobFreelancers);

  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const client = getClient(id!);
  if (!client) {
    return (
      <div className="page">
        <PageHeader title="Cliente" back />
        <div className="empty-state"><p>Cliente não encontrado.</p></div>
      </div>
    );
  }

  const clientJobs = jobs.filter((j) => j.clientId === client.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const handleDelete = () => {
    deleteClient(client.id);
    navigate('/clientes');
  };

  const totalBilled = clientJobs.reduce((s, j) => s + j.totalValue, 0);

  return (
    <div className="page">
      <PageHeader
        title={client.name}
        back
        right={
          <>
            <button className="btn-icon" onClick={() => setShowEdit(true)}><Edit2 size={18} /></button>
            <button className="btn-icon" onClick={() => setConfirmDelete(true)}><Trash2 size={18} /></button>
          </>
        }
      />

      <div className="page-content">
        {/* INFO */}
        <div className="section animate-in">
          <div
            style={{
              width: 60, height: 60, borderRadius: 16, background: 'var(--copper-pale)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '1.25rem', color: 'var(--copper-dark)',
              marginBottom: 14,
            }}
          >
            {client.name.slice(0, 2).toUpperCase()}
          </div>
          <h2 style={{ fontSize: '1.125rem', marginBottom: 4 }}>{client.name}</h2>
          {client.company && <p className="text-sm text-mid" style={{ marginBottom: 12 }}>{client.company}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a href={`tel:${client.phone}`} className="flex items-center gap-2" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Phone size={14} style={{ color: 'var(--copper)' }} />
              <span className="text-sm">{client.phone}</span>
            </a>
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center gap-2" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Mail size={14} style={{ color: 'var(--copper)' }} />
                <span className="text-sm">{client.email}</span>
              </a>
            )}
          </div>

          {client.notes && (
            <>
              <div className="divider" />
              <p className="text-sm text-mid" style={{ lineHeight: 1.6 }}>{client.notes}</p>
            </>
          )}
        </div>

        {/* STATS */}
        <div className="stats-grid animate-in" style={{ animationDelay: '0.04s' }}>
          <div className="stat-card accent">
            <p className="stat-label">Total faturado</p>
            <p className="stat-value">{formatCurrency(totalBilled)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Projetos</p>
            <p className="stat-value">{clientJobs.length}</p>
          </div>
        </div>

        {/* PROJECTS */}
        {clientJobs.length > 0 && (
          <div className="section animate-in" style={{ animationDelay: '0.06s' }}>
            <p className="section-title">Projetos</p>
            {clientJobs.map((job) => {
              const summary = computeJobFinance(job, payments, jobFreelancers);
              return (
                <div
                  key={job.id}
                  className="list-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/projetos/${job.id}`)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate" style={{ fontSize: '0.875rem' }}>{job.title}</p>
                      <span className={`badge ${JOB_STATUS_COLORS[job.status]}`} style={{ fontSize: '0.6rem', flexShrink: 0 }}>
                        {JOB_STATUS_LABELS[job.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      {formatCurrency(job.totalValue)}
                      {summary.totalPending > 0 && ` · falta ${formatCurrency(summary.totalPending)}`}
                      {job.serviceDate && ` · ${formatDate(job.serviceDate)}`}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--charcoal-light)' }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showEdit && <ClientModal client={client} onClose={() => setShowEdit(false)} />}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="modal-sheet animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag" />
            <h2 className="modal-title">Excluir cliente?</h2>
            <p className="text-sm text-mid" style={{ marginBottom: 20 }}>
              Os projetos vinculados a este cliente não serão excluídos, mas perderão a referência do cliente.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-full" onClick={() => setConfirmDelete(false)}>Cancelar</button>
              <button className="btn btn-danger btn-full" onClick={handleDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
