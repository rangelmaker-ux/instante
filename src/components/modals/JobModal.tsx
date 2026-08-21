import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, AlertCircle } from 'lucide-react';
import { useJobStore } from '../../store/jobStore';
import { useClientStore } from '../../store/clientStore';
import type { Job, JobStatus } from '../../types';
import { JOB_STATUS_LABELS } from '../../lib/finance';

interface Props {
  job?: Job;
  preselectedClientId?: string;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

interface FormData {
  clientId: string;
  title: string;
  description: string;
  status: JobStatus;
  totalValue: string;
  rangelValue: string;
  felipeValue: string;
  companyValue: string;
  meetingDate: string;
  serviceDate: string;
  deliveryDeadline: string;
  location: string;
  notes: string;
}

export default function JobModal({ job, preselectedClientId, onClose, onCreated }: Props) {
  const addJob = useJobStore((s) => s.addJob);
  const updateJob = useJobStore((s) => s.updateJob);
  const clients = useClientStore((s) => s.clients);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [splitError, setSplitError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      clientId:        job?.clientId        ?? preselectedClientId ?? '',
      title:           job?.title           ?? '',
      description:     job?.description     ?? '',
      status:          job?.status          ?? 'confirmed',
      totalValue:      job?.totalValue      ? String(job.totalValue)      : '',
      rangelValue:     job?.rangelValue     ? String(job.rangelValue)     : '',
      felipeValue:     job?.felipeValue     ? String(job.felipeValue)     : '',
      companyValue:    job?.companyValue    ? String(job.companyValue)    : '',
      meetingDate:     job?.meetingDate     ?? '',
      serviceDate:     job?.serviceDate     ?? '',
      deliveryDeadline:job?.deliveryDeadline?? '',
      location:        job?.location        ?? '',
      notes:           job?.notes           ?? '',
    },
  });

  const watchedTotal   = parseFloat(watch('totalValue')   || '0');
  const watchedRangel  = parseFloat(watch('rangelValue')  || '0');
  const watchedFelipe  = parseFloat(watch('felipeValue')  || '0');
  const watchedCompany = parseFloat(watch('companyValue') || '0');
  const splitSum = watchedRangel + watchedFelipe + watchedCompany;
  const splitDiff = Math.abs(watchedTotal - splitSum);

  useEffect(() => {
    if (watchedTotal > 0 && splitSum > 0) {
      if (splitDiff > 0.01) {
        setSplitError(
          `A soma dos valores (R$ ${splitSum.toFixed(2).replace('.', ',')}) não bate com o total (R$ ${watchedTotal.toFixed(2).replace('.', ',')}). Diferença: R$ ${splitDiff.toFixed(2).replace('.', ',')}`
        );
      } else {
        setSplitError('');
      }
    } else {
      setSplitError('');
    }
  }, [watchedTotal, splitSum, splitDiff]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const onSubmit = async (data: FormData) => {
    if (splitDiff > 0.01 && watchedTotal > 0 && splitSum > 0) return;

    const payload = {
      clientId:         data.clientId,
      title:            data.title,
      description:      data.description,
      status:           data.status,
      totalValue:       parseFloat(data.totalValue)   || 0,
      rangelValue:      parseFloat(data.rangelValue)  || 0,
      felipeValue:      parseFloat(data.felipeValue)  || 0,
      companyValue:     parseFloat(data.companyValue) || 0,
      meetingDate:      data.meetingDate      || undefined,
      serviceDate:      data.serviceDate      || undefined,
      deliveryDeadline: data.deliveryDeadline || undefined,
      location:         data.location        || undefined,
      notes:            data.notes           || undefined,
    };

    if (job) {
      await updateJob(job.id, payload);
      onClose();
    } else {
      const id = await addJob(payload);
      onClose();
      if (id) onCreated?.(id);
    }
  };

  const modalContent = (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-sheet animate-in">
        <div className="modal-drag" />
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <h2 className="modal-title" style={{ marginBottom: 0 }}>
            {job ? 'Editar Projeto' : 'Novo Projeto'}
          </h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* CLIENT */}
          <div className="form-group">
            <label className="form-label">Cliente *</label>
            <select
              className={`form-input form-select ${errors.clientId ? 'form-input-error' : ''}`}
              {...register('clientId', { required: 'Selecione um cliente' })}
            >
              <option value="">Selecionar cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
              ))}
            </select>
            {errors.clientId && <span className="form-error">{errors.clientId.message}</span>}
            {clients.length === 0 && (
              <span className="form-hint">Cadastre um cliente primeiro na aba Clientes.</span>
            )}
          </div>

          {/* TITLE + STATUS */}
          <div className="form-group">
            <label className="form-label">Título do serviço *</label>
            <input
              className={`form-input ${errors.title ? 'form-input-error' : ''}`}
              placeholder="Ex: Ensaio fotográfico corporativo"
              {...register('title', { required: 'Título obrigatório' })}
            />
            {errors.title && <span className="form-error">{errors.title.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input form-select" {...register('status')}>
                {Object.entries(JOB_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Local</label>
              <input className="form-input" placeholder="Cidade / endereço" {...register('location')} />
            </div>
          </div>

          {/* ── FINANCEIRO ── */}
          <div style={{ marginTop: 4 }}>
            <p className="section-title" style={{ marginBottom: 10 }}>💰 Financeiro</p>

            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label">Valor total do serviço (R$) *</label>
              <input
                className={`form-input ${errors.totalValue ? 'form-input-error' : ''}`}
                placeholder="0,00"
                inputMode="decimal"
                {...register('totalValue', {
                  required: 'Valor total obrigatório',
                  min: { value: 0.01, message: 'Deve ser maior que zero' },
                })}
              />
              {errors.totalValue && <span className="form-error">{errors.totalValue.message}</span>}
            </div>

            <p className="form-hint" style={{ marginBottom: 8 }}>
              Defina o valor exato para cada parte (soma deve bater com o total):
            </p>

            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label">🎬 Rangel Marques (R$)</label>
              <input
                className="form-input"
                placeholder="0,00"
                inputMode="decimal"
                {...register('rangelValue')}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label">📷 Felipe Rodrigues (R$)</label>
              <input
                className="form-input"
                placeholder="0,00"
                inputMode="decimal"
                {...register('felipeValue')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">🏦 Caixa da empresa (R$)</label>
              <input
                className="form-input"
                placeholder="0,00"
                inputMode="decimal"
                {...register('companyValue')}
              />
            </div>

            {splitError && (
              <div className="alert alert-danger" style={{ marginTop: 10 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{splitError}</span>
              </div>
            )}
          </div>

          {/* ── DATAS ── */}
          <div style={{ marginTop: 4 }}>
            <p className="section-title" style={{ marginBottom: 10 }}>📅 Datas</p>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label">Reunião / Briefing</label>
              <input className="form-input" type="date" {...register('meetingDate')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Data do serviço</label>
                <input className="form-input" type="date" {...register('serviceDate')} />
              </div>
              <div className="form-group">
                <label className="form-label">Prazo de entrega</label>
                <input className="form-input" type="date" {...register('deliveryDeadline')} />
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="form-group">
            <label className="form-label">Descrição / briefing</label>
            <textarea
              className="form-input"
              placeholder="Detalhes do serviço, demandas do cliente..."
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notas internas</label>
            <textarea
              className="form-input"
              placeholder="Notas privadas sobre o projeto..."
              rows={2}
              {...register('notes')}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: 4 }}
            disabled={!!(splitDiff > 0.01 && watchedTotal > 0 && splitSum > 0)}
          >
            {job ? 'Salvar alterações' : 'Criar projeto'}
          </button>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? (require('react-dom').createPortal(modalContent, document.body)) : modalContent;
}
