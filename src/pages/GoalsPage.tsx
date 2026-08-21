import { useState } from 'react';
import { Target, Plus } from 'lucide-react';
import { useCRMStore } from '../store/crmStore';
import { formatCurrency } from '../lib/finance';
import type { Goal } from '../types';

export default function GoalsPage() {
  const { goals, addGoal, updateGoal } = useCRMStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | undefined>();
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [revenue, setRevenue] = useState('');
  const [weddings, setWeddings] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editGoal) {
      await updateGoal(editGoal.id, {
        month, year,
        targetRevenue: parseFloat(revenue) || 0,
        targetWeddings: parseInt(weddings) || 0
      });
    } else {
      await addGoal({
        month, year,
        targetRevenue: parseFloat(revenue) || 0,
        targetWeddings: parseInt(weddings) || 0
      });
    }
    setShowModal(false);
  };
  
  const openEdit = (g: Goal) => {
    setEditGoal(g);
    setMonth(g.month);
    setYear(g.year);
    setRevenue(g.targetRevenue.toString());
    setWeddings(g.targetWeddings.toString());
    setShowModal(true);
  };
  
  const openNew = () => {
    setEditGoal(undefined);
    setMonth(new Date().getMonth() + 1);
    setYear(new Date().getFullYear());
    setRevenue('');
    setWeddings('');
    setShowModal(true);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Metas e Objetivos</h1>
      </div>

      <div className="page-content">
        {goals.length === 0 ? (
          <div className="empty-state">
            <Target size={24} color="var(--charcoal-light)" />
            <p className="text-sm mt-2">Nenhuma meta definida.</p>
          </div>
        ) : (
          <div className="desktop-grid flex flex-col gap-3">
            {goals.map((g) => (
              <div key={g.id} className="card animate-in" onClick={() => openEdit(g)}>
                <p className="font-semibold" style={{ fontSize: '1rem', marginBottom: 8 }}>
                  Mês {g.month.toString().padStart(2, '0')}/{g.year}
                </p>
                <div className="split-row" style={{ padding: 0 }}>
                  <div className="split-info">
                    <p className="text-xs text-muted">Meta Faturamento</p>
                    <p className="font-semibold text-copper">{formatCurrency(g.targetRevenue)}</p>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag" />
            <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
              <h2 className="modal-title" style={{ marginBottom: 0 }}>
                {editGoal ? 'Editar Meta' : 'Nova Meta'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Mês</label>
                <input className="form-input" type="number" min={1} max={12} value={month} onChange={(e) => setMonth(parseInt(e.target.value))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Ano</label>
                <input className="form-input" type="number" min={2020} value={year} onChange={(e) => setYear(parseInt(e.target.value))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Meta de Faturamento (R$)</label>
                <input className="form-input" type="number" step="0.01" value={revenue} onChange={(e) => setRevenue(e.target.value)} required />
              </div>
              <div style={{ marginTop: 10 }}>
                <button type="submit" className="btn btn-primary w-full">Salvar Meta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
