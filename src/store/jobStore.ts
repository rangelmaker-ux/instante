import { create } from 'zustand';
import type { Job, Payment, Contract, Delivery, JobFreelancer } from '../types';
import { supabase } from '../lib/supabase';

interface JobStore {
  jobs: Job[];
  payments: Payment[];
  contracts: Contract[];
  deliveries: Delivery[];
  jobFreelancers: JobFreelancer[];
  loading: boolean;
  
  fetchData: () => Promise<void>;

  // Jobs
  addJob: (j: Omit<Job, 'id' | 'createdAt'>) => Promise<string | undefined>;
  updateJob: (id: string, data: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  getJob: (id: string) => Job | undefined;

  // Payments
  addPayment: (p: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  getPaymentsForJob: (jobId: string) => Payment[];

  // Contracts
  addContract: (c: Omit<Contract, 'id' | 'uploadedAt'>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;

  // Deliveries
  addDelivery: (d: Omit<Delivery, 'id'>) => Promise<void>;
  deleteDelivery: (id: string) => Promise<void>;

  // Freelancers on Job
  addJobFreelancer: (jf: Omit<JobFreelancer, 'id' | 'createdAt'>) => Promise<void>;
  updateJobFreelancer: (id: string, data: Partial<JobFreelancer>) => Promise<void>;
  deleteJobFreelancer: (id: string) => Promise<void>;
  getJobFreelancers: (jobId: string) => JobFreelancer[];
}

// Helpers to map camelCase <-> snake_case
const mapJobFromDB = (d: any): Job => ({
  id: d.id,
  clientId: d.client_id,
  title: d.title,
  description: d.description,
  status: d.status,
  totalValue: Number(d.total_value),
  rangelValue: Number(d.rangel_value),
  felipeValue: Number(d.felipe_value),
  companyValue: Number(d.company_value),
  meetingDate: d.meeting_date,
  serviceDate: d.service_date,
  deliveryDeadline: d.delivery_deadline,
  location: d.location,
  notes: d.notes,
  createdAt: d.created_at,
});
const mapJobToDB = (j: Partial<Job>) => ({
  client_id: j.clientId,
  title: j.title,
  description: j.description,
  status: j.status,
  total_value: j.totalValue,
  rangel_value: j.rangelValue,
  felipe_value: j.felipeValue,
  company_value: j.companyValue,
  meeting_date: j.meetingDate,
  service_date: j.serviceDate,
  delivery_deadline: j.deliveryDeadline,
  location: j.location,
  notes: j.notes,
});

const mapPaymentFromDB = (d: any): Payment => ({
  id: d.id,
  jobId: d.job_id,
  amount: Number(d.amount),
  date: d.date,
  recipient: d.recipient,
  note: d.note,
  createdAt: d.created_at,
});
const mapPaymentToDB = (p: Partial<Payment>) => ({
  job_id: p.jobId,
  amount: p.amount,
  date: p.date,
  recipient: p.recipient,
  note: p.note,
});

const mapContractFromDB = (d: any): Contract => ({
  id: d.id,
  jobId: d.job_id,
  label: d.label,
  fileUrl: d.file_url,
  type: d.type,
  uploadedAt: d.uploaded_at,
});
const mapContractToDB = (c: Partial<Contract>) => ({
  job_id: c.jobId,
  label: c.label,
  file_url: c.fileUrl,
  type: c.type,
});

const mapDeliveryFromDB = (d: any): Delivery => ({
  id: d.id,
  jobId: d.job_id,
  label: d.label,
  link: d.link,
  type: d.type,
  deliveredAt: d.delivered_at,
});
const mapDeliveryToDB = (d: Partial<Delivery>) => ({
  job_id: d.jobId,
  label: d.label,
  link: d.link,
  type: d.type,
  delivered_at: d.deliveredAt,
});

const mapJFFromDB = (d: any): JobFreelancer => ({
  id: d.id,
  jobId: d.job_id,
  freelancerId: d.freelancer_id,
  role: d.role,
  value: Number(d.value),
  paymentMode: d.payment_mode,
  status: d.status,
  paymentDate: d.payment_date,
  notes: d.notes,
  createdAt: d.created_at,
});
const mapJFToDB = (jf: Partial<JobFreelancer>) => ({
  job_id: jf.jobId,
  freelancer_id: jf.freelancerId,
  role: jf.role,
  value: jf.value,
  payment_mode: jf.paymentMode,
  status: jf.status,
  payment_date: jf.paymentDate,
  notes: jf.notes,
});

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  payments: [],
  contracts: [],
  deliveries: [],
  jobFreelancers: [],
  loading: false,

  fetchData: async () => {
    set({ loading: true });
    try {
      const [jobsRes, paymentsRes, contractsRes, deliveriesRes, jfRes] = await Promise.all([
        supabase.from('jobs').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('contracts').select('*'),
        supabase.from('deliveries').select('*'),
        supabase.from('job_freelancers').select('*'),
      ]);

      set({
        jobs: (jobsRes.data || []).map(mapJobFromDB),
        payments: (paymentsRes.data || []).map(mapPaymentFromDB),
        contracts: (contractsRes.data || []).map(mapContractFromDB),
        deliveries: (deliveriesRes.data || []).map(mapDeliveryFromDB),
        jobFreelancers: (jfRes.data || []).map(mapJFFromDB),
      });
    } catch (e) {
      console.error(e);
    } finally {
      set({ loading: false });
    }
  },

  addJob: async (data) => {
    const tempId = crypto.randomUUID();
    const tempJob: Job = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    set((s) => ({ jobs: [...s.jobs, tempJob] }));

    try {
      const { data: newRow, error } = await supabase.from('jobs').insert([mapJobToDB(data)]).select().single();
      if (error) {
        console.error('Supabase addJob error:', error);
      } else if (newRow) {
        const parsed = mapJobFromDB(newRow);
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === tempId ? parsed : j)) }));
        return parsed.id;
      }
    } catch (e) {
      console.error('Network error addJob:', e);
    }
    return tempId;
  },
  updateJob: async (id, data) => {
    set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...data } : j)) }));
    try {
      const { error } = await supabase.from('jobs').update(mapJobToDB(data)).eq('id', id);
      if (error) console.error('Supabase updateJob error:', error);
    } catch (e) {
      console.error('Network error updateJob:', e);
    }
  },
  deleteJob: async (id) => {
    set((s) => ({
      jobs: s.jobs.filter((j) => j.id !== id),
      payments: s.payments.filter((p) => p.jobId !== id),
      contracts: s.contracts.filter((c) => c.jobId !== id),
      deliveries: s.deliveries.filter((d) => d.jobId !== id),
      jobFreelancers: s.jobFreelancers.filter((jf) => jf.jobId !== id),
    }));
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) console.error('Supabase deleteJob error:', error);
    } catch (e) {
      console.error('Network error deleteJob:', e);
    }
  },
  getJob: (id) => get().jobs.find((j) => j.id === id),

  addPayment: async (data) => {
    const tempId = crypto.randomUUID();
    const tempPayment: Payment = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    set((s) => ({ payments: [...s.payments, tempPayment] }));

    try {
      const { data: newRow, error } = await supabase.from('payments').insert([mapPaymentToDB(data)]).select().single();
      if (error) {
        console.error('Supabase addPayment error:', error);
      } else if (newRow) {
        set((s) => ({ payments: s.payments.map((p) => (p.id === tempId ? mapPaymentFromDB(newRow) : p)) }));
      }
    } catch (e) {
      console.error('Network error addPayment:', e);
    }
  },
  deletePayment: async (id) => {
    set((s) => ({ payments: s.payments.filter((p) => p.id !== id) }));
    try {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) console.error('Supabase deletePayment error:', error);
    } catch (e) {
      console.error('Network error deletePayment:', e);
    }
  },
  getPaymentsForJob: (jobId) => get().payments.filter((p) => p.jobId === jobId),

  addContract: async (data) => {
    const tempId = crypto.randomUUID();
    const tempContract: Contract = {
      ...data,
      id: tempId,
      uploadedAt: new Date().toISOString(),
    };

    set((s) => ({ contracts: [...s.contracts, tempContract] }));

    try {
      const { data: newRow, error } = await supabase.from('contracts').insert([mapContractToDB(data)]).select().single();
      if (error) {
        console.error('Supabase addContract error:', error);
      } else if (newRow) {
        set((s) => ({ contracts: s.contracts.map((c) => (c.id === tempId ? mapContractFromDB(newRow) : c)) }));
      }
    } catch (e) {
      console.error('Network error addContract:', e);
    }
  },
  deleteContract: async (id) => {
    set((s) => ({ contracts: s.contracts.filter((c) => c.id !== id) }));
    try {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) console.error('Supabase deleteContract error:', error);
    } catch (e) {
      console.error('Network error deleteContract:', e);
    }
  },

  addDelivery: async (data) => {
    const tempId = crypto.randomUUID();
    const tempDelivery: Delivery = {
      ...data,
      id: tempId,
      deliveredAt: new Date().toISOString(),
    };

    set((s) => ({ deliveries: [...s.deliveries, tempDelivery] }));

    try {
      const { data: newRow, error } = await supabase.from('deliveries').insert([mapDeliveryToDB(data)]).select().single();
      if (error) {
        console.error('Supabase addDelivery error:', error);
      } else if (newRow) {
        set((s) => ({ deliveries: s.deliveries.map((d) => (d.id === tempId ? mapDeliveryFromDB(newRow) : d)) }));
      }
    } catch (e) {
      console.error('Network error addDelivery:', e);
    }
  },
  deleteDelivery: async (id) => {
    set((s) => ({ deliveries: s.deliveries.filter((d) => d.id !== id) }));
    try {
      const { error } = await supabase.from('deliveries').delete().eq('id', id);
      if (error) console.error('Supabase deleteDelivery error:', error);
    } catch (e) {
      console.error('Network error deleteDelivery:', e);
    }
  },

  addJobFreelancer: async (data) => {
    const tempId = crypto.randomUUID();
    const tempJF: JobFreelancer = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    set((s) => ({ jobFreelancers: [...s.jobFreelancers, tempJF] }));

    try {
      const { data: newRow, error } = await supabase.from('job_freelancers').insert([mapJFToDB(data)]).select().single();
      if (error) {
        console.error('Supabase addJobFreelancer error:', error);
      } else if (newRow) {
        set((s) => ({ jobFreelancers: s.jobFreelancers.map((jf) => (jf.id === tempId ? mapJFFromDB(newRow) : jf)) }));
      }
    } catch (e) {
      console.error('Network error addJobFreelancer:', e);
    }
  },
  updateJobFreelancer: async (id, data) => {
    set((s) => ({
      jobFreelancers: s.jobFreelancers.map((jf) => (jf.id === id ? { ...jf, ...data } : jf)),
    }));
    try {
      const { error } = await supabase.from('job_freelancers').update(mapJFToDB(data)).eq('id', id);
      if (error) console.error('Supabase updateJobFreelancer error:', error);
    } catch (e) {
      console.error('Network error updateJobFreelancer:', e);
    }
  },
  deleteJobFreelancer: async (id) => {
    set((s) => ({ jobFreelancers: s.jobFreelancers.filter((jf) => jf.id !== id) }));
    try {
      const { error } = await supabase.from('job_freelancers').delete().eq('id', id);
      if (error) console.error('Supabase deleteJobFreelancer error:', error);
    } catch (e) {
      console.error('Network error deleteJobFreelancer:', e);
    }
  },
  getJobFreelancers: (jobId) => get().jobFreelancers.filter((jf) => jf.jobId === jobId),
}));
