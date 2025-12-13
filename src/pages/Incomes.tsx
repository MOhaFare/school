import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, TrendingUp, Download } from 'lucide-react';
import { Income } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import IncomeForm from '../components/incomes/IncomeForm';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../utils/format';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

const Incomes: React.FC = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchIncomes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('incomes').select('*').order('date', { ascending: false });
        if (error) throw error;
        setIncomes(data);
      } catch (error: any) {
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        toast.error(`Failed to fetch incomes: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    fetchIncomes();
  }, []);

  const filteredIncomes = incomes.filter(income =>
    income.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    income.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedIncome(null);
    setModalOpen(true);
  };

  const handleEdit = (income: Income) => {
    setSelectedIncome(income);
    setModalOpen(true);
  };

  const handleDelete = (income: Income) => {
    setSelectedIncome(income);
    setDeleteModalOpen(true);
  };

  const handleSaveIncome = async (formData: Omit<Income, 'id' | 'created_at'> & { id?: string }) => {
    setIsSubmitting(true);
    await toast.promise(
      (async () => {
        if (formData.id) {
          const { data, error } = await supabase.from('incomes').update(formData).eq('id', formData.id).select().single();
          if (error) throw error;
          setIncomes(prev => prev.map(i => i.id === formData.id ? data : i));
        } else {
          const { data, error } = await supabase.from('incomes').insert(formData).select().single();
          if (error) throw error;
          setIncomes(prev => [data, ...prev]);
        }
      })(),
      {
        loading: 'Saving income...',
        success: 'Income saved successfully!',
        error: (err) => `Failed to save income: ${err.message}`,
      }
    );
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedIncome) {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const { error } = await supabase.from('incomes').delete().eq('id', selectedIncome.id);
          if (error) throw error;
          setIncomes(prev => prev.filter(i => i.id !== selectedIncome.id));
        })(),
        {
          loading: 'Deleting income...',
          success: 'Income deleted successfully!',
          error: (err) => `Failed to delete income: ${err.message}`,
        }
      );
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedIncome(null);
    }
  };
  
  const totalIncomes = useMemo(() => {
    return filteredIncomes.reduce((sum, income) => sum + income.amount, 0);
  }, [filteredIncomes]);

  if (loading) {
    return <TableSkeleton title="Other Incomes" headers={['Title', 'Category', 'Amount', 'Date', 'Actions']} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Other Incomes</h1>
          <p className="text-slate-500 mt-1">Track and manage non-fee related income</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="border border-slate-200">
            <Download size={18} className="mr-2" />
            Export
          </Button>
          <Button onClick={handleAdd} className="shadow-md shadow-blue-500/20">
            <Plus size={18} className="mr-2" />
            Add Income
          </Button>
        </div>
      </div>

       <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Income (Filtered)</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{formatCurrency(totalIncomes)}</p>
          </div>
          <div className="p-3 bg-emerald-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredIncomes.map((income) => (
                <tr key={income.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{income.title}</div>
                    <div className="text-xs text-slate-500 font-mono">{income.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <Badge variant="neutral" className="capitalize">
                      {income.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">{formatCurrency(income.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell text-sm text-slate-700">{formatDate(income.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(income)} title="Edit"><Edit className="h-4 w-4 text-slate-500 hover:text-amber-600" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(income)} title="Delete"><Trash2 className="h-4 w-4 text-slate-500 hover:text-rose-600" /></Button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredIncomes.length === 0 && (
            <EmptyState 
                icon={TrendingUp}
                title="No income records found"
                description="Add a new income record to track revenue."
                actionLabel="Add Income"
                onAction={handleAdd}
            />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedIncome ? 'Edit Income' : 'Add New Income'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
              {selectedIncome ? 'Save Changes' : 'Add Income'}
            </Button>
          </>
        }
      >
        <IncomeForm ref={formRef} income={selectedIncome} onSubmit={handleSaveIncome} />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Income"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete Record</Button>
          </>
        }
      >
        <p>Are you sure you want to delete the income record <strong>"{selectedIncome?.title}"</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Incomes;
