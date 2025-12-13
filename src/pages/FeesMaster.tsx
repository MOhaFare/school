import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Modal from '../components/ui/Modal';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../utils/format';

interface FeeMaster {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  description: string;
}

const FeesMaster: React.FC = () => {
  const [fees, setFees] = useState<FeeMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeMaster | null>(null);
  const [formData, setFormData] = useState({
    name: '', amount: 0, due_date: '', description: ''
  });

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('fee_masters').select('*').order('name');
    if (error) toast.error('Failed to load fees master');
    else setFees(data || []);
    setLoading(false);
  };

  const handleOpenModal = (fee?: FeeMaster) => {
    setSelectedFee(fee || null);
    setFormData({
      name: fee?.name || '',
      amount: fee?.amount || 0,
      due_date: fee?.due_date || '',
      description: fee?.description || ''
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedFee) {
        const { error } = await supabase.from('fee_masters').update(formData).eq('id', selectedFee.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fee_masters').insert(formData);
        if (error) throw error;
      }
      toast.success('Fee structure saved');
      setModalOpen(false);
      fetchFees();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fee structure?')) return;
    const { error } = await supabase.from('fee_masters').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Deleted successfully');
      fetchFees();
    }
  };

  if (loading) return <TableSkeleton title="Fees Master" headers={['Fee Name', 'Amount', 'Due Date', 'Description', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fees Master</h1>
          <p className="text-slate-500">Define standard fee structures and types</p>
        </div>
        <Button onClick={() => handleOpenModal()}><Plus size={20} className="mr-2"/> Add Fee Type</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fee Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Default Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {fees.map(fee => (
              <tr key={fee.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{fee.name}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(fee.amount)}</td>
                <td className="px-6 py-4 text-slate-600">{fee.due_date ? formatDate(fee.due_date) : 'N/A'}</td>
                <td className="px-6 py-4 text-slate-600 text-sm">{fee.description}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(fee)}><Edit size={16}/></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(fee.id)}><Trash2 size={16} className="text-red-500"/></Button>
                </td>
              </tr>
            ))}
            {fees.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No fee structures defined.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={selectedFee ? 'Edit Fee Type' : 'Add Fee Type'} footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Fee Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Tuition Fee - Grade 10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Default Due Date</Label>
              <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FeesMaster;
