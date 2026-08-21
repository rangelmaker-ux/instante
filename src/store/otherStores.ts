import { create } from 'zustand';
import type { Freelancer, EquipmentRental } from '../types';
import { supabase } from '../lib/supabase';

interface FreelancerStore {
  freelancers: Freelancer[];
  loading: boolean;
  fetchFreelancers: () => Promise<void>;
  addFreelancer: (f: Omit<Freelancer, 'id' | 'createdAt'>) => Promise<void>;
  updateFreelancer: (id: string, data: Partial<Freelancer>) => Promise<void>;
  deleteFreelancer: (id: string) => Promise<void>;
  getFreelancer: (id: string) => Freelancer | undefined;
}

interface EquipmentStore {
  rentals: EquipmentRental[];
  loading: boolean;
  fetchRentals: () => Promise<void>;
  addRental: (r: Omit<EquipmentRental, 'id' | 'createdAt'>) => Promise<void>;
  updateRental: (id: string, data: Partial<EquipmentRental>) => Promise<void>;
  deleteRental: (id: string) => Promise<void>;
}

// Helpers
const mapFreelancerFromDB = (d: any): Freelancer => ({
  id: d.id,
  name: d.name,
  specialty: d.specialty,
  phone: d.phone,
  email: d.email,
  defaultRate: Number(d.default_rate),
  notes: d.notes,
  createdAt: d.created_at,
});
const mapFreelancerToDB = (f: Partial<Freelancer>) => ({
  name: f.name,
  specialty: f.specialty,
  phone: f.phone,
  email: f.email,
  default_rate: f.defaultRate,
  notes: f.notes,
});

const mapRentalFromDB = (d: any): EquipmentRental => ({
  id: d.id,
  jobId: d.job_id,
  equipmentName: d.equipment_name,
  company: d.company,
  contact: d.contact,
  rentalValue: Number(d.rental_value),
  pickupDate: d.pickup_date,
  returnDate: d.return_date,
  status: d.status,
  notes: d.notes,
  createdAt: d.created_at,
});
const mapRentalToDB = (r: Partial<EquipmentRental>) => ({
  job_id: r.jobId,
  equipment_name: r.equipmentName,
  company: r.company,
  contact: r.contact,
  rental_value: r.rentalValue,
  pickup_date: r.pickupDate,
  return_date: r.returnDate,
  status: r.status,
  notes: r.notes,
});

const FL_CACHE_KEY = 'instante_freelancers';
const EQ_CACHE_KEY = 'instante_equipment';

