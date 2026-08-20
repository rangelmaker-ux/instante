import { useState } from 'react';
import { Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useEquipmentStore } from '../store/otherStores';
import { useJobStore } from '../store/jobStore';
import { useClientStore } from '../store/clientStore';
import { formatCurrency, formatDate, isOverdue } from '../lib/finance';
import PageHeader from '../components/layout/PageHeader';
import { useForm } from 'react-hook-form';
import type { EquipmentRental } from '../types';

interface EquipmentFormData {
  equipmentName: string;
  company: string;
  contact: string;
  rentalValue: string;
  pickupDate: string;
  returnDate: string;
  jobId: string;
  notes: string;
}

export default function EquipmentPage() {
  const rentals = useEquipmentStore((s) => s.rentals);
  const addRental = useEquipmentStore((s) => s.addRental);
  const updateRental = useEquipmentStore((s) => s.updateRental);
  const deleteRental = useEquipmentStore((s) => s.deleteRental);
  const jobs = useJobStore((s) => s.jobs);
  const clients = useClientStore((s) => s.clients);

  const [showModal, setShowModal] = useState(false);
  const [editRental, setEditRental] = useState<EquipmentRental | undefined>();
  const [filter, setFilter] = useState<'all' | 'active' | 'returned' | 'overdue'>('all');

  const filtered = rentals
    .filter((r) => {
      if (filter === 'all') return true;
      if (filter === 'overdue') return isOverdue(r.returnDate) && r.status !== 'returned';
      return r.status === filter;
    })
    .sort((a, b) => (a.returnDate < b.returnDate ? -1 : 1));

  const STATUS_COLORS: Record<string, string> = {
    active:   'badge-copper',
    returned: 'badge-success',
    overdue:  'badge-danger',
  };
  const STATUS_LABELS: Record<string, string> = {
    active:   'Ativo',
    returned: 'Devolvido',
    overdue:  'Atrasado',
  };

  return (
    <div className="page">
      <PageHeader title="Equipamentos" back right={
        <button className="btn btn-primary btn-sm" onClick={() => { setEditRental(undefined); setShowModal(true); }}>
          <Plus size={15} /> Novo
        </button>
      } />

      <div className="filter-row" style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8 }}>
        {[
          { key: 'all', label: 'Todos' },
          { key: 'active', label: 'Ativos' },
          { key: 'overdue', label: 'Atrasados' },
          { key: 'returned', label: 'Devolvidos' },
        ].map(({ key, label }) => (
          <button key={key} className={`chip ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key as typeof filter)}>
            {label}
          </button>
        ))}
      </div>

      <div className="page-content" style={{ paddingTop: 10 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p className="text-sm">Nenhum equipamento encontrado.</p>
            {rentals.length === 0 && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Cadastrar locação
              </button>
            )}
          </div>
        ) : (
          filtered.map((r) => {
            const overdue = isOverdue(r.returnDate) && r.status !== 'returned';
            const status = r.status === 'returned' ? 'returned' : overdue ? 'overdue' : 'active';
            const job = jobs.find((j) => j.id === r.jobId);
            const client = job ? clients.find((c) => c.id === job.clientId) : undefined;
            return (
              <div key={r.id} className="card animate-in">
                <div className="card-row" style={{ marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-semibold truncate" style={{ fontSize: '0.9375rem' }}>{r.equipmentName}</p>
                    <p className="text-xs text-muted">{r.company}</p>
                  </div>
                  <span className={`badge ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                  <div>
                    <p className="text-xs text-muted">Retirada</p>
                    <p className="text-sm font-semibold">{formatDate(r.pickupDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Devolução</p>
                    <p className="text-sm font-semibold" style={{ color: overdue ? 'var(--danger)' : undefined }}>
                      {formatDate(r.returnDate)}
                      {overdue && ' ⚠️'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Valor</p>
                    <p className="text-sm font-semibold">{formatCurrency(r.rentalValue)}</p>
                  </div>
                </div>

                {job && (
                  <p className="text-xs text-muted">Projeto: {job.title}{client ? ` · ${client.name}` : ''}</p>
                )}

                <div className="flex items-center gap-2" style={{ marginTop: 10 }}>
                  {r.status !== 'returned' && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => updateRental(r.id, { status: 'returned' })}
                    >
                      <CheckCircle2 size={13} /> Devolvido
                    </button>
                  )}
                  <button className="btn-icon" onClick={() => { setEditRental(r); setShowModal(true); }}><Edit2 size={16} /></button>
                  <button className="btn-icon" onClick={() => deleteRental(r.id)}><Trash2 size={16} style={{ color: 'var(--danger)' }} /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button className="fab" onClick={() => { setEditRental(undefined); setShowModal(true); }}><Plus size={24} /></button>

      {showModal && (
        <EquipmentModal
          rental={editRental}
          jobs={jobs.map((j) => ({ id: j.id, title: j.title }))}
          onClose={() => { setShowModal(false); setEditRental(undefined); }}
          onSave={(data) => {
            const payload = {
              equipmentName: data.equipmentName,
              company: data.company,
              contact: data.contact,
              rentalValue: parseFloat(data.rentalValue) || 0,
              pickupDate: data.pickupDate,
              returnDate: data.returnDate,
              jobId: data.jobId || undefined,
              status: (editRental?.status ?? 'active') as 'active' | 'returned' | 'overdue',
              notes: data.notes,
            };
            if (editRental) updateRental(editRental.id, payload);
            else addRental(payload);
          }}
        />
      )}
    </div>
  );
}

function EquipmentModal({ rental, jobs, onClose, onSave }: {
  rental?: EquipmentRental;
  jobs: { id: string; title: string }[];
  onClose: () => void;
  onSave: (d: EquipmentFormData) => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<EquipmentFormData>({
    defaultValues: {
      equipmentName: rental?.equipmentName ?? '',
      company: rental?.company ?? '',
      contact: rental?.contact ?? '',
      rentalValue: rental?.rentalValue ? String(rental.rentalValue) : '',
      pickupDate: rental?.pickupDate ?? '',
      returnDate: rental?.returnDate ?? '',
      jobId: rental?.jobId ?? '',
      notes: rental?.notes ?? '',
    },
  });
  const onSubmit = (d: EquipmentFormData) => { onSave(d); onClose(); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag" />
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <h2 className="modal-title" style={{ marginBottom: 0 }}>{rental ? 'Editar Locação' : 'Nova Locação'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Equipamento *</label>
            <input className={`form-input ${errors.equipmentName ? 'form-input-error' : ''}`} placeholder="Ex: DJI Mavic 3 Pro" {...register('equipmentName', { required: true })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Empresa locadora *</label>
              <input className="form-input" placeholder="Nome da empresa" {...register('company', { required: true })} />
            </div>
            <div className="form-group">
              <label className="form-label">Contato</label>
              <input className="form-input" {...register('contact')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valor (R$)</label>
              <input className="form-input" inputMode="decimal" placeholder="0,00" {...register('rentalValue')} />
            </div>
            <div className="form-group">
              <label className="form-label">Projeto vinculado</label>
              <select className="form-input form-select" {...register('jobId')}>
                <option value="">Nenhum</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Retirada *</label>
              <input className="form-input" type="date" {...register('pickupDate', { required: true })} />
            </div>
            <div className="form-group">
              <label className="form-label">Devolução *</label>
              <input className="form-input" type="date" {...register('returnDate', { required: true })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notas</label>
            <input className="form-input" {...register('notes')} />
          </div>
          <button type="submit" className="btn btn-primary btn-full">Salvar</button>
        </form>
      </div>
    </div>
  );
}
