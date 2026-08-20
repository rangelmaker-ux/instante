import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Edit2, Trash2, Plus, User, Calendar,
  MapPin, Link2, FileText, ExternalLink, CheckCircle2, Clock, X
} from 'lucide-react';
import { useJobStore } from '../store/jobStore';
import { useClientStore } from '../store/clientStore';
import { useFreelancerStore } from '../store/otherStores';
import {
  computeJobFinance,
  formatCurrency,
  formatDate,
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  FREELANCER_MODE_LABELS,
  DELIVERY_TYPE_LABELS,
  CONTRACT_TYPE_LABELS,
} from '../lib/finance';
import PageHeader from '../components/layout/PageHeader';
import JobModal from '../components/modals/JobModal';
import PaymentModal from '../components/modals/PaymentModal';
import FreelancerJobModal from '../components/modals/FreelancerJobModal';
import type { DeliveryType, ContractType } from '../types';
import { useForm } from 'react-hook-form';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getJob = useJobStore((s) => s.getJob);
  const deleteJob = useJobStore((s) => s.deleteJob);
  const payments = useJobStore((s) => s.payments);
  const deletePayment = useJobStore((s) => s.deletePayment);
  const jobFreelancers = useJobStore((s) => s.jobFreelancers);
  const updateJobFreelancer = useJobStore((s) => s.updateJobFreelancer);
  const deleteJobFreelancer = useJobStore((s) => s.deleteJobFreelancer);
  const contracts = useJobStore((s) => s.contracts);
  const addContract = useJobStore((s) => s.addContract);
  const deleteContract = useJobStore((s) => s.deleteContract);
  const deliveries = useJobStore((s) => s.deliveries);
  const addDelivery = useJobStore((s) => s.addDelivery);
  const deleteDelivery = useJobStore((s) => s.deleteDelivery);
  const getClient = useClientStore((s) => s.getClient);
  const getFreelancer = useFreelancerStore((s) => s.getFreelancer);

  const [showEdit, setShowEdit] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showFreelancer, setShowFreelancer] = useState(false);
  const [showAddContract, setShowAddContract] = useState(false);
  const [showAddDelivery, setShowAddDelivery] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const job = getJob(id!);
  if (!job) {
    return (
      <div className="page">
        <PageHeader title="Projeto" back />
        <div className="empty-state"><p>Projeto não encontrado.</p></div>
      </div>
    );
  }

  const client = getClient(job.clientId);
  const summary = computeJobFinance(job, payments, jobFreelancers);
  const jobPayments = payments.filter((p) => p.jobId === job.id)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
  const jobFLs = jobFreelancers.filter((jf) => jf.jobId === job.id);
  const jobContracts = contracts.filter((c) => c.jobId === job.id);
  const jobDeliveries = deliveries.filter((d) => d.jobId === job.id);
  const pct = job.totalValue > 0 ? Math.min((summary.totalPaid / job.totalValue) * 100, 100) : 0;

  const handleDelete = () => {
    deleteJob(job.id);
    navigate('/projetos');
  };

  return (
    <div className="page">
      <PageHeader
        title={job.title}
        back
        right={
          <>
            <button className="btn-icon" onClick={() => setShowEdit(true)}><Edit2 size={18} /></button>
            <button className="btn-icon" onClick={() => setConfirmDelete(true)}><Trash2 size={18} /></button>
          </>
        }
      />

      <div className="page-content">
        {/* STATUS + CLIENT */}
        <div className="section animate-in">
          <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
            <span className={`badge ${JOB_STATUS_COLORS[job.status] ?? 'badge-neutral'}`}>
              {JOB_STATUS_LABELS[job.status]}
            </span>
            {job.location && (
              <span className="text-xs text-muted flex items-center gap-2">
                <MapPin size={12} /> {job.location}
              </span>
            )}
          </div>
          {client && (
            <div
              className="list-item"
              style={{ paddingTop: 0, cursor: 'pointer' }}
              onClick={() => navigate(`/clientes/${client.id}`)}
            >
              <div className="split-avatar" style={{ width: 38, height: 38, fontSize: '0.8rem' }}>
                {client.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="font-semibold" style={{ fontSize: '0.9rem' }}>{client.name}</p>
                {client.company && <p className="text-xs text-muted">{client.company}</p>}
                <p className="text-xs text-muted">{client.phone}</p>
              </div>
              <User size={16} style={{ color: 'var(--charcoal-light)' }} />
            </div>
          )}
          {job.description && (
            <p className="text-sm text-mid" style={{ marginTop: 8, lineHeight: 1.6 }}>{job.description}</p>
          )}
        </div>

        {/* DATES */}
        {(job.meetingDate || job.serviceDate || job.deliveryDeadline) && (
          <div className="section animate-in" style={{ animationDelay: '0.04s' }}>
            <p className="section-title">Datas</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {job.meetingDate && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} style={{ color: 'var(--copper)', flexShrink: 0 }} />
                  <span className="text-sm text-mid">Reunião:</span>
                  <span className="text-sm font-semibold">{formatDate(job.meetingDate)}</span>
                </div>
              )}
              {job.serviceDate && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} style={{ color: 'var(--copper)', flexShrink: 0 }} />
                  <span className="text-sm text-mid">Serviço:</span>
                  <span className="text-sm font-semibold">{formatDate(job.serviceDate)}</span>
                </div>
              )}
              {job.deliveryDeadline && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} style={{ color: 'var(--copper)', flexShrink: 0 }} />
                  <span className="text-sm text-mid">Entrega:</span>
                  <span className="text-sm font-semibold">{formatDate(job.deliveryDeadline)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FINANCEIRO */}
        <div className="section animate-in" style={{ animationDelay: '0.06s' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <p className="section-title" style={{ marginBottom: 0 }}>Financeiro</p>
            <button className="btn btn-sm btn-secondary" onClick={() => setShowPayment(true)}>
              <Plus size={13} /> Pagamento
            </button>
          </div>

          {/* Total */}
          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span className="text-sm font-semibold">Total do projeto</span>
              <span className="font-bold" style={{ fontSize: '1.0625rem' }}>{formatCurrency(job.totalValue)}</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: 6 }}>
              <div className={`progress-fill ${pct >= 100 ? 'progress-success' : 'progress-copper'}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Recebido: {formatCurrency(summary.totalPaid)}</span>
              <span className="text-xs" style={{ color: summary.totalPending > 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>
                {summary.totalPending > 0 ? `Falta: ${formatCurrency(summary.totalPending)}` : '✓ Quitado'}
              </span>
            </div>
          </div>

          {/* Split */}
          {[
            { label: 'Rangel Marques', initials: 'RM', gross: summary.rangelGross, paid: summary.rangelPaid, pending: summary.rangelPending },
            { label: 'Felipe Rodrigues', initials: 'FR', gross: summary.felipeGross, paid: summary.felipePaid, pending: summary.felipePending },
            { label: 'Caixa empresa', initials: '🏦', gross: summary.companyGross, paid: summary.companyPaid, pending: summary.companyPending },
          ].map(({ label, initials, gross, paid, pending }) => (
            gross > 0 && (
              <div key={label} className="split-row">
                <div className="split-avatar" style={{ fontSize: initials.length > 2 ? '1rem' : undefined }}>
                  {initials}
                </div>
                <div className="split-info">
                  <p className="split-name">{label}</p>
                  <div className="progress-bar" style={{ height: 4, marginTop: 4 }}>
                    <div
                      className={`progress-fill ${pending <= 0 ? 'progress-success' : 'progress-copper'}`}
                      style={{ width: `${gross > 0 ? Math.min((paid / gross) * 100, 100) : 0}%` }}
                    />
                  </div>
                  <p className="split-meta" style={{ marginTop: 2 }}>Total: {formatCurrency(gross)}</p>
                </div>
                <div className="split-values">
                  <p className="split-paid" style={{ color: 'var(--success)' }}>{formatCurrency(paid)}</p>
                  <p className="split-pending" style={{ color: pending > 0 ? 'var(--warning)' : 'var(--charcoal-light)' }}>
                    {pending > 0 ? `falta ${formatCurrency(pending)}` : '✓ pago'}
                  </p>
                </div>
              </div>
            )
          ))}

          {/* Freelancer impacts */}
          {(summary.freelancerFromTotal > 0 || summary.freelancerFromCompany > 0) && (
            <>
              <div className="divider" />
              {summary.freelancerFromTotal > 0 && (
                <p className="text-xs text-muted">
                  Freelancers (desc. geral): <strong>{formatCurrency(summary.freelancerFromTotal)}</strong>
                </p>
              )}
              {summary.freelancerFromCompany > 0 && (
                <p className="text-xs text-muted">
                  Freelancers (desc. empresa): <strong>{formatCurrency(summary.freelancerFromCompany)}</strong>
                </p>
              )}
            </>
          )}
        </div>

        {/* PAYMENT HISTORY */}
        {jobPayments.length > 0 && (
          <div className="section animate-in" style={{ animationDelay: '0.08s' }}>
            <p className="section-title">Histórico de pagamentos</p>
            {jobPayments.map((p) => {
              const recipientLabel = p.recipient === 'rangel' ? 'Rangel' : p.recipient === 'felipe' ? 'Felipe' : 'Empresa';
              return (
                <div key={p.id} className="list-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-semibold" style={{ fontSize: '0.875rem' }}>{formatCurrency(p.amount)} → {recipientLabel}</p>
                    <p className="text-xs text-muted">{formatDate(p.date)}{p.note ? ` · ${p.note}` : ''}</p>
                  </div>
                  <button className="btn-icon" onClick={() => deletePayment(p.id)}>
                    <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* FREELANCERS */}
        <div className="section animate-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <p className="section-title" style={{ marginBottom: 0 }}>Freelancers</p>
            <button className="btn btn-sm btn-secondary" onClick={() => setShowFreelancer(true)}>
              <Plus size={13} /> Adicionar
            </button>
          </div>
          {jobFLs.length === 0 ? (
            <p className="text-sm text-muted">Nenhum freelancer neste projeto.</p>
          ) : (
            jobFLs.map((jf) => {
              const fl = getFreelancer(jf.freelancerId);
              return (
                <div key={jf.id} className="list-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-semibold" style={{ fontSize: '0.875rem' }}>{fl?.name ?? 'Freelancer'}</p>
                    <p className="text-xs text-muted">
                      {jf.role && `${jf.role} · `}
                      {formatCurrency(jf.value)} · {FREELANCER_MODE_LABELS[jf.paymentMode]}
                    </p>
                  </div>
                  <button
                    className={`btn btn-sm ${jf.status === 'paid' ? 'btn-secondary' : 'btn-ghost'}`}
                    style={{ marginRight: 4 }}
                    onClick={() => updateJobFreelancer(jf.id, { status: jf.status === 'paid' ? 'pending' : 'paid' })}
                  >
                    {jf.status === 'paid' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                    {jf.status === 'paid' ? 'Pago' : 'Pagar'}
                  </button>
                  <button className="btn-icon" onClick={() => deleteJobFreelancer(jf.id)}>
                    <X size={14} style={{ color: 'var(--danger)' }} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* CONTRACTS */}
        <div className="section animate-in" style={{ animationDelay: '0.12s' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <p className="section-title" style={{ marginBottom: 0 }}>Contratos</p>
            <button className="btn btn-sm btn-secondary" onClick={() => setShowAddContract(true)}>
              <Plus size={13} /> Adicionar
            </button>
          </div>
          {jobContracts.length === 0 ? (
            <p className="text-sm text-muted">Nenhum contrato anexado.</p>
          ) : (
            jobContracts.map((c) => (
              <div key={c.id} className="list-item">
                <FileText size={16} style={{ color: 'var(--copper)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="font-semibold truncate" style={{ fontSize: '0.875rem' }}>{c.label}</p>
                  <p className="text-xs text-muted">{CONTRACT_TYPE_LABELS[c.type]}</p>
                </div>
                <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-icon">
                  <ExternalLink size={14} />
                </a>
                <button className="btn-icon" onClick={() => deleteContract(c.id)}>
                  <X size={14} style={{ color: 'var(--danger)' }} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* DELIVERIES */}
        <div className="section animate-in" style={{ animationDelay: '0.14s' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <p className="section-title" style={{ marginBottom: 0 }}>Links de entrega</p>
            <button className="btn btn-sm btn-secondary" onClick={() => setShowAddDelivery(true)}>
              <Plus size={13} /> Adicionar
            </button>
          </div>
          {jobDeliveries.length === 0 ? (
            <p className="text-sm text-muted">Nenhum link de entrega ainda.</p>
          ) : (
            jobDeliveries.map((d) => (
              <div key={d.id} className="list-item">
                <Link2 size={16} style={{ color: 'var(--copper)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="font-semibold truncate" style={{ fontSize: '0.875rem' }}>{d.label}</p>
                  <p className="text-xs text-muted">{DELIVERY_TYPE_LABELS[d.type]} · {formatDate(d.deliveredAt)}</p>
                </div>
                <a href={d.link} target="_blank" rel="noopener noreferrer" className="btn-icon">
                  <ExternalLink size={14} />
                </a>
                <button className="btn-icon" onClick={() => deleteDelivery(d.id)}>
                  <X size={14} style={{ color: 'var(--danger)' }} />
                </button>
              </div>
            ))
          )}
        </div>

        {job.notes && (
          <div className="section animate-in" style={{ animationDelay: '0.16s' }}>
            <p className="section-title">Notas internas</p>
            <p className="text-sm text-mid" style={{ lineHeight: 1.6 }}>{job.notes}</p>
          </div>
        )}

      </div>

      {/* MODALS */}
      {showEdit && <JobModal job={job} onClose={() => setShowEdit(false)} />}

      {showPayment && (
        <PaymentModal
          jobId={job.id}
          maxRangel={summary.rangelPending}
          maxFelipe={summary.felipePending}
          maxCompany={summary.companyPending}
          onClose={() => setShowPayment(false)}
        />
      )}

      {showFreelancer && <FreelancerJobModal jobId={job.id} onClose={() => setShowFreelancer(false)} />}

      {/* ADD CONTRACT */}
      {showAddContract && (
        <AddLinkModal
          title="Adicionar Contrato"
          labelPlaceholder="Ex: Contrato assinado"
          urlPlaceholder="https://drive.google.com/..."
          typeOptions={Object.entries(CONTRACT_TYPE_LABELS)}
          onClose={() => setShowAddContract(false)}
          onAdd={(label, url, type) =>
            addContract({ jobId: job.id, label, fileUrl: url, type: type as ContractType })
          }
        />
      )}

      {/* ADD DELIVERY */}
      {showAddDelivery && (
        <AddLinkModal
          title="Adicionar Link de Entrega"
          labelPlaceholder="Ex: Fotos do casamento"
          urlPlaceholder="https://drive.google.com/..."
          typeOptions={Object.entries(DELIVERY_TYPE_LABELS)}
          onClose={() => setShowAddDelivery(false)}
          onAdd={(label, url, type) =>
            addDelivery({
              jobId: job.id,
              label,
              link: url,
              type: type as DeliveryType,
              deliveredAt: new Date().toISOString().split('T')[0],
            })
          }
        />
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="modal-sheet animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag" />
            <h2 className="modal-title">Excluir projeto?</h2>
            <p className="text-sm text-mid" style={{ marginBottom: 20 }}>
              Todos os dados deste projeto serão excluídos permanentemente, incluindo pagamentos, freelancers, contratos e links.
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

// ─── HELPER MODAL ────────────────────────────────────────────────────
interface AddLinkModalProps {
  title: string;
  labelPlaceholder: string;
  urlPlaceholder: string;
  typeOptions: [string, string][];
  onClose: () => void;
  onAdd: (label: string, url: string, type: string) => void;
}

function AddLinkModal({ title, labelPlaceholder, urlPlaceholder, typeOptions, onClose, onAdd }: AddLinkModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<{ label: string; url: string; type: string }>({
    defaultValues: { type: typeOptions[0][0] },
  });

  const onSubmit = (d: { label: string; url: string; type: string }) => {
    onAdd(d.label, d.url, d.type);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag" />
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <h2 className="modal-title" style={{ marginBottom: 0 }}>{title}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nome / Descrição *</label>
            <input className={`form-input ${errors.label ? 'form-input-error' : ''}`} placeholder={labelPlaceholder}
              {...register('label', { required: true })} />
          </div>
          <div className="form-group">
            <label className="form-label">Link (URL) *</label>
            <input className={`form-input ${errors.url ? 'form-input-error' : ''}`} placeholder={urlPlaceholder}
              type="url" {...register('url', { required: true })} />
          </div>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-input form-select" {...register('type')}>
              {typeOptions.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 4 }}>Salvar</button>
        </form>
      </div>
    </div>
  );
}
