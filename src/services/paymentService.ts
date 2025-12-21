import { supabase } from '../lib/supabaseClient';

export interface PaymentConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  title: string;
  description: string;
  callback_url: string;
  return_url: string;
}

// Mock Chapa Payment Initialization
export const initializeChapaPayment = async (paymentData: PaymentConfig) => {
  console.log("Initializing Chapa Payment...", paymentData);
  
  // In a real production app, you would call your backend (Edge Function) here
  // which would then call Chapa's API to keep your Secret Key safe.
  // const response = await fetch('https://api.chapa.co/v1/transaction/initialize', ...);
  
  // For demonstration, we simulate a successful initialization
  return {
    status: 'success',
    message: 'Payment initialized',
    data: {
      checkout_url: `https://checkout.chapa.co/checkout/payment/${paymentData.tx_ref}` // Fake URL
    }
  };
};

export const verifyPayment = async (txRef: string) => {
  console.log("Verifying payment for:", txRef);
  // Simulate verification API call
  return {
    status: 'success',
    data: {
      status: 'success',
      tx_ref: txRef,
      amount: 100,
      currency: 'ETB'
    }
  };
};

export const processSuccessfulPayment = async (feeId: string, transactionRef: string) => {
  const today = new Date().toISOString().split('T')[0];
  
  const { error } = await supabase
    .from('fees')
    .update({
      status: 'paid',
      payment_date: today,
      description: `Paid via Chapa (Ref: ${transactionRef})` // Append ref for tracking
    })
    .eq('id', feeId);

  if (error) throw error;
  return true;
};
