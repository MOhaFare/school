import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, TrendingDown, Download } from 'lucide-react';
import { Expense } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import ExpenseForm from '../components/expenses/ExpenseForm';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../utils/format';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { useGlobal } from '../context/GlobalContext';

const Expenses: React.FC = () => {
  const { profile } = useGlobal();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FIX: Explicitly define formRef to prevent "formRef is not defined" error
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!profile?.school_id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('school_id', profile.school_id)
          .order('date', { ascending: false });
          
        if (error) throw error;
        setExpenses(data);
      } catch (error: any) {
        toast.error(`Failed to fetch expenses: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [profile]);

  const filteredExpenses = expenses.filter(expense =>
    expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedExpense(null);
    setModalOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setModalOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    setSelectedExpense(expense);
    setDeleteModalOpen(true);
  };

  const handleSaveExpense = async (formData: Omit<Expense, 'id' | 'created_at'> & { id?: string }) => {
    setIsSubmitting(true);
    try {
        const payload = { ...formData, school_id: profile?.school_id };
        if (formData.id) {
          const { data, error } = await supabase.from('expenses').update(payload).eq('id', formData.id).select().single();
          if (error) throw error;
          setExpenses(prev => prev.map(e => e.id === formData.id ? data : e));
        } else {
          const { data, error } = await supabase.from('expenses').insert(payload).select().single();
          if (error) throw error;
          setExpenses(prev => [data, ...prev]);
        }
        toast.success('Expense saved successfully!');
        setModalOpen(false);
    } catch(error: any) {
        toast.error(`Failed to save expense: ${error.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedExpense) {
      setIsSubmitting(true);
      try {
          const { error } = await supabase.from('expenses').delete().eq('id', selectedExpense.id);
          if (error) throw error;
          setExpenses(prev => prev.filter(e => e.id !== selectedExpense.id));
          toast.success('Expense deleted successfully!');
          setDeleteModalOpen(false);
          setSelectedExpense(null);
      } catch(error: any) {
          toast.error(`Failed to delete expense: ${error.message}`);
      } finally {
          setIsSubmitting(false);
      }
    }
  };

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  if (loading) {
    return <TableSkeleton title="Expenses" headers={['Title', 'Category', 'Amount', 'Date', 'Actions']} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Expenses</h1>
          <p className="text-slate-500 mt-1">Track and manage all school expenses</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAdd} className="shadow-md shadow-blue-500/20">
            <Plus size={18} className="mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Expenses (Filtered)</p>
            <p className="text-3xl font-bold text-rose-600 mt-2">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="p-3 bg-rose-100 rounded-lg">
            <TrendingDown className="h-6 w-6 text-rose-600" />
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
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{expense.title}</div>
                    <div className="text-xs text-slate-500 font-mono">{expense.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <Badge variant="neutral" className="capitalize">
                      {expense.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-rose-600">{formatCurrency(expense.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell text-sm text-slate-700">{formatDate(expense.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)} title="Edit"><Edit className="h-4 w-4 text-slate-500 hover:text-amber-600" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(expense)} title="Delete"><Trash2 className="h-4 w-4 text-slate-500 hover:text-rose-600" /></Button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredExpenses.length === 0 && (
            <EmptyState 
                icon={TrendingDown}
                title="No expenses found"
                description="Add a new expense record to track spending."
                actionLabel="Add Expense"
                onAction={handleAdd}
            />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedExpense ? 'Edit Expense' : 'Add New Expense'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
              {selectedExpense ? 'Save Changes' : 'Add Expense'}
            </Button>
          </>
        }
      >
        <ExpenseForm ref={formRef} expense={selectedExpense} onSubmit={handleSaveExpense} />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Expense"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete Record</Button>
          </>
        }
      >
        <p>Are you sure you want to delete the expense <strong>"{selectedExpense?.title}"</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Expenses;