const getCachedFreelancers = (): Freelancer[] => {
  try { const raw = localStorage.getItem(FL_CACHE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
};
const setCachedFreelancers = (data: Freelancer[]) => {
  try { localStorage.setItem(FL_CACHE_KEY, JSON.stringify(data)); } catch {}
};

const getCachedRentals = (): EquipmentRental[] => {
  try { const raw = localStorage.getItem(EQ_CACHE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
};
const setCachedRentals = (data: EquipmentRental[]) => {
  try { localStorage.setItem(EQ_CACHE_KEY, JSON.stringify(data)); } catch {}
};

export const useFreelancerStore = create<FreelancerStore>((set, get) => ({
  freelancers: getCachedFreelancers(),
  loading: false,

  fetchFreelancers: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.from('freelancers').select('*').order('name');
      if (error) console.error('Supabase fetchFreelancers error:', error);
      if (data && data.length > 0) {
        const mapped = data.map(mapFreelancerFromDB);
        set({ freelancers: mapped, loading: false });
        setCachedFreelancers(mapped);
      } else {
        set({ loading: false });
      }
    } catch (e) {
      console.error('Network error fetchFreelancers:', e);
      set({ loading: false });
    }
  },
  addFreelancer: async (data) => {
    const tempId = crypto.randomUUID();
    const tempFreelancer: Freelancer = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    set((s) => {
      const updated = [...s.freelancers, tempFreelancer].sort((a, b) => a.name.localeCompare(b.name));
      setCachedFreelancers(updated);
      return { freelancers: updated };
    });

    try {
      const { data: newRow, error } = await supabase.from('freelancers').insert([mapFreelancerToDB(data)]).select().single();
      if (error) {
        console.error('Supabase addFreelancer error:', error);
      } else if (newRow) {
        set((s) => {
          const updated = s.freelancers
            .map((f) => (f.id === tempId ? mapFreelancerFromDB(newRow) : f))
            .sort((a, b) => a.name.localeCompare(b.name));
          setCachedFreelancers(updated);
          return { freelancers: updated };
        });
      }
    } catch (e) {
      console.error('Network error addFreelancer:', e);
    }
  },
  updateFreelancer: async (id, data) => {
    set((s) => {
      const updated = s.freelancers.map((f) => (f.id === id ? { ...f, ...data } : f));
      setCachedFreelancers(updated);
      return { freelancers: updated };
    });
    try {
      const { error } = await supabase.from('freelancers').update(mapFreelancerToDB(data)).eq('id', id);
      if (error) console.error('Supabase updateFreelancer error:', error);
    } catch (e) {
      console.error('Network error updateFreelancer:', e);
    }
  },
  deleteFreelancer: async (id) => {
    set((s) => {
      const updated = s.freelancers.filter((f) => f.id !== id);
      setCachedFreelancers(updated);
      return { freelancers: updated };
    });
    try {
      const { error } = await supabase.from('freelancers').delete().eq('id', id);
      if (error) console.error('Supabase deleteFreelancer error:', error);
    } catch (e) {
      console.error('Network error deleteFreelancer:', e);
    }
  },
  getFreelancer: (id) => get().freelancers.find((f) => f.id === id),
}));

export const useEquipmentStore = create<EquipmentStore>((set) => ({
  rentals: getCachedRentals(),
  loading: false,

  fetchRentals: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.from('equipment_rentals').select('*');
      if (error) console.error('Supabase fetchRentals error:', error);
      if (data && data.length > 0) {
        const mapped = data.map(mapRentalFromDB);
        set({ rentals: mapped, loading: false });
        setCachedRentals(mapped);
      } else {
        set({ loading: false });
      }
    } catch (e) {
      console.error('Network error fetchRentals:', e);
      set({ loading: false });
    }
  },
  addRental: async (data) => {
    const tempId = crypto.randomUUID();
    const tempRental: EquipmentRental = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    set((s) => {
      const updated = [...s.rentals, tempRental];
      setCachedRentals(updated);
      return { rentals: updated };
    });

    try {
      const { data: newRow, error } = await supabase.from('equipment_rentals').insert([mapRentalToDB(data)]).select().single();
      if (error) {
        console.error('Supabase addRental error:', error);
      } else if (newRow) {
        set((s) => {
          const updated = s.rentals.map((r) => (r.id === tempId ? mapRentalFromDB(newRow) : r));
          setCachedRentals(updated);
          return { rentals: updated };
        });
      }
    } catch (e) {
      console.error('Network error addRental:', e);
    }
  },
  updateRental: async (id, data) => {
    set((s) => {
      const updated = s.rentals.map((r) => (r.id === id ? { ...r, ...data } : r));
      setCachedRentals(updated);
      return { rentals: updated };
    });
    try {
      const { error } = await supabase.from('equipment_rentals').update(mapRentalToDB(data)).eq('id', id);
      if (error) console.error('Supabase updateRental error:', error);
    } catch (e) {
      console.error('Network error updateRental:', e);
    }
  },
  deleteRental: async (id) => {
    set((s) => {
      const updated = s.rentals.filter((r) => r.id !== id);
      setCachedRentals(updated);
      return { rentals: updated };
    });
    try {
      const { error } = await supabase.from('equipment_rentals').delete().eq('id', id);
      if (error) console.error('Supabase deleteRental error:', error);
    } catch (e) {
      console.error('Network error deleteRental:', e);
    }
  },
}));
