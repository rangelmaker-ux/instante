-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  company TEXT,
  document TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;

-- Tabela de Projetos (Jobs)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'negotiating',
  total_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  rangel_value NUMERIC(10, 2) DEFAULT 0,
  felipe_value NUMERIC(10, 2) DEFAULT 0,
  company_value NUMERIC(10, 2) DEFAULT 0,
  meeting_date TIMESTAMPTZ,
  service_date TIMESTAMPTZ,
  delivery_deadline TIMESTAMPTZ,
  location TEXT,
  notes TEXT,
  date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS rangel_value NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS felipe_value NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company_value NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS meeting_date TIMESTAMPTZ;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS service_date TIMESTAMPTZ;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS delivery_deadline TIMESTAMPTZ;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS notes TEXT;

-- Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  date TIMESTAMPTZ,
  recipient TEXT,
  note TEXT,
  due_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS recipient TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS note TEXT;

-- Tabela de Entregas
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  description TEXT,
  label TEXT,
  link TEXT,
  type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  deadline TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Tabela de Freelancers
CREATE TABLE IF NOT EXISTS public.freelancers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  specialty TEXT,
  phone TEXT,
  email TEXT,
  default_rate NUMERIC(10, 2) DEFAULT 0,
  pix_key TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.freelancers ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.freelancers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.freelancers ADD COLUMN IF NOT EXISTS default_rate NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.freelancers ADD COLUMN IF NOT EXISTS notes TEXT;

-- Tabela de Freelancers nos Projetos
CREATE TABLE IF NOT EXISTS public.job_freelancers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES public.freelancers(id) ON DELETE RESTRICT,
  role TEXT,
  agreed_value NUMERIC(10, 2) DEFAULT 0,
  value NUMERIC(10, 2) DEFAULT 0,
  payment_mode TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.job_freelancers ADD COLUMN IF NOT EXISTS value NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.job_freelancers ADD COLUMN IF NOT EXISTS payment_mode TEXT;
ALTER TABLE public.job_freelancers ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;
ALTER TABLE public.job_freelancers ADD COLUMN IF NOT EXISTS notes TEXT;

-- Tabela de Equipamentos
CREATE TABLE IF NOT EXISTS public.equipment_rentals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  name TEXT,
  equipment_name TEXT,
  company TEXT,
  contact TEXT,
  value NUMERIC(10, 2) DEFAULT 0,
  rental_value NUMERIC(10, 2) DEFAULT 0,
  pickup_date TIMESTAMPTZ,
  return_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.equipment_rentals ADD COLUMN IF NOT EXISTS job_id UUID;
ALTER TABLE public.equipment_rentals ADD COLUMN IF NOT EXISTS equipment_name TEXT;
ALTER TABLE public.equipment_rentals ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.equipment_rentals ADD COLUMN IF NOT EXISTS contact TEXT;
ALTER TABLE public.equipment_rentals ADD COLUMN IF NOT EXISTS rental_value NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.equipment_rentals ADD COLUMN IF NOT EXISTS notes TEXT;

-- Tabelas do WhatsApp
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  whatsapp_chat_id TEXT UNIQUE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  whatsapp_message_id TEXT UNIQUE,
  content TEXT NOT NULL,
  direction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Desabilitar RLS (Row Level Security)
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_freelancers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_rentals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Tabelas do CRM e Produção Pessoal
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  target_revenue NUMERIC(10, 2) NOT NULL DEFAULT 0,
  target_weddings INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.personal_production (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  recording_date DATE,
  recording_time TEXT,
  script TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_production DISABLE ROW LEVEL SECURITY;
