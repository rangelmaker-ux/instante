-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT UNIQUE,
  email TEXT,
  document TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Projetos (Jobs)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'budget',
  total_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Entregas
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  deadline TIMESTAMPTZ
);

-- Tabela de Freelancers
CREATE TABLE IF NOT EXISTS public.freelancers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  pix_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Freelancers nos Projetos
CREATE TABLE IF NOT EXISTS public.job_freelancers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES public.freelancers(id) ON DELETE RESTRICT,
  role TEXT NOT NULL,
  agreed_value NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Equipamentos
CREATE TABLE IF NOT EXISTS public.equipment_rentals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  value NUMERIC(10, 2) NOT NULL,
  pickup_date TIMESTAMPTZ,
  return_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

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

-- Desabilitar RLS (Row Level Security) TEMPORARIAMENTE para facilitar o MVP e o acesso pelo backend.
-- Em produção pesada, idealmente essas tabelas teriam RLS, mas como a plataforma é de uso interno e fechada,
-- e o backend acessa com a anon_key, deixaremos as tabelas abertas para leitura/escrita autenticada e anônima para o webhook.

ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_freelancers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_rentals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Novas Tabelas para CRM e Produção Pessoal
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
