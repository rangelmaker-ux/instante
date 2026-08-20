import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Freelancer, EquipmentRental } from '../types';

const uid = () => Math.random().toString(36).slice(2, 10);

interface FreelancerStore {
  freelancers: Freelancer[];
  addFreelancer: (f: Omit<Freelancer, 'id' | 'createdAt'>) => void;
  updateFreelancer: (id: string, data: Partial<Freelancer>) => void;
  deleteFreelancer: (id: string) => void;
  getFreelancer: (id: string) => Freelancer | undefined;
}

interface EquipmentStore {
  rentals: EquipmentRental[];
  addRental: (r: Omit<EquipmentRental, 'id' | 'createdAt'>) => void;
  updateRental: (id: string, data: Partial<EquipmentRental>) => void;
  deleteRental: (id: string) => void;
}

export const useFreelancerStore = create<FreelancerStore>()(
  persist(
    (set, get) => ({
      freelancers: [],
      addFreelancer: (data) =>
        set((s) => ({
          freelancers: [
            ...s.freelancers,
            { ...data, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateFreelancer: (id, data) =>
        set((s) => ({
          freelancers: s.freelancers.map((f) =>
            f.id === id ? { ...f, ...data } : f
          ),
        })),
      deleteFreelancer: (id) =>
        set((s) => ({
          freelancers: s.freelancers.filter((f) => f.id !== id),
        })),
      getFreelancer: (id) => get().freelancers.find((f) => f.id === id),
    }),
    { name: 'instante-freelancers' }
  )
);

export const useEquipmentStore = create<EquipmentStore>()(
  persist(
    (set) => ({
      rentals: [],
      addRental: (data) =>
        set((s) => ({
          rentals: [
            ...s.rentals,
            { ...data, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateRental: (id, data) =>
        set((s) => ({
          rentals: s.rentals.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),
      deleteRental: (id) =>
        set((s) => ({ rentals: s.rentals.filter((r) => r.id !== id) })),
    }),
    { name: 'instante-equipment' }
  )
);
