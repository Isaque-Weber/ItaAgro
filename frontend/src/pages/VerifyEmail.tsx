import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
  const [status, setStatus] = useState<'pending' | 'success' | 'error' | 'info'>('pending');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Utilitário para ler query params
  function getQueryParam(param: string) {
    return new URLSearchParams(location.search).get(param);
  }

  useEffect(() => {
    const token = getQueryParam('token');
    const afterSignup = getQueryParam('afterSignup');
    const email = getQueryParam('email');

    if (afterSignup && email) {
      setStatus('info');
      setMessage(
        `Cadastro realizado! Enviamos um link de verificação para o e-mail: ${email}.\nAcesse sua caixa de entrada para ativar sua conta.`
      );
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Token de verificação não fornecido.');
      return;
    }

    // Chama a API para verificar o e-mail
    fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'E-mail verificado com sucesso!');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Falha ao verificar e-mail.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Erro ao conectar ao servidor.');
      });
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-6 rounded shadow-md text-center">
        {status === 'pending' && <p>Verificando e-mail...</p>}
        {status === 'success' && (
          <>
            <p className="text-green-600 dark:text-green-400 font-semibold mb-2">E-mail verificado com sucesso!</p>
            <p>Redirecionando para o login...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-red-600 dark:text-red-400 font-semibold mb-2">{message}</p>
            <button
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => navigate('/login')}
            >
              Ir para o login
            </button>
          </>
        )}
        {status === 'info' && (
          <>
            <p className="text-blue-600 dark:text-blue-400 font-semibold mb-2">{message}</p>
            <button
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => navigate('/login')}
            >
              Ir para o login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

