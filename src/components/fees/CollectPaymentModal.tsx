import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import toast from 'react-hot-toast';
import { Fee } from '../../types';
import { formatCurrency } from '../../utils/format';
import { logAudit } from '../../services/logger';

interface CollectPaymentModalProps {
  fee: Fee;
  studentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({ fee, studentName, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [remarks, setRemarks] = useState('');

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('fees')
        .update({
          status: 'paid',
          payment_date: paymentDate,
          payment_mode: paymentMode,
          remarks: remarks,
          description: fee.description // Keep existing description
        })
        .eq('id', fee.id);

      if (error) throw error;

      await logAudit(
        'Collect Fee',
        'Fees Collection',
        `Collected ${formatCurrency(fee.amount)} from ${studentName} via ${paymentMode}`,
        undefined, undefined, fee.school_id
      );

      toast.success('Payment recorded successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Failed to record payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCollect} className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500 block">Student</span>
            <span className="font-semibold text-slate-900">{studentName}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Fee Type</span>
            <span className="font-semibold text-slate-900">{fee.description}</span>
          </div>
          <div className="col-span-2 border-t border-slate-200 pt-2 mt-2">
            <span className="text-slate-500 block">Amount Due</span>
            <span className="font-bold text-xl text-blue-600">{formatCurrency(fee.amount)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Payment Date</Label>
          <Input 
            type="date" 
            value={paymentDate} 
            onChange={(e) => setPaymentDate(e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label>Payment Mode</Label>
          <Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Mobile Money">Mobile Money (Telebirr/CBE)</option>
            <option value="Other">Other</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Remarks / Reference No.</Label>
        <Input 
          value={remarks} 
          onChange={(e) => setRemarks(e.target.value)} 
          placeholder="e.g. Receipt #1234 or Transaction ID" 
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading} className="bg-green-600 hover:bg-green-700">
          Confirm Payment
        </Button>
      </div>
    </form>
  );
};

export default CollectPaymentModal;
