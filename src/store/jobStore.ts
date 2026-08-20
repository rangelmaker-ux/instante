import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Job, Payment, Contract, Delivery, JobFreelancer } from '../types';

const uid = () => Math.random().toString(36).slice(2, 10);

interface JobStore {
  jobs: Job[];
  payments: Payment[];
  contracts: Contract[];
  deliveries: Delivery[];
  jobFreelancers: JobFreelancer[];

  // Jobs
  addJob: (j: Omit<Job, 'id' | 'createdAt'>) => string;
  updateJob: (id: string, data: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  getJob: (id: string) => Job | undefined;

  // Payments
  addPayment: (p: Omit<Payment, 'id' | 'createdAt'>) => void;
  deletePayment: (id: string) => void;
  getPaymentsForJob: (jobId: string) => Payment[];

  // Contracts
  addContract: (c: Omit<Contract, 'id' | 'uploadedAt'>) => void;
  deleteContract: (id: string) => void;

  // Deliveries
  addDelivery: (d: Omit<Delivery, 'id'>) => void;
  deleteDelivery: (id: string) => void;

  // Freelancers on Job
  addJobFreelancer: (jf: Omit<JobFreelancer, 'id' | 'createdAt'>) => void;
  updateJobFreelancer: (id: string, data: Partial<JobFreelancer>) => void;
  deleteJobFreelancer: (id: string) => void;
  getJobFreelancers: (jobId: string) => JobFreelancer[];
}

export const useJobStore = create<JobStore>()(
  persist(
    (set, get) => ({
      jobs: [],
      payments: [],
      contracts: [],
      deliveries: [],
      jobFreelancers: [],

      addJob: (data) => {
        const id = uid();
        set((s) => ({
          jobs: [...s.jobs, { ...data, id, createdAt: new Date().toISOString() }],
        }));
        return id;
      },
      updateJob: (id, data) =>
        set((s) => ({
          jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...data } : j)),
        })),
      deleteJob: (id) =>
        set((s) => ({
          jobs: s.jobs.filter((j) => j.id !== id),
          payments: s.payments.filter((p) => p.jobId !== id),
          contracts: s.contracts.filter((c) => c.jobId !== id),
          deliveries: s.deliveries.filter((d) => d.jobId !== id),
          jobFreelancers: s.jobFreelancers.filter((jf) => jf.jobId !== id),
        })),
      getJob: (id) => get().jobs.find((j) => j.id === id),

      addPayment: (data) =>
        set((s) => ({
          payments: [
            ...s.payments,
            { ...data, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),
      deletePayment: (id) =>
        set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),
      getPaymentsForJob: (jobId) => get().payments.filter((p) => p.jobId === jobId),

      addContract: (data) =>
        set((s) => ({
          contracts: [
            ...s.contracts,
            { ...data, id: uid(), uploadedAt: new Date().toISOString() },
          ],
        })),
      deleteContract: (id) =>
        set((s) => ({ contracts: s.contracts.filter((c) => c.id !== id) })),

      addDelivery: (data) =>
        set((s) => ({
          deliveries: [...s.deliveries, { ...data, id: uid() }],
        })),
      deleteDelivery: (id) =>
        set((s) => ({ deliveries: s.deliveries.filter((d) => d.id !== id) })),

      addJobFreelancer: (data) =>
        set((s) => ({
          jobFreelancers: [
            ...s.jobFreelancers,
            { ...data, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateJobFreelancer: (id, data) =>
        set((s) => ({
          jobFreelancers: s.jobFreelancers.map((jf) =>
            jf.id === id ? { ...jf, ...data } : jf
          ),
        })),
      deleteJobFreelancer: (id) =>
        set((s) => ({
          jobFreelancers: s.jobFreelancers.filter((jf) => jf.id !== id),
        })),
      getJobFreelancers: (jobId) =>
        get().jobFreelancers.filter((jf) => jf.jobId === jobId),
    }),
    { name: 'instante-jobs' }
  )
);
