import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Video, Plus, Calendar, Clock, Trash } from 'lucide-react';
import { useCRMStore } from '../store/crmStore';
import type { PersonalProduction } from '../types';

const STATUS_COLORS: Record<string, string> = {
  planned: 'var(--charcoal-light)',
  recorded: 'var(--copper-light)',
  edited: 'var(--copper)',
  published: 'var(--success)'
};

const STATUS_LABELS: Record<string, string> = {
  planned: 'Planejado',
  recorded: 'Gravado',
  edited: 'Editado',
  published: 'Publicado'
};

export default function ProductionPage() {
  const { productions, addProduction, updateProduction, deleteProduction } = useCRMStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editProd, setEditProd] = useState<PersonalProduction | undefined>();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recordingDate, setRecordingDate] = useState('');
  const [recordingTime, setRecordingTime] = useState('');
  const [script, setScript] = useState('');
  const [status, setStatus] = useState<PersonalProduction['status']>('planned');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editProd) {
      await updateProduction(editProd.id, {
        title, description, recordingDate, recordingTime, script, status
      });
    } else {
      await addProduction({
        title, description, recordingDate, recordingTime, script, status
      });
    }
    setShowModal(false);
  };
  
  const openEdit = (p: PersonalProduction) => {
    setEditProd(p);
    setTitle(p.title);
    setDescription(p.description || '');
    setRecordingDate(p.recordingDate || '');
    setRecordingTime(p.recordingTime || '');
    setScript(p.script || '');
    setStatus(p.status);
    setShowModal(true);
  };
  
  const openNew = () => {
    setEditProd(undefined);
    setTitle('');
    setDescription('');
    setRecordingDate('');
    setRecordingTime('');
    setScript('');
    setStatus('planned');
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (editProd && window.confirm('Deseja excluir esta produção?')) {
      await deleteProduction(editProd.id);
      setShowModal(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Produção Pessoal</h1>
      </div>

      <div className="page-content">
        {productions.length === 0 ? (
          <div className="empty-state">
            <Video size={24} color="var(--charcoal-light)" />
            <p className="text-sm mt-2">Nenhum vídeo planejado.</p>
          </div>
        ) : (
          <div className="desktop-grid flex flex-col gap-3">
            {productions.map((p) => (
              <div key={p.id} className="card animate-in" onClick={() => openEdit(p)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <p className="font-semibold" style={{ fontSize: '0.95rem' }}>{p.title}</p>
                  <span className="badge" style={{ background: STATUS_COLORS[p.status] || '#eee', color: '#fff', fontSize: '0.65rem' }}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </div>
                
                <p className="text-xs text-muted truncate" style={{ marginBottom: 12 }}>
                  {p.description || 'Sem descrição'}
                </p>
                
                <div className="split-row" style={{ padding: 0 }}>
                  <div className="split-info" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {p.recordingDate && (
                      <span className="text-xs text-muted flex items-center gap-1">
                        <Calendar size={12} /> {new Date(p.recordingDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {p.recordingTime && (
                      <span className="text-xs text-muted flex items-center gap-1">
                        <Clock size={12} /> {p.recordingTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={openNew}>
        <Plus size={24} />
      </button>

      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet animate-in" onClick={(e) => e.stopPropagation()} style={{ overflowY: 'auto' }}>
            <div className="modal-drag" />
            <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
              <h2 className="modal-title" style={{ marginBottom: 0 }}>{editProd ? 'Editar Produção' : 'Novo Vídeo'}</h2>
              <div className="flex gap-2">
                {editProd && (
                  <button className="btn-icon" onClick={handleDelete} style={{ color: 'var(--danger)' }}>
                    <Trash size={18} />
                  </button>
                )}
              </div>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Título / Assunto</label>
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              
              <div className="split-row" style={{ padding: 0, gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Data Gravação</label>
                  <input className="form-input" type="date" value={recordingDate} onChange={(e) => setRecordingDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Horário</label>
                  <input className="form-input" type="time" value={recordingTime} onChange={(e) => setRecordingTime(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="planned">Planejado</option>
                  <option value="recorded">Gravado</option>
                  <option value="edited">Editado</option>
                  <option value="published">Publicado</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Roteiro / Script</label>
                <textarea
                  className="form-input"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  rows={6}
                  placeholder="Escreva seu roteiro aqui..."
                />
              </div>
              
              <div style={{ marginTop: 10 }}>
                <button type="submit" className="btn btn-primary w-full">Salvar Produção</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
