import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error' | 'resent'>('idle');
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [email, setEmail] = useState('');

  const navigate = useNavigate();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const emailFromUrl = queryParams.get('email');

    const user = JSON.parse(localStorage.getItem('auth_token_user') || '{}');
    setEmail(emailFromUrl || user.email || '');
    setStatus('idle');
    setMessage('');
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (idx: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newCode = [...code];
    newCode[idx] = value;
    setCode(newCode);

    if (value && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (!value && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '');
    if (paste.length === 6) {
      setCode(paste.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.some((c) => c === '')) {
      setStatus('error');
      setMessage('Preencha todos os dígitos.');
      return;
    }

    setStatus('pending');
    setMessage('Verificando código...');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-email-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.join(''), email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('E-mail verificado com sucesso! Redirecionando...');
        setTimeout(() => navigate('/subscribe'), 2000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Código inválido.');
      }
    } catch {
      setStatus('error');
      setMessage('Erro ao conectar ao servidor.');
    }
  };

  const handleResend = async () => {
    setStatus('pending');
    setMessage('Enviando novo código...');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/resend-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus('resent');
        setMessage('Novo código enviado!');
        setTimer(30);
      } else {
        setStatus('error');
        setMessage('Erro ao reenviar código.');
      }
    } catch {
      setStatus('error');
      setMessage('Erro ao conectar ao servidor.');
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-6 rounded shadow-md text-center">
          <h2 className="text-xl font-bold mb-4">Verifique seu e-mail</h2>
          <p className="mb-4">
            Enviamos um código de 6 dígitos para <b>{email}</b>. Digite-o abaixo para ativar sua conta.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
            <div className="flex gap-2 justify-center mb-2">
              {code.map((digit, idx) => (
                  <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="w-10 h-12 text-2xl text-center border rounded"
                      value={digit}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onPaste={handlePaste}
                      autoFocus={idx === 0}
                  />
              ))}
            </div>

            <button
                type="submit"
                className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                disabled={status === 'pending'}
            >
              Verificar
            </button>
          </form>

          <div className="mt-4">
            <button
                className="text-blue-600 hover:underline disabled:opacity-50"
                onClick={handleResend}
                disabled={timer > 0 || status === 'pending'}
            >
              {timer > 0 ? `Reenviar código em ${timer}s` : 'Reenviar código'}
            </button>
          </div>

          {status !== 'idle' && (
              <div className={`mt-4 ${status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                {message}
              </div>
          )}

          <div className="mt-2 text-xs text-gray-500">Não encontrou? Verifique sua caixa de spam.</div>
        </div>
      </div>
  );
}
