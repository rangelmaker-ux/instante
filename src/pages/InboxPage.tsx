import { useState, useEffect, useRef } from 'react';
import { Send, Check, User } from 'lucide-react';
import { api } from '../lib/api';
import PageHeader from '../components/layout/PageHeader';

interface Conversation {
  id: string;
  whatsappChatId: string;
  lastMessageAt: string;
  unreadCount: number;
  client: { name: string; whatsapp: string } | null;
}

interface Message {
  id: string;
  content: string;
  direction: 'in' | 'out';
  createdAt: string;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    
    // Conectar ao SSE (Server-Sent Events)
    const sse = new EventSource('/api/events');
    
    sse.addEventListener('new_message', (e: any) => {
      const data = JSON.parse(e.data);
      setMessages(prev => {
        // Se a mensagem for pra conversa aberta e não for duplicada
        if (selectedConv?.id === data.conversation_id && !prev.find(m => m.id === data.message.id)) {
          return [...prev, data.message];
        }
        return prev;
      });
      fetchConversations();
    });

    sse.addEventListener('conversation_updated', () => {
      fetchConversations();
    });

    return () => sse.close();
  }, [selectedConv?.id]);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      api.post(`/conversations/${selectedConv.id}/read`, {}).catch(() => {});
    }
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchConversations() {
    try {
      const data = await api.get<Conversation[]>('/conversations');
      setConversations(data);
    } catch (e) {
      console.error('Erro ao buscar conversas', e);
    }
  }

  async function fetchMessages(id: string) {
    try {
      const data = await api.get<any>(`/conversations/${id}`);
      setMessages(data.messages || []);
    } catch (e) {
      console.error('Erro ao buscar msgs', e);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !selectedConv) return;
    
    setSending(true);
    try {
      const msg = await api.post<Message>('/messages', {
        conversation_id: selectedConv.id,
        content: chatInput.trim()
      });
      setMessages(prev => [...prev, msg]);
      setChatInput('');
      fetchConversations();
    } catch (e) {
      console.error('Erro ao enviar', e);
    } finally {
      setSending(false);
    }
  }

  if (selectedConv) {
    return (
      <div className="page" style={{ paddingBottom: 0 }}>
        <PageHeader 
          title={selectedConv.client?.name || selectedConv.client?.whatsapp || 'Desconhecido'} 
          back 
          onBack={() => setSelectedConv(null)}
        />
        
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: '#f0f0f0' }}>
          {messages.map(m => (
            <div key={m.id} style={{
              alignSelf: m.direction === 'out' ? 'flex-end' : 'flex-start',
              backgroundColor: m.direction === 'out' ? '#DCF8C6' : 'white',
              padding: '8px 12px',
              borderRadius: 12,
              borderTopRightRadius: m.direction === 'out' ? 0 : 12,
              borderTopLeftRadius: m.direction === 'in' ? 0 : 12,
              maxWidth: '85%',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: '#111' }}>{m.content}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#888', textAlign: 'right' }}>
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {m.direction === 'out' && <Check size={10} style={{ marginLeft: 4 }} />}
              </p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: 16, backgroundColor: 'white', borderTop: '1px solid var(--border)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Mensagem" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={sending}
              style={{ flex: 1, borderRadius: 20 }}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={sending || !chatInput.trim()}
              style={{ borderRadius: 20, width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title="WhatsApp" />
      
      <div className="page-content" style={{ padding: 0 }}>
        {conversations.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <User size={32} color="white" />
            </div>
            <p className="font-bold">Nenhuma conversa</p>
            <p className="text-sm text-muted">As conversas do WhatsApp aparecerão aqui em tempo real.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {conversations.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelectedConv(c)}
                style={{ 
                  display: 'flex', gap: 16, padding: 16, 
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: c.unreadCount > 0 ? '#f0f9ff' : 'white',
                  cursor: 'pointer'
                }}
                className="animate-in"
              >
                <div style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'var(--copper)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={24} color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p className="font-bold truncate" style={{ fontSize: '1rem', color: 'var(--charcoal)' }}>
                      {c.client?.name || c.client?.whatsapp || c.whatsappChatId.replace('@s.whatsapp.net', '')}
                    </p>
                    {c.lastMessageAt && (
                      <p className="text-xs text-muted">
                        {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <p className="text-sm text-muted truncate">
                      {c.whatsappChatId.replace('@s.whatsapp.net', '')}
                    </p>
                    {c.unreadCount > 0 && (
                      <span style={{ backgroundColor: 'var(--copper)', color: 'white', borderRadius: 10, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
