import React, { useState } from 'react';
import { Fee } from '../../types';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/format';
import { CreditCard, Smartphone, CheckCircle, Loader, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { processSuccessfulPayment } from '../../services/paymentService';

interface PaymentModalProps {
  fee: Fee;
  onClose: () => void;
  onSuccess: () => void;
  studentEmail: string;
  studentName: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ fee, onClose, onSuccess, studentEmail, studentName }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'processing' | 'success'>('select');

  const handlePayment = async (provider: 'chapa' | 'telebirr') => {
    setLoading(true);
    setStep('processing');

    try {
      // 1. Generate a unique transaction reference
      const txRef = `TX-${fee.id}-${Date.now()}`;

      // 2. In a real app, we would redirect the user to the payment gateway here.
      // window.location.href = checkout_url;
      
      // SIMULATION: We will simulate a successful payment after a delay
      console.log(`Processing ${provider} payment for ${formatCurrency(fee.amount)}...`);
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

      // 3. Update database
      await processSuccessfulPayment(fee.id, txRef);

      setStep('success');
      toast.success('Payment successful!');
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (error: any) {
      toast.error(`Payment failed: ${error.message}`);
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-500">Fee Description</span>
          <span className="font-medium text-slate-900">{fee.description}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-500">Student</span>
          <span className="font-medium text-slate-900">{studentName}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
          <span className="font-bold text-slate-700">Total Amount</span>
          <span className="font-bold text-xl text-blue-600">{formatCurrency(fee.amount)}</span>
        </div>
      </div>

      {step === 'select' && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-700">Select Payment Method:</p>
          
          <button 
            onClick={() => handlePayment('chapa')}
            className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CreditCard size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">Chapa</p>
                <p className="text-xs text-slate-500">Pay with local bank cards</p>
              </div>
            </div>
            <div className="h-5 w-5 rounded-full border-2 border-slate-300 group-hover:border-green-500"></div>
          </button>

          <button 
            onClick={() => handlePayment('telebirr')}
            className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Smartphone size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">Telebirr</p>
                <p className="text-xs text-slate-500">Pay using mobile money</p>
              </div>
            </div>
            <div className="h-5 w-5 rounded-full border-2 border-slate-300 group-hover:border-blue-500"></div>
          </button>
          
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-4">
            <ShieldCheck size={12} />
            <span>Secure payment processing</span>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Processing Payment...</h3>
          <p className="text-sm text-slate-500 text-center max-w-xs mt-2">
            Please wait while we confirm your transaction. Do not close this window.
          </p>
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 animate-bounce">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Payment Successful!</h3>
          <p className="text-sm text-slate-500 mt-2">
            Your receipt has been generated.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentModal;
