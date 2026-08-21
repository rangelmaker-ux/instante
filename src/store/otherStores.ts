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

export const useFreelancerStore = create<FreelancerStore>((set, get) => ({
  freelancers: [],
  loading: false,

  fetchFreelancers: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('freelancers').select('*').order('name');
    if (!error && data) {
      set({ freelancers: data.map(mapFreelancerFromDB), loading: false });
    } else {
      set({ loading: false });
    }
  },
  addFreelancer: async (data) => {
    const { data: newRow, error } = await supabase.from('freelancers').insert([mapFreelancerToDB(data)]).select().single();
    if (!error && newRow) {
      set((s) => ({ freelancers: [...s.freelancers, mapFreelancerFromDB(newRow)].sort((a, b) => a.name.localeCompare(b.name)) }));
    }
  },
  updateFreelancer: async (id, data) => {
    set((s) => ({ freelancers: s.freelancers.map((f) => (f.id === id ? { ...f, ...data } : f)) }));
    await supabase.from('freelancers').update(mapFreelancerToDB(data)).eq('id', id);
  },
  deleteFreelancer: async (id) => {
    set((s) => ({ freelancers: s.freelancers.filter((f) => f.id !== id) }));
    await supabase.from('freelancers').delete().eq('id', id);
  },
  getFreelancer: (id) => get().freelancers.find((f) => f.id === id),
}));

export const useEquipmentStore = create<EquipmentStore>((set) => ({
  rentals: [],
  loading: false,

  fetchRentals: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('equipment_rentals').select('*');
    if (!error && data) {
      set({ rentals: data.map(mapRentalFromDB), loading: false });
    } else {
      set({ loading: false });
    }
  },
  addRental: async (data) => {
    const { data: newRow, error } = await supabase.from('equipment_rentals').insert([mapRentalToDB(data)]).select().single();
    if (!error && newRow) {
      set((s) => ({ rentals: [...s.rentals, mapRentalFromDB(newRow)] }));
    }
  },
  updateRental: async (id, data) => {
    set((s) => ({ rentals: s.rentals.map((r) => (r.id === id ? { ...r, ...data } : r)) }));
    await supabase.from('equipment_rentals').update(mapRentalToDB(data)).eq('id', id);
  },
  deleteRental: async (id) => {
    set((s) => ({ rentals: s.rentals.filter((r) => r.id !== id) }));
    await supabase.from('equipment_rentals').delete().eq('id', id);
  },
}));
