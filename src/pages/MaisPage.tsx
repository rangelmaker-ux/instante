import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Video, Briefcase, Download, DollarSign, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useJobStore } from '../store/jobStore';
import { usePaymentStore } from '../store/paymentStore';
import { useCRMStore } from '../store/crmStore';
import { computeJobFinance } from '../lib/finance';
import { formatCurrency } from '../lib/utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';

export default function MaisPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const userName = user?.email ? user.email.split('@')[0].toUpperCase() : 'USUÁRIO';
  
  const jobs = useJobStore((s) => s.jobs);
  const payments = usePaymentStore((s) => s.payments);
  const jobFreelancers = useJobStore((s) => s.jobFreelancers);
  
  const { goals, productions, fetchCRM } = useCRMStore();
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCRM();
  }, [fetchCRM]);

  // Compute Partners and Company Vault
  let companyTotal = 0;
  let companyPaid = 0;
  let rangelTotal = 0;
  let rangelPaid = 0;
  let felipeTotal = 0;
  let felipePaid = 0;

  jobs.forEach((job) => {
    const sum = computeJobFinance(job, payments, jobFreelancers);
    const pct = job.totalValue > 0 ? sum.totalPaid / job.totalValue : 0;
    
    companyTotal += job.companyValue;
    companyPaid  += job.companyValue * pct;
    rangelTotal  += job.rangelValue;
    rangelPaid   += job.rangelValue * pct;
    felipeTotal  += job.felipeValue;
    felipePaid   += job.felipeValue * pct;
  });

  // Analytics for Charts (Last 6 Months)
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    let m = currentMonth - 5 + i;
    let y = currentYear;
    if (m <= 0) { m += 12; y -= 1; }
    
    // Revenue from jobs created or paid in that month (approximate by created_at)
    const monthJobs = jobs.filter(j => {
      const jd = new Date(j.createdAt);
      return jd.getMonth() + 1 === m && jd.getFullYear() === y;
    });
    
    const actualRev = monthJobs.reduce((acc, j) => acc + j.totalValue, 0);
    const actualWeddings = monthJobs.length;
    
    const goal = goals.find(g => g.month === m && g.year === y);
    
    return {
      name: `${m.toString().padStart(2, '0')}/${y.toString().slice(2)}`,
      Faturamento: actualRev,
      Meta: goal?.targetRevenue || 0,
      Projetos: actualWeddings,
      MetaProjetos: goal?.targetWeddings || 0,
    };
  });

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Watermark
      const wmImg = new Image();
      wmImg.src = '/logo.png';
      await new Promise(r => { wmImg.onload = r; });
      pdf.setGState(new pdf.GState({ opacity: 0.3 }));
      pdf.addImage(wmImg, 'PNG', 20, 100, pdfWidth - 40, (wmImg.height * (pdfWidth - 40)) / wmImg.width);
      pdf.setGState(new pdf.GState({ opacity: 1 }));
      
      // Content
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Exportado por ${userName} em ${new Date().toLocaleDateString('pt-BR')}`, 10, pdf.internal.pageSize.getHeight() - 10);
      
      pdf.save(`CRM_Relatorio_${new Date().getTime()}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">CRM & Inteligência</h1>
        <button className="btn btn-primary btn-sm" onClick={handleExportPDF} disabled={exporting}>
          <Download size={16} /> {exporting ? 'Gerando...' : 'Exportar'}
        </button>
      </div>

      <div className="page-content" ref={reportRef} style={{ background: 'var(--bg)', minHeight: '100%' }}>
        
        {/* GRÁFICOS */}
        <div className="desktop-grid flex flex-col gap-3">
          <div className="section animate-in">
            <p className="section-title">Receita vs Meta (6 meses)</p>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--charcoal-light)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--charcoal-light)' }} tickFormatter={(v) => `R$${v/1000}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} cursor={{ fill: 'var(--bg-2)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Meta" fill="var(--border)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Faturamento" fill="var(--copper)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="section animate-in" style={{ animationDelay: '0.05s' }}>
            <p className="section-title">Projetos vs Meta</p>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--charcoal-light)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--charcoal-light)' }} />
                  <Tooltip cursor={{ fill: 'var(--bg-2)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="MetaProjetos" name="Meta" stroke="var(--charcoal-light)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Projetos" name="Realizado" stroke="var(--success)" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SOCIOS & CAIXA */}
        <div className="section animate-in mt-3" style={{ animationDelay: '0.1s' }}>
          <p className="section-title">Divisão & Caixa da Empresa</p>

          <div className="split-row" style={{ paddingTop: 0 }}>
            <div className="split-avatar">CX</div>
            <div className="split-info">
              <p className="split-name">Caixa da Empresa</p>
              <div className="progress-bar" style={{ marginTop: 4 }}>
                <div className="progress-fill progress-success" style={{ width: `${companyTotal > 0 ? (companyPaid / companyTotal) * 100 : 0}%` }} />
              </div>
              <p className="split-meta" style={{ marginTop: 2 }}>Total: {formatCurrency(companyTotal)}</p>
            </div>
            <div className="split-values">
              <p className="split-paid" style={{ color: 'var(--success)' }}>{formatCurrency(companyPaid)}</p>
              <p className="split-pending">{formatCurrency(companyTotal - companyPaid)} pend.</p>
            </div>
          </div>

          <div className="divider" style={{ margin: '0 0 0 46px' }} />

          <div className="split-row">
            <div className="split-avatar">RM</div>
            <div className="split-info">
              <p className="split-name">Rangel Marques</p>
              <div className="progress-bar" style={{ marginTop: 4 }}>
                <div className="progress-fill progress-copper" style={{ width: `${rangelTotal > 0 ? (rangelPaid / rangelTotal) * 100 : 0}%` }} />
              </div>
              <p className="split-meta" style={{ marginTop: 2 }}>Total: {formatCurrency(rangelTotal)}</p>
            </div>
            <div className="split-values">
              <p className="split-paid">{formatCurrency(rangelPaid)}</p>
              <p className="split-pending">{formatCurrency(rangelTotal - rangelPaid)} pend.</p>
            </div>
          </div>

          <div className="divider" style={{ margin: '0 0 0 46px' }} />

          <div className="split-row" style={{ paddingBottom: 0 }}>
            <div className="split-avatar">FR</div>
            <div className="split-info">
              <p className="split-name">Felipe Rodrigues</p>
              <div className="progress-bar" style={{ marginTop: 4 }}>
                <div className="progress-fill progress-copper" style={{ width: `${felipeTotal > 0 ? (felipePaid / felipeTotal) * 100 : 0}%` }} />
              </div>
              <p className="split-meta" style={{ marginTop: 2 }}>Total: {formatCurrency(felipeTotal)}</p>
            </div>
            <div className="split-values">
              <p className="split-paid">{formatCurrency(felipePaid)}</p>
              <p className="split-pending">{formatCurrency(felipeTotal - felipePaid)} pend.</p>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO CRM */}
        <div className="desktop-grid flex flex-col gap-3 mt-3">
          <div className="section animate-in p-0" style={{ animationDelay: '0.15s' }}>
            <div className="list-item" style={{ padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }} onClick={() => navigate('/metas')}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--copper-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Target size={18} style={{ color: 'var(--copper-dark)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p className="font-semibold" style={{ fontSize: '0.9375rem' }}>Metas e Objetivos</p>
                <p className="text-xs text-muted">Definir metas mensais e anuais</p>
              </div>
            </div>
            
            <div className="list-item" style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => navigate('/producao')}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--copper-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Video size={18} style={{ color: 'var(--copper-dark)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p className="font-semibold" style={{ fontSize: '0.9375rem' }}>Produção Pessoal</p>
                <p className="text-xs text-muted">Roteiros e gravações da Instante</p>
              </div>
            </div>
          </div>

          <div className="section animate-in p-0" style={{ animationDelay: '0.2s' }}>
            <div className="list-item" style={{ padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }} onClick={() => navigate('/freelancers')}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Briefcase size={18} style={{ color: 'var(--charcoal-mid)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p className="font-semibold" style={{ fontSize: '0.9375rem' }}>Freelancers</p>
                <p className="text-xs text-muted">Gestão de parceiros</p>
              </div>
            </div>

            <div className="list-item" style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => navigate('/financeiro')}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DollarSign size={18} style={{ color: 'var(--charcoal-mid)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p className="font-semibold" style={{ fontSize: '0.9375rem' }}>Financeiro</p>
                <p className="text-xs text-muted">Visão geral de pagamentos</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
