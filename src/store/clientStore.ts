import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client } from '../types';

interface ClientStore {
  clients: Client[];
  addClient: (c: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useClientStore = create<ClientStore>()(
  persist(
    (set, get) => ({
      clients: [],
      addClient: (data) =>
        set((s) => ({
          clients: [
            ...s.clients,
            { ...data, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateClient: (id, data) =>
        set((s) => ({
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      deleteClient: (id) =>
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),
      getClient: (id) => get().clients.find((c) => c.id === id),
    }),
    { name: 'instante-clients' }
  )
);
