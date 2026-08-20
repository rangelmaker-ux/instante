// ============================================================
// TYPES — Instante Comunicação Gestão
// ============================================================

export type JobStatus =
  | 'negotiating'   // Em negociação
  | 'confirmed'     // Confirmado
  | 'in_progress'   // Em execução
  | 'delivered'     // Entregue
  | 'completed'     // Concluído
  | 'cancelled';    // Cancelado

export type FreelancerPaymentMode =
  | 'from_company'  // Descontado da empresa (do caixa)
  | 'from_total'    // Descontado do valor geral (antes do split)
  | 'external';     // Pago por fora (não impacta as contas)

export type PaymentRecipient = 'rangel' | 'felipe' | 'company';

export type DeliveryType = 'photos' | 'video' | 'raw' | 'other';

export type ContractType = 'contract' | 'invoice' | 'quote' | 'receipt' | 'other';

export type EquipmentStatus = 'active' | 'returned' | 'overdue';

// ─────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────
export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  createdAt: string; // ISO date
}

// ─────────────────────────────────────────────
// Job (Projeto / Serviço)
// ─────────────────────────────────────────────
export interface Job {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  status: JobStatus;

  // Valores financeiros
  totalValue: number;
  rangelValue: number;   // Valor fixo para Rangel
  felipeValue: number;   // Valor fixo para Felipe
  companyValue: number;  // Valor fixo para o caixa

  // Datas
  meetingDate?: string;   // Reunião / briefing
  serviceDate?: string;   // Data da execução do serviço
  deliveryDeadline?: string; // Prazo de entrega

  location?: string;
  notes?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Payment (Pagamento recebido por job)
// ─────────────────────────────────────────────
export interface Payment {
  id: string;
  jobId: string;
  amount: number;
  date: string;
  recipient: PaymentRecipient;
  note?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Freelancer
// ─────────────────────────────────────────────
export interface Freelancer {
  id: string;
  name: string;
  specialty: string; // ex: "Iluminação", "Drone", "Edição"
  phone?: string;
  email?: string;
  defaultRate?: number; // Valor referência
  notes?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Job Freelancer (freelancer contratado por projeto)
// ─────────────────────────────────────────────
export interface JobFreelancer {
  id: string;
  jobId: string;
  freelancerId: string;
  role?: string;           // ex: "Iluminador", "Drone pilot"
  value: number;           // Valor combinado
  paymentMode: FreelancerPaymentMode;
  status: 'pending' | 'paid';
  paymentDate?: string;
  notes?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Equipment Rental
// ─────────────────────────────────────────────
export interface EquipmentRental {
  id: string;
  jobId?: string;          // Opcional: pode ser uma locação genérica
  equipmentName: string;
  company: string;          // Empresa locadora
  contact?: string;
  rentalValue: number;
  pickupDate: string;
  returnDate: string;
  status: EquipmentStatus;
  notes?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Contract (link de contrato anexado)
// ─────────────────────────────────────────────
export interface Contract {
  id: string;
  jobId: string;
  label: string;
  fileUrl: string;
  type: ContractType;
  uploadedAt: string;
}

// ─────────────────────────────────────────────
// Delivery (link de entrega ao cliente)
// ─────────────────────────────────────────────
export interface Delivery {
  id: string;
  jobId: string;
  label: string;
  link: string;
  type: DeliveryType;
  deliveredAt: string;
}

// ─────────────────────────────────────────────
// Finance Summary (computed, não persistido)
// ─────────────────────────────────────────────
export interface JobFinanceSummary {
  job: Job;
  // Valores brutos definidos no job
  rangelGross: number;
  felipeGross: number;
  companyGross: number;

  // Total recebido por cada um
  rangelPaid: number;
  felipePaid: number;
  companyPaid: number;

  // Freelancers descontados antes do split
  freelancerFromTotal: number;
  // Freelancers descontados do caixa
  freelancerFromCompany: number;

  // Pendente
  rangelPending: number;
  felipePending: number;
  companyPending: number;

  // Total recebido vs total
  totalPaid: number;
  totalPending: number;
}
