import { create } from 'zustand';
import type { Client } from '../types';
import { supabase } from '../lib/supabase';

interface ClientStore {
  clients: Client[];
  loading: boolean;
  fetchClients: () => Promise<void>;
  addClient: (c: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClient: (id: string) => Client | undefined;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  loading: false,
  fetchClients: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (!error && data) {
      const mapped = data.map((d: any) => ({
        ...d,
        createdAt: d.created_at,
      }));
      set({ clients: mapped as Client[], loading: false });
    } else {
      set({ loading: false });
    }
  },
  addClient: async (data) => {
    const { data: newClient, error } = await supabase.from('clients').insert([data]).select().single();
    if (!error && newClient) {
      set((s) => ({ 
        clients: [...s.clients, { ...newClient, createdAt: newClient.created_at } as Client].sort((a, b) => a.name.localeCompare(b.name)) 
      }));
    }
  },
  updateClient: async (id, data) => {
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...data } : c)) }));
    await supabase.from('clients').update(data).eq('id', id);
  },
  deleteClient: async (id) => {
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
    await supabase.from('clients').delete().eq('id', id);
  },
  getClient: (id) => get().clients.find((c) => c.id === id),
}));
