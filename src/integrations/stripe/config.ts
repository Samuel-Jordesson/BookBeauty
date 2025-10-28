// Configuração do Stripe
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51Rm2TG2SGkNEY6z3zmD8UPWXLquPHoPjmzZ2cVpw4ALpTQPfUQ5B8fHan2ymDEK7cu3YAoMsYIgO4v1wrzG33TDm00TfgukjBN';

// Product IDs dos planos
export const STRIPE_PRODUCTS = {
  free: null,
  basic: 'prod_TJqJ2VklXFnKBq', // R$ 9,99/mês
  premium: 'prod_TJqKIO36dhfRis', // R$ 19,99/mês
} as const;

// Planos disponíveis
export const PLANS = {
  free: {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    priceId: null,
  },
  basic: {
    id: 'basic',
    name: 'Básico',
    price: 9.99,
    priceId: null, // Será preenchido dinamicamente
    productId: STRIPE_PRODUCTS.basic,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    priceId: null, // Será preenchido dinamicamente
    productId: STRIPE_PRODUCTS.premium,
  },
} as const;

import { supabase } from '@/integrations/supabase/client';

// Função para redirecionar para checkout do Stripe
export const redirectToStripeCheckout = async (
  planId: 'basic' | 'premium',
  userId: string,
  salonId: string,
  userEmail?: string
) => {
  try {
    // URL do Supabase (usando a mesma URL do client)
    const supabaseUrl = 'https://wtwxggubulpikvsdiusn.supabase.co';
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
      },
      body: JSON.stringify({
        planId,
        userId,
        salonId,
        userEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar sessão de checkout');
    }

    const { url } = await response.json();
    
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('URL de checkout não retornada');
    }
  } catch (error: any) {
    console.error('Erro no checkout:', error);
    throw error;
  }
};
