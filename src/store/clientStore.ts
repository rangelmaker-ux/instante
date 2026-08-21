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

const CACHE_KEY = 'instante_clients';

const getCachedClients = (): Client[] => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setCachedClients = (clients: Client[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(clients));
  } catch {}
};

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: getCachedClients(),
  loading: false,
  fetchClients: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) console.error('Supabase fetchClients error:', error);
      if (data && data.length > 0) {
        const mapped = data.map((d: any) => ({
          ...d,
          createdAt: d.created_at || new Date().toISOString(),
        }));
        set({ clients: mapped as Client[], loading: false });
        setCachedClients(mapped as Client[]);
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

    // Immediate state + cache update
    set((s) => {
      const updated = [...s.clients, tempClient].sort((a, b) => a.name.localeCompare(b.name));
      setCachedClients(updated);
      return { clients: updated };
    });

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
        set((s) => {
          const updated = s.clients
            .map((c) => (c.id === tempId ? { ...newClient, createdAt: newClient.created_at } as Client : c))
            .sort((a, b) => a.name.localeCompare(b.name));
          setCachedClients(updated);
          return { clients: updated };
        });
      }
    } catch (e) {
      console.error('Network error addClient:', e);
    }
  },
  updateClient: async (id, data) => {
    set((s) => {
      const updated = s.clients.map((c) => (c.id === id ? { ...c, ...data } : c));
      setCachedClients(updated);
      return { clients: updated };
    });
    try {
      const { error } = await supabase.from('clients').update(data).eq('id', id);
      if (error) console.error('Supabase updateClient error:', error);
    } catch (e) {
      console.error('Network error updateClient:', e);
    }
  },
  deleteClient: async (id) => {
    set((s) => {
      const updated = s.clients.filter((c) => c.id !== id);
      setCachedClients(updated);
      return { clients: updated };
    });
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) console.error('Supabase deleteClient error:', error);
    } catch (e) {
      console.error('Network error deleteClient:', e);
    }
  },
  getClient: (id) => get().clients.find((c) => c.id === id),
}));
