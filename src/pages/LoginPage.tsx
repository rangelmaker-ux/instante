import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        alert('Cadastro realizado! Verifique seu email ou tente fazer login diretamente (se não houver confirmação obrigatória).');
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: '#f0f0f0'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'white',
        padding: 32,
        borderRadius: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <img src="/logo.png" alt="Instante Comunicação" style={{ height: 120, objectFit: 'contain', marginBottom: 24, width: '100%' }} />
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: 24, color: 'var(--charcoal)' }}>
          {isSignUp ? 'Criar Conta' : 'Fazer Login'}
        </h1>

        {error && (
          <div style={{ width: '100%', padding: 12, backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="text-sm font-bold" style={{ display: 'block', marginBottom: 4 }}>E-mail</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold" style={{ display: 'block', marginBottom: 4 }}>Senha</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Aguarde...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>

        <button 
          onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          style={{ marginTop: 24, background: 'none', border: 'none', color: 'var(--copper)', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {isSignUp ? 'Já tenho uma conta. Fazer login.' : 'Não tenho conta. Criar agora.'}
        </button>
      </div>
    </div>
  );
}
