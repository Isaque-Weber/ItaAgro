// src/hooks/useUserPlan.ts
import { useEffect, useState } from 'react';

interface UserPlan {
    name: string;           // nome do usuário
    email: string;          // email do usuário
    status: string;         // status do plano
    planName?: string;      // nome do plano (para compatibilidade com componentes existentes)
    endDate: string;        // validade
    limit: number;          // limite de perguntas
}

// Determine the backend URL based on the environment
const getBackendUrl = () => {
    // In development, use localhost:4000
    if (window.location.hostname === 'localhost') {
        return 'http://localhost:4000';
    }
    // In production, use the deployed backend URL
    return 'https://itaagro-backend.up.railway.app';
};

// Helper function to add timeout to fetch
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        if (err instanceof DOMException && err.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeout}ms`);
        }
        throw err;
    }
};

// Helper function to retry failed requests
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, delay = 1000, timeout = 10000) => {
    try {
        const response = await fetchWithTimeout(url, options, timeout);
        return response;
    } catch (err) {
        console.error('Fetch error:', err);
        if (retries <= 1) throw err;
        console.log(`Request failed, retrying in ${delay}ms... (${retries-1} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2, timeout);
    }
};

export function useUserPlan() {
    const [data, setData] = useState<UserPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const node_env = import.meta.env.NODE_ENV

    useEffect(() => {
        setLoading(true);
        const backendUrl = getBackendUrl();
        const apiUrl = `${backendUrl}/api/user/plan`;

        console.log(`Fetching user plan from: ${apiUrl}`);

        // Log cookies for debugging (only in development)
        if (node_env !== 'production') {
            console.log('Cookies being sent:', document.cookie);
        }

        const fetchOptions = {
            credentials: 'include' as RequestCredentials,  // This is crucial for sending cookies
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors' as RequestMode  // Explicitly set CORS mode
        };

        // Use the retry mechanism
        fetchWithRetry(apiUrl, fetchOptions, 3, 1000)
            .then(async (res) => {
                if (!res.ok) {
                    // Try to get more detailed error information
                    const errorText = await res.text().catch(() => 'No error details');
                    console.error(`API Error (${res.status}): ${errorText}`);
                    throw new Error(`Falha ao carregar plano (${res.status}): ${errorText}`);
                }
                return res.json();
            })
            .then((responseData) => {
                console.log('API Response:', responseData);

                // Check if response has expected properties
                if (!responseData || typeof responseData !== 'object') {
                    console.error('Invalid response format:', responseData);
                    throw new Error('Formato de resposta inválido');
                }

                // Map status to planName for backward compatibility
                const formattedData = {
                    ...responseData,
                    planName: responseData.status || 'Desconhecido'
                };
                console.log('Formatted data:', formattedData);
                setData(formattedData);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    return { data, loading, error };
}
