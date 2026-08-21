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
    try {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) console.error('Supabase fetchClients error:', error);
      if (data) {
        const mapped = data.map((d: any) => ({
          ...d,
          createdAt: d.created_at || new Date().toISOString(),
        }));
        set({ clients: mapped as Client[], loading: false });
      } else {
        set({ loading: false });
      }
    } catch (e) {
      console.error('Network error fetchClients:', e);
      set({ loading: false });
    }
  },
  addClient: async (data) => {
    const tempId = crypto.randomUUID();
    const tempClient: Client = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update - show immediately in UI
    set((s) => ({
      clients: [...s.clients, tempClient].sort((a, b) => a.name.localeCompare(b.name)),
    }));

    try {
      const dbPayload = {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        company: data.company || null,
        notes: data.notes || null,
      };
      const { data: newClient, error } = await supabase.from('clients').insert([dbPayload]).select().single();
      
      if (error) {
        console.error('Supabase addClient error:', error);
      } else if (newClient) {
        set((s) => ({
          clients: s.clients
            .map((c) => (c.id === tempId ? { ...newClient, createdAt: newClient.created_at } as Client : c))
            .sort((a, b) => a.name.localeCompare(b.name)),
        }));
      }
    } catch (e) {
      console.error('Network error addClient:', e);
    }
  },
  updateClient: async (id, data) => {
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...data } : c)) }));
    try {
      const { error } = await supabase.from('clients').update(data).eq('id', id);
      if (error) console.error('Supabase updateClient error:', error);
    } catch (e) {
      console.error('Network error updateClient:', e);
    }
  },
  deleteClient: async (id) => {
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) console.error('Supabase deleteClient error:', error);
    } catch (e) {
      console.error('Network error deleteClient:', e);
    }
  },
  getClient: (id) => get().clients.find((c) => c.id === id),
}));
