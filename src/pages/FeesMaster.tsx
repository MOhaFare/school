import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import TableSkeleton from '../components/ui/TableSkeleton';
import FeeMasterForm from '../components/fees/FeeMasterForm';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from '../context/GlobalContext';
import { formatCurrency } from '../utils/format';

interface FeeMaster {
  id: string;
  name: string;
  amount: number;
  grade: string | null;
  description: string;
  frequency: 'monthly' | 'one-time' | 'yearly';
  school_id: string;
}

const FeesMaster: React.FC = () => {
  const { profile } = useGlobal();
  const [feeMasters, setFeeMasters] = useState<FeeMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeMaster | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  const fetchFees = async () => {
    if (!profile?.school_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fee_masters')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('grade', { ascending: true, nullsFirst: true })
        .order('name');

      if (error) throw error;
      setFeeMasters(data || []);
    } catch (error: any) {
      toast.error(`Failed to load fees: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [profile]);

  const filteredFees = feeMasters.filter(fee =>
    fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fee.grade && fee.grade.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAdd = () => {
    setSelectedFee(null);
    setModalOpen(true);
  };

  const handleEdit = (fee: FeeMaster) => {
    setSelectedFee(fee);
    setModalOpen(true);
  };

  const handleDelete = (fee: FeeMaster) => {
    setSelectedFee(fee);
    setDeleteModalOpen(true);
  };

  const handleSave = async (data: Omit<FeeMaster, 'id' | 'school_id'> & { id?: string }) => {
    setIsSubmitting(true);
    try {
      const feeData = {
        ...data,
        school_id: profile?.school_id
      };

      if (data.id) {
        const { error } = await supabase.from('fee_masters').update(feeData).eq('id', data.id);
        if (error) throw error;
        toast.success('Fee updated successfully');
      } else {
        const { error } = await supabase.from('fee_masters').insert(feeData);
        if (error) throw error;
        toast.success('Fee created successfully');
      }
      setModalOpen(false);
      fetchFees();
    } catch (error: any) {
      toast.error(`Error saving fee: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedFee) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('fee_masters').delete().eq('id', selectedFee.id);
      if (error) throw error;
      toast.success('Fee deleted successfully');
      setDeleteModalOpen(false);
      fetchFees();
    } catch (error: any) {
      toast.error(`Error deleting fee: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <TableSkeleton title="Fees Master" headers={['Name', 'Grade', 'Amount', 'Frequency', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fees Master</h1>
          <p className="text-slate-500 mt-1">Define tuition and other fee structures per grade.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={18} className="mr-2" /> Add Fee Structure
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search fees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fee Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredFees.map((fee) => (
                <tr key={fee.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{fee.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {fee.grade ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {fee.grade}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        All Grades
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700">{formatCurrency(fee.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize text-slate-600">{fee.frequency}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(fee)}>
                      <Edit className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(fee)}>
                      <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredFees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No fee structures found. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedFee ? 'Edit Fee Structure' : 'Add Fee Structure'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
              {selectedFee ? 'Save Changes' : 'Add Fee'}
            </Button>
          </>
        }
      >
        <FeeMasterForm ref={formRef} feeMaster={selectedFee} onSubmit={handleSave} />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Fee Structure"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} loading={isSubmitting}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{selectedFee?.name}</strong>? This will not affect fees already generated for students.</p>
      </Modal>
    </div>
  );
};

export default FeesMaster;
