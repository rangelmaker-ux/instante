import { create } from 'zustand';
import type { Goal, PersonalProduction } from '../types';
import { supabase } from '../lib/supabase';

interface CRMStore {
  goals: Goal[];
  productions: PersonalProduction[];
  loading: boolean;
  
  fetchCRM: () => Promise<void>;
  
  addGoal: (g: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  
  addProduction: (p: Omit<PersonalProduction, 'id' | 'createdAt'>) => Promise<void>;
  updateProduction: (id: string, data: Partial<PersonalProduction>) => Promise<void>;
  deleteProduction: (id: string) => Promise<void>;
}

const GOALS_CACHE_KEY = 'instante_goals';
const PROD_CACHE_KEY = 'instante_productions';

const getCachedGoals = (): Goal[] => {
  try { const raw = localStorage.getItem(GOALS_CACHE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
};
const setCachedGoals = (data: Goal[]) => {
  try { localStorage.setItem(GOALS_CACHE_KEY, JSON.stringify(data)); } catch {}
};

const getCachedProds = (): PersonalProduction[] => {
  try { const raw = localStorage.getItem(PROD_CACHE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
};
const setCachedProds = (data: PersonalProduction[]) => {
  try { localStorage.setItem(PROD_CACHE_KEY, JSON.stringify(data)); } catch {}
};

export const useCRMStore = create<CRMStore>((set) => ({
  goals: getCachedGoals(),
  productions: getCachedProds(),
  loading: false,
  
  fetchCRM: async () => {
    set({ loading: true });
    try {
      const [goalsRes, prodRes] = await Promise.all([
        supabase.from('goals').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
        supabase.from('personal_production').select('*').order('recording_date', { ascending: true })
      ]);
      
      const mappedGoals = (goalsRes.data || []).map(d => ({
        id: d.id, month: d.month, year: d.year, 
        targetRevenue: d.target_revenue, targetWeddings: d.target_weddings,
        createdAt: d.created_at
      }));
      const mappedProds = (prodRes.data || []).map(d => ({
        id: d.id, title: d.title, description: d.description,
        recordingDate: d.recording_date, recordingTime: d.recording_time,
        script: d.script, status: d.status,
        createdAt: d.created_at
      }));

      if (mappedGoals.length > 0) { set({ goals: mappedGoals }); setCachedGoals(mappedGoals); }
      if (mappedProds.length > 0) { set({ productions: mappedProds }); setCachedProds(mappedProds); }
      set({ loading: false });
    } catch (e) {
      console.error('Network error fetchCRM:', e);
      set({ loading: false });
    }
  },
  
  addGoal: async (data) => {
    const tempId = crypto.randomUUID();
    const tempGoal: Goal = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    set((s) => {
      const updated = [tempGoal, ...s.goals];
      setCachedGoals(updated);
      return { goals: updated };
    });

    try {
      const payload = {
        month: data.month,
        year: data.year,
        target_revenue: data.targetRevenue,
        target_weddings: data.targetWeddings,
      };
      const { data: newGoal, error } = await supabase.from('goals').insert([payload]).select().single();
      if (error) {
        console.error('Supabase addGoal error:', error);
      } else if (newGoal) {
        set((s) => {
          const updated = s.goals.map((g) => (g.id === tempId ? { ...data, id: newGoal.id, createdAt: newGoal.created_at } : g));
          setCachedGoals(updated);
          return { goals: updated };
        });
      }
    } catch (e) {
      console.error('Network error addGoal:', e);
    }
  },
  updateGoal: async (id, data) => {
    set((s) => {
      const updated = s.goals.map((g) => (g.id === id ? { ...g, ...data } : g));
      setCachedGoals(updated);
      return { goals: updated };
    });
    try {
      const payload: any = {};
      if (data.month !== undefined) payload.month = data.month;
      if (data.year !== undefined) payload.year = data.year;
      if (data.targetRevenue !== undefined) payload.target_revenue = data.targetRevenue;
      if (data.targetWeddings !== undefined) payload.target_weddings = data.targetWeddings;
      const { error } = await supabase.from('goals').update(payload).eq('id', id);
      if (error) console.error('Supabase updateGoal error:', error);
    } catch (e) {
      console.error('Network error updateGoal:', e);
    }
  },
  
  addProduction: async (data) => {
    const tempId = crypto.randomUUID();
    const tempProd: PersonalProduction = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    set((s) => {
      const updated = [...s.productions, tempProd];
      setCachedProds(updated);
      return { productions: updated };
    });

    try {
      const payload = {
        title: data.title,
        description: data.description || null,
        recording_date: data.recordingDate || null,
        recording_time: data.recordingTime || null,
        script: data.script || null,
        status: data.status,
      };
      const { data: newProd, error } = await supabase.from('personal_production').insert([payload]).select().single();
      if (error) {
        console.error('Supabase addProduction error:', error);
      } else if (newProd) {
        set((s) => {
          const updated = s.productions.map((p) => (p.id === tempId ? { ...data, id: newProd.id, createdAt: newProd.created_at } : p));
          setCachedProds(updated);
          return { productions: updated };
        });
      }
    } catch (e) {
      console.error('Network error addProduction:', e);
    }
  },
  updateProduction: async (id, data) => {
    set((s) => {
      const updated = s.productions.map((p) => (p.id === id ? { ...p, ...data } : p));
      setCachedProds(updated);
      return { productions: updated };
    });
    try {
      const payload: any = { ...data };
      if (data.recordingDate !== undefined) { payload.recording_date = data.recordingDate; delete payload.recordingDate; }
      if (data.recordingTime !== undefined) { payload.recording_time = data.recordingTime; delete payload.recordingTime; }
      const { error } = await supabase.from('personal_production').update(payload).eq('id', id);
      if (error) console.error('Supabase updateProduction error:', error);
    } catch (e) {
      console.error('Network error updateProduction:', e);
    }
  },
  deleteProduction: async (id) => {
    set((s) => {
      const updated = s.productions.filter((p) => p.id !== id);
      setCachedProds(updated);
      return { productions: updated };
    });
    try {
      const { error } = await supabase.from('personal_production').delete().eq('id', id);
      if (error) console.error('Supabase deleteProduction error:', error);
    } catch (e) {
      console.error('Network error deleteProduction:', e);
    }
  }
}));
