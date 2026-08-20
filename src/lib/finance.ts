import type { Job, Payment, JobFreelancer, JobFinanceSummary } from '../types';

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatShortDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function isOverdue(iso?: string): boolean {
  if (!iso) return false;
  return new Date(iso + 'T23:59:59') < new Date();
}

export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const now = new Date();
  const target = new Date(iso + 'T12:00:00');
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

/**
 * Computes full financial summary for a job.
 * Freelancers "from_total" reduce the distributable pool before individual splits.
 * Freelancers "from_company" reduce the company portion.
 * Freelancers "external" have zero impact on the internal finances.
 */
export function computeJobFinance(
  job: Job,
  payments: Payment[],
  freelancers: JobFreelancer[]
): JobFinanceSummary {
  const jobPayments = payments.filter((p) => p.jobId === job.id);
  const jobFreelancers = freelancers.filter((jf) => jf.jobId === job.id);

  const rangelPaid = jobPayments
    .filter((p) => p.recipient === 'rangel')
    .reduce((sum, p) => sum + p.amount, 0);

  const felipePaid = jobPayments
    .filter((p) => p.recipient === 'felipe')
    .reduce((sum, p) => sum + p.amount, 0);

  const companyPaid = jobPayments
    .filter((p) => p.recipient === 'company')
    .reduce((sum, p) => sum + p.amount, 0);

  const freelancerFromTotal = jobFreelancers
    .filter((jf) => jf.paymentMode === 'from_total')
    .reduce((sum, jf) => sum + jf.value, 0);

  const freelancerFromCompany = jobFreelancers
    .filter((jf) => jf.paymentMode === 'from_company')
    .reduce((sum, jf) => sum + jf.value, 0);

  const rangelPending = Math.max(0, job.rangelValue - rangelPaid);
  const felipePending = Math.max(0, job.felipeValue - felipePaid);
  const companyPending = Math.max(0, job.companyValue - companyPaid);

  const totalPaid = rangelPaid + felipePaid + companyPaid;
  const totalPending = rangelPending + felipePending + companyPending;

  return {
    job,
    rangelGross: job.rangelValue,
    felipeGross: job.felipeValue,
    companyGross: job.companyValue,
    rangelPaid,
    felipePaid,
    companyPaid,
    freelancerFromTotal,
    freelancerFromCompany,
    rangelPending,
    felipePending,
    companyPending,
    totalPaid,
    totalPending,
  };
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  negotiating: 'Em negociação',
  confirmed: 'Confirmado',
  in_progress: 'Em execução',
  delivered: 'Entregue',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export const JOB_STATUS_COLORS: Record<string, string> = {
  negotiating: 'badge-warning',
  confirmed: 'badge-info',
  in_progress: 'badge-copper',
  delivered: 'badge-success',
  completed: 'badge-success',
  cancelled: 'badge-danger',
};

export const FREELANCER_MODE_LABELS: Record<string, string> = {
  from_company: 'Desconta do caixa',
  from_total: 'Desconta do valor geral',
  external: 'Pago por fora',
};

export const DELIVERY_TYPE_LABELS: Record<string, string> = {
  photos: 'Fotos',
  video: 'Vídeo',
  raw: 'RAW / Arquivos brutos',
  other: 'Outro',
};

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  contract: 'Contrato',
  invoice: 'Nota Fiscal',
  quote: 'Orçamento',
  receipt: 'Recibo',
  other: 'Outro',
};
