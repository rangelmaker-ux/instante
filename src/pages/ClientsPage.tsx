import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronRight } from 'lucide-react';
import { useClientStore } from '../store/clientStore';
import { useJobStore } from '../store/jobStore';
import ClientModal from '../components/modals/ClientModal';
import type { Client } from '../types';

export default function ClientsPage() {
  const navigate = useNavigate();
  const clients = useClientStore((s) => s.clients);
  const jobs = useJobStore((s) => s.jobs);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState<Client | undefined>();

  const filtered = clients
    .filter((c) => {
      if (!search) return true;
      return `${c.name} ${c.company ?? ''} ${c.phone}`.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const getJobCount = (clientId: string) =>
    jobs.filter((j) => j.clientId === clientId).length;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditClient(undefined); setShowModal(true); }}>
          <Plus size={15} /> Novo
        </button>
      </div>

      <div className="search-bar">
        <Search size={16} style={{ color: 'var(--charcoal-light)', flexShrink: 0 }} />
        <input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="page-content" style={{ paddingTop: 8 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p className="text-sm">Nenhum cliente encontrado.</p>
            {clients.length === 0 && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Cadastrar cliente
              </button>
            )}
          </div>
        ) : (
          filtered.map((client) => {
            const jobCount = getJobCount(client.id);
            return (
              <div
                key={client.id}
                className="card animate-in"
                onClick={() => navigate(`/clientes/${client.id}`)}
              >
                <div className="card-row">
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: 'var(--copper-pale)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: 'var(--copper-dark)',
                      flexShrink: 0,
                    }}
                  >
                    {client.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-semibold truncate" style={{ fontSize: '0.9375rem' }}>{client.name}</p>
                    {client.company && <p className="text-xs text-muted truncate">{client.company}</p>}
                    <p className="text-xs text-muted">{client.phone}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {jobCount > 0 && (
                      <span className="badge badge-copper">{jobCount} projeto{jobCount > 1 ? 's' : ''}</span>
                    )}
                    <ChevronRight size={16} style={{ color: 'var(--charcoal-light)' }} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button
        className="fab"
        onClick={() => { setEditClient(undefined); setShowModal(true); }}
        aria-label="Novo cliente"
      >
        <Plus size={24} />
      </button>

      {showModal && (
        <ClientModal
          client={editClient}
          onClose={() => { setShowModal(false); setEditClient(undefined); }}
        />
      )}
    </div>
  );
}
