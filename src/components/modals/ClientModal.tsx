import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useClientStore } from '../../store/clientStore';
import type { Client } from '../../types';

interface Props {
  client?: Client;
  onClose: () => void;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  company: string;
  notes: string;
}

export default function ClientModal({ client, onClose }: Props) {
  const addClient = useClientStore((s) => s.addClient);
  const updateClient = useClientStore((s) => s.updateClient);
  const overlayRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name:    client?.name    ?? '',
      phone:   client?.phone   ?? '',
      email:   client?.email   ?? '',
      company: client?.company ?? '',
      notes:   client?.notes   ?? '',
    },
  });

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const onSubmit = (data: FormData) => {
    if (client) {
      updateClient(client.id, data);
    } else {
      addClient(data);
    }
    onClose();
  };

  const modalContent = (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-sheet animate-in">
        <div className="modal-drag" />
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <h2 className="modal-title" style={{ marginBottom: 0 }}>
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input
              className={`form-input ${errors.name ? 'form-input-error' : ''}`}
              placeholder="Nome completo ou empresa"
              {...register('name', { required: 'Nome obrigatório' })}
            />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp / Telefone *</label>
            <input
              className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
              placeholder="(00) 00000-0000"
              type="tel"
              {...register('phone', { required: 'Telefone obrigatório' })}
            />
            {errors.phone && <span className="form-error">{errors.phone.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                className="form-input"
                placeholder="email@exemplo.com"
                type="email"
                {...register('email')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Empresa</label>
              <input
                className="form-input"
                placeholder="Nome da empresa"
                {...register('company')}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea
              className="form-input"
              placeholder="Informações relevantes sobre o cliente..."
              rows={3}
              {...register('notes')}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 4 }}>
            {client ? 'Salvar alterações' : 'Cadastrar cliente'}
          </button>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? (require('react-dom').createPortal(modalContent, document.body)) : modalContent;
}
