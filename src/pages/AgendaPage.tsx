import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useJobStore } from '../store/jobStore';
import { useClientStore } from '../store/clientStore';
import { formatCurrency } from '../lib/finance';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type CalendarEvent = {
  date: string;
  type: 'meeting' | 'service' | 'delivery' | 'payment';
  jobTitle: string;
  clientName: string;
  jobId: string;
  extra?: string;
};

export default function AgendaPage() {
  const navigate = useNavigate();
  const jobs = useJobStore((s) => s.jobs);
  const payments = useJobStore((s) => s.payments);
  const clients = useClientStore((s) => s.clients);

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((firstDay + daysInMonth) / 7);

  // Build events map
  const events: Record<string, CalendarEvent[]> = {};
  const addEvent = (e: CalendarEvent) => {
    if (!events[e.date]) events[e.date] = [];
    events[e.date].push(e);
  };

  jobs.forEach((job) => {
    const client = clients.find((c) => c.id === job.clientId);
    const cn = client?.name ?? 'Cliente';
    if (job.meetingDate) addEvent({ date: job.meetingDate, type: 'meeting', jobTitle: job.title, clientName: cn, jobId: job.id });
    if (job.serviceDate) addEvent({ date: job.serviceDate, type: 'service', jobTitle: job.title, clientName: cn, jobId: job.id });
    if (job.deliveryDeadline) addEvent({ date: job.deliveryDeadline, type: 'delivery', jobTitle: job.title, clientName: cn, jobId: job.id });
  });

  payments.forEach((p) => {
    const job = jobs.find((j) => j.id === p.jobId);
    if (!job) return;
    const client = clients.find((c) => c.id === job.clientId);
    addEvent({
      date: p.date,
      type: 'payment',
      jobTitle: job.title,
      clientName: client?.name ?? '',
      jobId: job.id,
      extra: formatCurrency(p.amount),
    });
  });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const EVENT_COLORS: Record<string, string> = {
    meeting:  'var(--info)',
    service:  'var(--copper)',
    delivery: 'var(--success)',
    payment:  'var(--warning)',
  };
  const EVENT_LABELS: Record<string, string> = {
    meeting:  '🤝 Reunião',
    service:  '🎬 Serviço',
    delivery: '📦 Entrega',
    payment:  '💰 Pgto',
  };

  // Selected day
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const selectedDateStr = selectedDay
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : '';
  const selectedEvents = selectedDateStr ? (events[selectedDateStr] ?? []) : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Agenda</h1>
      </div>

      <div className="page-content">
        {/* CALENDAR HEADER */}
        <div className="section animate-in" style={{ padding: '14px 16px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <button className="btn-icon" onClick={prevMonth}><ChevronLeft size={20} /></button>
            <p className="font-semibold" style={{ fontSize: '1rem' }}>
              {MONTHS[month]} {year}
            </p>
            <button className="btn-icon" onClick={nextMonth}><ChevronRight size={20} /></button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {DAYS.map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--charcoal-light)', padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array.from({ length: weeks * 7 }).map((_, i) => {
              const dayNum = i - firstDay + 1;
              if (dayNum < 1 || dayNum > daysInMonth) {
                return <div key={i} />;
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = events[dateStr] ?? [];
              const isToday = dayNum === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = dayNum === selectedDay;

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDay(dayNum)}
                  style={{
                    borderRadius: 8,
                    padding: '4px 2px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--copper)' : isToday ? 'var(--copper-pale)' : 'transparent',
                    transition: 'background 0.12s ease',
                  }}
                >
                  <p style={{
                    fontSize: '0.8rem',
                    fontWeight: isToday || isSelected ? 700 : 400,
                    color: isSelected ? '#fff' : isToday ? 'var(--copper-dark)' : 'var(--charcoal)',
                    lineHeight: 1.8,
                  }}>
                    {dayNum}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', minHeight: 6 }}>
                    {dayEvents.slice(0, 3).map((ev, j) => (
                      <div
                        key={j}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: isSelected ? 'rgba(255,255,255,0.8)' : EVENT_COLORS[ev.type],
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LEGEND */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '0 4px' }}>
          {Object.entries(EVENT_LABELS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: EVENT_COLORS[k], flexShrink: 0 }} />
              <span className="text-xs text-muted">{v}</span>
            </div>
          ))}
        </div>

        {/* SELECTED DAY EVENTS */}
        {selectedDay && (
          <div className="section animate-in">
            <p className="section-title">
              {String(selectedDay).padStart(2, '0')} de {MONTHS[month]}
            </p>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted">Nenhum evento neste dia.</p>
            ) : (
              selectedEvents.map((ev, i) => (
                <div
                  key={i}
                  className="list-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/projetos/${ev.jobId}`)}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: EVENT_COLORS[ev.type],
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-semibold" style={{ fontSize: '0.875rem' }}>
                      {EVENT_LABELS[ev.type]} · {ev.jobTitle}
                    </p>
                    <p className="text-xs text-muted">
                      {ev.clientName}{ev.extra ? ` · ${ev.extra}` : ''}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--charcoal-light)' }} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
