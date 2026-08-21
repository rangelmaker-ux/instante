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

export const useCRMStore = create<CRMStore>((set) => ({
  goals: [],
  productions: [],
  loading: false,
  
  fetchCRM: async () => {
    set({ loading: true });
    const [goalsRes, prodRes] = await Promise.all([
      supabase.from('goals').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
      supabase.from('personal_production').select('*').order('recording_date', { ascending: true })
    ]);
    
    set({
      goals: (goalsRes.data || []).map(d => ({
        id: d.id, month: d.month, year: d.year, 
        targetRevenue: d.target_revenue, targetWeddings: d.target_weddings,
        createdAt: d.created_at
      })),
      productions: (prodRes.data || []).map(d => ({
        id: d.id, title: d.title, description: d.description,
        recordingDate: d.recording_date, recordingTime: d.recording_time,
        script: d.script, status: d.status,
        createdAt: d.created_at
      })),
      loading: false
    });
  },
  
  addGoal: async (data) => {
    const payload = {
      month: data.month, year: data.year,
      target_revenue: data.targetRevenue, target_weddings: data.targetWeddings
    };
    const { data: newGoal } = await supabase.from('goals').insert([payload]).select().single();
    if (newGoal) {
      set(s => ({ goals: [{ ...data, id: newGoal.id, createdAt: newGoal.created_at }, ...s.goals] }));
    }
  },
  updateGoal: async (id, data) => {
    set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...data } : g) }));
    const payload: any = {};
    if (data.month !== undefined) payload.month = data.month;
    if (data.year !== undefined) payload.year = data.year;
    if (data.targetRevenue !== undefined) payload.target_revenue = data.targetRevenue;
    if (data.targetWeddings !== undefined) payload.target_weddings = data.targetWeddings;
    await supabase.from('goals').update(payload).eq('id', id);
  },
  
  addProduction: async (data) => {
    const payload = {
      title: data.title, description: data.description,
      recording_date: data.recordingDate, recording_time: data.recordingTime,
      script: data.script, status: data.status
    };
    const { data: newProd } = await supabase.from('personal_production').insert([payload]).select().single();
    if (newProd) {
      set(s => ({ productions: [...s.productions, { ...data, id: newProd.id, createdAt: newProd.created_at }] }));
    }
  },
  updateProduction: async (id, data) => {
    set(s => ({ productions: s.productions.map(p => p.id === id ? { ...p, ...data } : p) }));
    const payload: any = { ...data };
    if (data.recordingDate !== undefined) { payload.recording_date = data.recordingDate; delete payload.recordingDate; }
    if (data.recordingTime !== undefined) { payload.recording_time = data.recordingTime; delete payload.recordingTime; }
    await supabase.from('personal_production').update(payload).eq('id', id);
  },
  deleteProduction: async (id) => {
    set(s => ({ productions: s.productions.filter(p => p.id !== id) }));
    await supabase.from('personal_production').delete().eq('id', id);
  }
}));
