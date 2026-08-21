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

const JOBS_CACHE = 'instante_jobs';
const PAYMENTS_CACHE = 'instante_payments';
const CONTRACTS_CACHE = 'instante_contracts';
const DELIVERIES_CACHE = 'instante_deliveries';
const JF_CACHE = 'instante_job_freelancers';

const getCache = <T>(key: string): T[] => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : []; } catch { return []; }
};
const setCache = <T>(key: string, data: T[]) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: getCache<Job>(JOBS_CACHE),
  payments: getCache<Payment>(PAYMENTS_CACHE),
  contracts: getCache<Contract>(CONTRACTS_CACHE),
  deliveries: getCache<Delivery>(DELIVERIES_CACHE),
  jobFreelancers: getCache<JobFreelancer>(JF_CACHE),
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

      const j = (jobsRes.data || []).map(mapJobFromDB);
      const p = (paymentsRes.data || []).map(mapPaymentFromDB);
      const c = (contractsRes.data || []).map(mapContractFromDB);
      const d = (deliveriesRes.data || []).map(mapDeliveryFromDB);
      const jf = (jfRes.data || []).map(mapJFFromDB);

      if (j.length > 0) { set({ jobs: j }); setCache(JOBS_CACHE, j); }
      if (p.length > 0) { set({ payments: p }); setCache(PAYMENTS_CACHE, p); }
      if (c.length > 0) { set({ contracts: c }); setCache(CONTRACTS_CACHE, c); }
      if (d.length > 0) { set({ deliveries: d }); setCache(DELIVERIES_CACHE, d); }
      if (jf.length > 0) { set({ jobFreelancers: jf }); setCache(JF_CACHE, jf); }

      set({ loading: false });
    } catch (e) {
      console.error(e);
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

    set((s) => {
      const updated = [...s.jobs, tempJob];
      setCache(JOBS_CACHE, updated);
      return { jobs: updated };
    });

    try {
      const { data: newRow, error } = await supabase.from('jobs').insert([mapJobToDB(data)]).select().single();
      if (error) {
        console.error('Supabase addJob error:', error);
      } else if (newRow) {
        const parsed = mapJobFromDB(newRow);
        set((s) => {
          const updated = s.jobs.map((j) => (j.id === tempId ? parsed : j));
          setCache(JOBS_CACHE, updated);
          return { jobs: updated };
        });
        return parsed.id;
      }
    } catch (e) {
      console.error('Network error addJob:', e);
    }
    return tempId;
  },
  updateJob: async (id, data) => {
    set((s) => {
      const updated = s.jobs.map((j) => (j.id === id ? { ...j, ...data } : j));
      setCache(JOBS_CACHE, updated);
      return { jobs: updated };
    });
    try {
      const { error } = await supabase.from('jobs').update(mapJobToDB(data)).eq('id', id);
      if (error) console.error('Supabase updateJob error:', error);
    } catch (e) {
      console.error('Network error updateJob:', e);
    }
  },
  deleteJob: async (id) => {
    set((s) => {
      const updatedJobs = s.jobs.filter((j) => j.id !== id);
      setCache(JOBS_CACHE, updatedJobs);
      return {
        jobs: updatedJobs,
        payments: s.payments.filter((p) => p.jobId !== id),
        contracts: s.contracts.filter((c) => c.jobId !== id),
        deliveries: s.deliveries.filter((d) => d.jobId !== id),
        jobFreelancers: s.jobFreelancers.filter((jf) => jf.jobId !== id),
      };
    });
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

    set((s) => {
      const updated = [...s.payments, tempPayment];
      setCache(PAYMENTS_CACHE, updated);
      return { payments: updated };
    });

    try {
      const { data: newRow, error } = await supabase.from('payments').insert([mapPaymentToDB(data)]).select().single();
      if (error) {
        console.error('Supabase addPayment error:', error);
      } else if (newRow) {
        set((s) => {
          const updated = s.payments.map((p) => (p.id === tempId ? mapPaymentFromDB(newRow) : p));
          setCache(PAYMENTS_CACHE, updated);
          return { payments: updated };
        });
      }
    } catch (e) {
      console.error('Network error addPayment:', e);
    }
  },
  deletePayment: async (id) => {
    set((s) => {
      const updated = s.payments.filter((p) => p.id !== id);
      setCache(PAYMENTS_CACHE, updated);
      return { payments: updated };
    });
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

    set((s) => {
      const updated = [...s.contracts, tempContract];
      setCache(CONTRACTS_CACHE, updated);
      return { contracts: updated };
    });

    try {
      const { data: newRow, error } = await supabase.from('contracts').insert([mapContractToDB(data)]).select().single();
      if (error) {
        console.error('Supabase addContract error:', error);
      } else if (newRow) {
        set((s) => {
          const updated = s.contracts.map((c) => (c.id === tempId ? mapContractFromDB(newRow) : c));
          setCache(CONTRACTS_CACHE, updated);
          return { contracts: updated };
        });
      }
    } catch (e) {
      console.error('Network error addContract:', e);
    }
  },
  deleteContract: async (id) => {
    set((s) => {
      const updated = s.contracts.filter((c) => c.id !== id);
      setCache(CONTRACTS_CACHE, updated);
      return { contracts: updated };
    });
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

    set((s) => {
      const updated = [...s.deliveries, tempDelivery];
      setCache(DELIVERIES_CACHE, updated);
      return { deliveries: updated };
    });

    try {
      const { data: newRow, error } = await supabase.from('deliveries').insert([mapDeliveryToDB(data)]).select().single();
      if (error) {
        console.error('Supabase addDelivery error:', error);
      } else if (newRow) {
        set((s) => {
          const updated = s.deliveries.map((d) => (d.id === tempId ? mapDeliveryFromDB(newRow) : d));
          setCache(DELIVERIES_CACHE, updated);
          return { deliveries: updated };
        });
      }
    } catch (e) {
      console.error('Network error addDelivery:', e);
    }
  },
  deleteDelivery: async (id) => {
    set((s) => {
      const updated = s.deliveries.filter((d) => d.id !== id);
      setCache(DELIVERIES_CACHE, updated);
      return { deliveries: updated };
    });
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

    set((s) => {
      const updated = [...s.jobFreelancers, tempJF];
      setCache(JF_CACHE, updated);
      return { jobFreelancers: updated };
    });

    try {
      const { data: newRow, error } = await supabase.from('job_freelancers').insert([mapJFToDB(data)]).select().single();
      if (error) {
        console.error('Supabase addJobFreelancer error:', error);
      } else if (newRow) {
        set((s) => {
          const updated = s.jobFreelancers.map((jf) => (jf.id === tempId ? mapJFFromDB(newRow) : jf));
          setCache(JF_CACHE, updated);
          return { jobFreelancers: updated };
        });
      }
    } catch (e) {
      console.error('Network error addJobFreelancer:', e);
    }
  },
  updateJobFreelancer: async (id, data) => {
    set((s) => {
      const updated = s.jobFreelancers.map((jf) => (jf.id === id ? { ...jf, ...data } : jf));
      setCache(JF_CACHE, updated);
      return { jobFreelancers: updated };
    });
    try {
      const { error } = await supabase.from('job_freelancers').update(mapJFToDB(data)).eq('id', id);
      if (error) console.error('Supabase updateJobFreelancer error:', error);
    } catch (e) {
      console.error('Network error updateJobFreelancer:', e);
    }
  },
  deleteJobFreelancer: async (id) => {
    set((s) => {
      const updated = s.jobFreelancers.filter((jf) => jf.id !== id);
      setCache(JF_CACHE, updated);
      return { jobFreelancers: updated };
    });
    try {
      const { error } = await supabase.from('job_freelancers').delete().eq('id', id);
      if (error) console.error('Supabase deleteJobFreelancer error:', error);
    } catch (e) {
      console.error('Network error deleteJobFreelancer:', e);
    }
  },
  getJobFreelancers: (jobId) => get().jobFreelancers.filter((jf) => jf.jobId === jobId),
}));
