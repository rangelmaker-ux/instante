import { useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useFreelancerStore } from '../store/otherStores';
import { useJobStore } from '../store/jobStore';
import { formatCurrency } from '../lib/finance';
import PageHeader from '../components/layout/PageHeader';
import { useForm } from 'react-hook-form';
import type { Freelancer } from '../types';

interface FreelancerFormData {
  name: string;
  specialty: string;
  phone: string;
  email: string;
  defaultRate: string;
  notes: string;
}

export default function FreelancersPage() {
  const freelancers = useFreelancerStore((s) => s.freelancers);
  const addFreelancer = useFreelancerStore((s) => s.addFreelancer);
  const updateFreelancer = useFreelancerStore((s) => s.updateFreelancer);
  const deleteFreelancer = useFreelancerStore((s) => s.deleteFreelancer);
  const jobFreelancers = useJobStore((s) => s.jobFreelancers);

  const [showModal, setShowModal] = useState(false);
  const [editFL, setEditFL] = useState<Freelancer | undefined>();

  const getJobCount = (id: string) => new Set(jobFreelancers.filter((jf) => jf.freelancerId === id).map((jf) => jf.jobId)).size;
  const getTotalPaid = (id: string) =>
    jobFreelancers.filter((jf) => jf.freelancerId === id && jf.status === 'paid').reduce((s, jf) => s + jf.value, 0);

  return (
    <div className="page">
      <PageHeader title="Freelancers" back right={
        <button className="btn btn-primary btn-sm" onClick={() => { setEditFL(undefined); setShowModal(true); }}>
          <Plus size={15} /> Novo
        </button>
      } />

      <div className="page-content">
        {freelancers.length === 0 ? (
          <div className="empty-state">
            <p className="text-sm">Nenhum freelancer cadastrado.</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Cadastrar
            </button>
          </div>
        ) : (
          freelancers.map((fl) => (
            <div key={fl.id} className="section animate-in" style={{ padding: '14px 16px' }}>
              <div className="flex items-center gap-3">
                <div style={{
                  width: 42, height: 42, borderRadius: 12, background: 'var(--bg-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.9rem', color: 'var(--charcoal-mid)',
                }}>
                  {fl.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="font-semibold" style={{ fontSize: '0.9375rem' }}>{fl.name}</p>
                  <p className="text-xs text-muted">{fl.specialty}</p>
                </div>
                <button className="btn-icon" onClick={() => { setEditFL(fl); setShowModal(true); }}><Edit2 size={16} /></button>
                <button className="btn-icon" onClick={() => deleteFreelancer(fl.id)}><Trash2 size={16} style={{ color: 'var(--danger)' }} /></button>
              </div>
              <div className="divider" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <p className="text-xs text-muted">Projetos</p>
                  <p className="font-semibold">{getJobCount(fl.id)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Total pago</p>
                  <p className="font-semibold text-success">{formatCurrency(getTotalPaid(fl.id))}</p>
                </div>
                {fl.defaultRate && (
                  <div>
                    <p className="text-xs text-muted">Diária ref.</p>
                    <p className="font-semibold">{formatCurrency(fl.defaultRate)}</p>
                  </div>
                )}
              </div>
              {fl.phone && <p className="text-xs text-muted" style={{ marginTop: 8 }}>📱 {fl.phone}</p>}
            </div>
          ))
        )}
      </div>

      <button className="fab" onClick={() => { setEditFL(undefined); setShowModal(true); }}><Plus size={24} /></button>

      {showModal && (
        <FreelancerModal
          fl={editFL}
          onClose={() => { setShowModal(false); setEditFL(undefined); }}
          onSave={(data) => {
            const payload = { name: data.name, specialty: data.specialty, phone: data.phone, email: data.email, defaultRate: parseFloat(data.defaultRate) || undefined, notes: data.notes };
            if (editFL) updateFreelancer(editFL.id, payload);
            else addFreelancer(payload);
          }}
        />
      )}
    </div>
  );
}

function FreelancerModal({ fl, onClose, onSave }: { fl?: Freelancer; onClose: () => void; onSave: (d: FreelancerFormData) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<FreelancerFormData>({
    defaultValues: { name: fl?.name ?? '', specialty: fl?.specialty ?? '', phone: fl?.phone ?? '', email: fl?.email ?? '', defaultRate: fl?.defaultRate ? String(fl.defaultRate) : '', notes: fl?.notes ?? '' },
  });
  const onSubmit = (d: FreelancerFormData) => { onSave(d); onClose(); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag" />
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <h2 className="modal-title" style={{ marginBottom: 0 }}>{fl ? 'Editar Freelancer' : 'Novo Freelancer'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className={`form-input ${errors.name ? 'form-input-error' : ''}`} {...register('name', { required: true })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Especialidade *</label>
              <input className="form-input" placeholder="Ex: Drone, Iluminação" {...register('specialty', { required: true })} />
            </div>
            <div className="form-group">
              <label className="form-label">Diária referência (R$)</label>
              <input className="form-input" inputMode="decimal" placeholder="0,00" {...register('defaultRate')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input className="form-input" type="tel" {...register('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-input" type="email" {...register('email')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notas</label>
            <textarea className="form-input" rows={2} {...register('notes')} />
          </div>
          <button type="submit" className="btn btn-primary btn-full">Salvar</button>
        </form>
      </div>
    </div>
  );
}
