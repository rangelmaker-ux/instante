import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useJobStore } from '../../store/jobStore';
import type { Payment, PaymentRecipient } from '../../types';
import { formatCurrency } from '../../lib/finance';

interface Props {
  jobId: string;
  maxRangel: number;
  maxFelipe: number;
  maxCompany: number;
  onClose: () => void;
}

interface FormData {
  amount: string;
  date: string;
  recipient: PaymentRecipient;
  note: string;
}

const RECIPIENT_LABELS: Record<PaymentRecipient, string> = {
  rangel:  '🎬 Rangel Marques',
  felipe:  '📷 Felipe Rodrigues',
  company: '🏦 Caixa da empresa',
};

export default function PaymentModal({ jobId, maxRangel, maxFelipe, maxCompany, onClose }: Props) {
  const addPayment = useJobStore((s) => s.addPayment);
  const overlayRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<FormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      recipient: 'rangel',
    },
  });

  const recipient = watch('recipient') as PaymentRecipient;
  const maxMap: Record<PaymentRecipient, number> = {
    rangel:  maxRangel,
    felipe:  maxFelipe,
    company: maxCompany,
  };
  const maxForRecipient = maxMap[recipient];

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const onSubmit = (data: FormData) => {
    const amount = parseFloat(data.amount);
    if (amount > maxForRecipient + 0.01) {
      setError('amount', {
        message: `Máximo para ${RECIPIENT_LABELS[data.recipient as PaymentRecipient]}: ${formatCurrency(maxForRecipient)}`,
      });
      return;
    }

    addPayment({
      jobId,
      amount,
      date: data.date,
      recipient: data.recipient as PaymentRecipient,
      note: data.note || undefined,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-sheet animate-in">
        <div className="modal-drag" />
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <h2 className="modal-title" style={{ marginBottom: 0 }}>Registrar Pagamento</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Quem recebeu?</label>
            <select className="form-input form-select" {...register('recipient')}>
              {Object.entries(RECIPIENT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {maxForRecipient >= 0 && (
              <span className="form-hint">
                Falta receber: <strong>{formatCurrency(maxForRecipient)}</strong>
              </span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valor (R$) *</label>
              <input
                className={`form-input ${errors.amount ? 'form-input-error' : ''}`}
                placeholder="0,00"
                inputMode="decimal"
                {...register('amount', {
                  required: 'Valor obrigatório',
                  min: { value: 0.01, message: 'Valor inválido' },
                })}
              />
              {errors.amount && <span className="form-error">{errors.amount.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Data *</label>
              <input
                className={`form-input ${errors.date ? 'form-input-error' : ''}`}
                type="date"
                {...register('date', { required: 'Data obrigatória' })}
              />
              {errors.date && <span className="form-error">{errors.date.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observação</label>
            <input
              className="form-input"
              placeholder="Ex: PIX, parcela 1, sinal..."
              {...register('note')}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 4 }}>
            Registrar pagamento
          </button>
        </form>
      </div>
    </div>
  );
}
