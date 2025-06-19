import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SubscribePage.css';

// Interface for plan data returned by the API
interface Plan {
  id: string;
  reason: string;
  transaction_amount: number;
  frequency_type: 'months';
  frequency: number;
  repetitions?: number;
  init_point: string;
}

interface SubscribePageProps {
  onLogout(): void;
}

export function SubscribePage({ onLogout }: SubscribePageProps) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  // Fetch plans on component mount
  useEffect(() => {
    fetchPlans();
  }, []);

  // Function to fetch plans from the API
  async function fetchPlans() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/plans`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch plans: ${response.status}`);
      }
      
      const data = await response.json();
      setPlans(data);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
      setError(err.message || 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  }

  // Function to handle subscription
  async function handleSubscribe(planId: string) {
    setProcessingPlanId(planId);
    setError(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ planId }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Checkout failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.init_point) {
        // Redirect to Mercado Pago checkout
        window.location.href = data.init_point;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Error initiating checkout:', err);
      setError(err.message || 'Failed to initiate checkout');
      setProcessingPlanId(null);
    }
  }

  // Format currency as BRL
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  // Format plan description
  function formatPlanDescription(plan: Plan): string {
    if (plan.repetitions) {
      return `${formatCurrency(plan.transaction_amount)}/mês por ${plan.repetitions} meses`;
    }
    return `${formatCurrency(plan.transaction_amount)}/mês`;
  }

  return (
    <div className="subscribe-page">
      <header className="subscribe-header">
        <h1>Planos de Assinatura</h1>
        <button onClick={() => navigate(-1)} className="back-button">
          Voltar
        </button>
        <button onClick={onLogout} className="logout-button">
          Sair
        </button>
      </header>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchPlans}>Tentar novamente</button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <p>Carregando planos...</p>
        </div>
      ) : (
        <div className="plans-container">
          {plans.length === 0 ? (
            <p className="no-plans">Nenhum plano disponível no momento.</p>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="plan-card">
                <h2>{plan.reason}</h2>
                <p className="plan-price">{formatPlanDescription(plan)}</p>
                {plan.repetitions && (
                  <p className="plan-total">
                    Total: {formatCurrency(plan.transaction_amount * plan.repetitions)}
                  </p>
                )}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={processingPlanId !== null}
                  className="subscribe-button"
                >
                  {processingPlanId === plan.id ? 'Processando...' : 'Assinar'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}