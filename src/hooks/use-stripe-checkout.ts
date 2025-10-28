import { useCallback } from 'react';
import { getStripe } from '@/integrations/stripe/client';
import { useToast } from './use-toast';

interface CheckoutParams {
  planId: 'basic' | 'premium';
  userId: string;
  salonId: string;
}

export const useStripeCheckout = () => {
  const { toast } = useToast();

  const handleCheckout = useCallback(async ({ planId, userId, salonId }: CheckoutParams) => {
    try {
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe não foi carregado corretamente');
      }

      // Buscar o Price ID do produto
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId,
          salonId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar sessão de checkout');
      }

      const { sessionId } = await response.json();

      // Redirecionar para o checkout do Stripe
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Erro no checkout:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao processar o pagamento. Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return { handleCheckout };
};
