import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useJobStore } from '../../store/jobStore';
import { useFreelancerStore } from '../../store/otherStores';
import type { FreelancerPaymentMode } from '../../types';
import { FREELANCER_MODE_LABELS } from '../../lib/finance';

interface Props {
  jobId: string;
  onClose: () => void;
}

interface FormData {
  freelancerId: string;
  role: string;
  value: string;
  paymentMode: FreelancerPaymentMode;
  notes: string;
}

export default function FreelancerJobModal({ jobId, onClose }: Props) {
  const addJobFreelancer = useJobStore((s) => s.addJobFreelancer);
  const freelancers = useFreelancerStore((s) => s.freelancers);
  const overlayRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { paymentMode: 'from_company' },
  });

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const onSubmit = (data: FormData) => {
    addJobFreelancer({
      jobId,
      freelancerId: data.freelancerId,
      role:         data.role      || undefined,
      value:        parseFloat(data.value) || 0,
      paymentMode:  data.paymentMode,
      status:       'pending',
      notes:        data.notes || undefined,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-sheet animate-in">
        <div className="modal-drag" />
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <h2 className="modal-title" style={{ marginBottom: 0 }}>Adicionar Freelancer</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {freelancers.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum freelancer cadastrado.</p>
            <p className="text-sm">Cadastre na aba Mais → Freelancers.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Freelancer *</label>
              <select
                className={`form-input form-select ${errors.freelancerId ? 'form-input-error' : ''}`}
                {...register('freelancerId', { required: 'Selecione um freelancer' })}
              >
                <option value="">Selecionar...</option>
                {freelancers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.specialty}
                  </option>
                ))}
              </select>
              {errors.freelancerId && <span className="form-error">{errors.freelancerId.message}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Função no projeto</label>
                <input className="form-input" placeholder="Ex: Drone pilot" {...register('role')} />
              </div>
              <div className="form-group">
                <label className="form-label">Valor (R$) *</label>
                <input
                  className={`form-input ${errors.value ? 'form-input-error' : ''}`}
                  placeholder="0,00"
                  inputMode="decimal"
                  {...register('value', { required: 'Valor obrigatório' })}
                />
                {errors.value && <span className="form-error">{errors.value.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Como será pago?</label>
              <select className="form-input form-select" {...register('paymentMode')}>
                {Object.entries(FREELANCER_MODE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <span className="form-hint">
                "Desconta do caixa" reduz o valor da empresa. "Desconta do valor geral" sai antes do split. "Por fora" é só registro.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Observações</label>
              <input className="form-input" placeholder="Combinados, detalhes..." {...register('notes')} />
            </div>

            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 4 }}>
              Adicionar ao projeto
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
