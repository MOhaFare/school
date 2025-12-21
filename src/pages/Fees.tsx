import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, DollarSign, Download, CreditCard } from 'lucide-react';
import { Fee } from '../types';
import { Button } from '../components/ui/Button';
import TableSkeleton from '../components/ui/TableSkeleton';
import Badge from '../components/ui/Badge';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from '../context/GlobalContext';
import { formatCurrency } from '../utils/format';
import Modal from '../components/ui/Modal';
import GenerateFeesModal from '../components/fees/GenerateFeesModal';
import PaymentModal from '../components/fees/PaymentModal';
import CollectPaymentModal from '../components/fees/CollectPaymentModal';
import FeeReceipt from '../components/fees/FeeReceipt';

const Fees: React.FC = () => {
  const { profile } = useGlobal();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modals
  const [isGenerateModalOpen, setGenerateModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false); // Online (Student)
  const [isCollectModalOpen, setCollectModalOpen] = useState(false); // Manual (Admin)
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  
  // Receipt
  const [receiptFee, setReceiptFee] = useState<Fee | null>(null);

  const fetchFees = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let query = supabase
        .from('fees')
        .select('*, students(name, roll_number, class, section)')
        .order('due_date', { ascending: false });

      // Role-based filtering
      if (profile.role === 'student') {
        // Student sees only their own fees (linked via user_id -> student_id)
        const { data: studentData } = await supabase.from('students').select('id').eq('user_id', profile.id).single();
        if (studentData) {
            query = query.eq('student_id', studentData.id);
        }
      } else if (profile.role === 'parent') {
        // Parent logic (omitted for brevity, similar to student)
      } else if (profile.role !== 'system_admin') {
        // Admin/Cashier sees all fees for the school
        query = query.eq('school_id', profile.school_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const transformedFees: Fee[] = (data || []).map((f: any) => ({
        id: f.id,
        student_id: f.student_id,
        studentName: f.students?.name || 'Unknown',
        amount: f.amount,
        due_date: f.due_date,
        status: f.status,
        payment_date: f.payment_date,
        description: f.description,
        month: f.month,
        school_id: f.school_id
      }));

      setFees(transformedFees);
    } catch (error: any) {
      toast.error(`Failed to load fees: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [profile]);

  const filteredFees = fees.filter(fee => {
    const matchesSearch = fee.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || fee.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handlePayOnline = (fee: Fee) => {
    setSelectedFee(fee);
    setPaymentModalOpen(true);
  };

  const handleCollectManual = (fee: Fee) => {
    setSelectedFee(fee);
    setCollectModalOpen(true);
  };

  const handlePrintReceipt = (fee: Fee) => {
    setReceiptFee(fee);
    // Logic to open receipt modal or print directly
    setTimeout(() => window.print(), 100); // Simple print trigger for now, usually opens a modal
  };

  const canCollect = ['admin', 'cashier', 'system_admin', 'principal'].includes(profile?.role || '');
  const isStudentOrParent = ['student', 'parent'].includes(profile?.role || '');

  if (loading) return <TableSkeleton title="Fees Collection" headers={['Student', 'Description', 'Amount', 'Status', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fees Collection</h1>
          <p className="text-slate-500 mt-1">Manage and track student fee payments.</p>
        </div>
        <div className="flex gap-2">
          {canCollect && (
            <Button onClick={() => setGenerateModalOpen(true)}>
              <Plus size={18} className="mr-2" /> Generate Fees
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Total Collected</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0))}
            </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Pending Dues</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(fees.filter(f => f.status === 'unpaid' || f.status === 'overdue').reduce((sum, f) => sum + f.amount, 0))}
            </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Search by student or fee type..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
        </div>
        <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {filteredFees.map(fee => (
                        <tr key={fee.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{fee.studentName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">{fee.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">{fee.due_date}</td>
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{formatCurrency(fee.amount)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={fee.status === 'paid' ? 'success' : fee.status === 'overdue' ? 'danger' : 'warning'}>
                                    {fee.status}
                                </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                {fee.status === 'paid' ? (
                                    <Button variant="ghost" size="sm" onClick={() => handlePrintReceipt(fee)}>
                                        <Download size={16} className="mr-1" /> Receipt
                                    </Button>
                                ) : (
                                    <div className="flex justify-end gap-2">
                                        {isStudentOrParent && (
                                            <Button size="sm" onClick={() => handlePayOnline(fee)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                                Pay Online
                                            </Button>
                                        )}
                                        {canCollect && (
                                            <Button size="sm" onClick={() => handleCollectManual(fee)} className="bg-green-600 hover:bg-green-700 text-white">
                                                Collect
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    {filteredFees.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No fees found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isGenerateModalOpen} onClose={() => setGenerateModalOpen(false)} title="Generate Fees">
        <GenerateFeesModal onClose={() => setGenerateModalOpen(false)} onSuccess={fetchFees} />
      </Modal>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Pay Online">
        {selectedFee && <PaymentModal fee={selectedFee} onClose={() => setPaymentModalOpen(false)} onSuccess={fetchFees} />}
      </Modal>

      <Modal isOpen={isCollectModalOpen} onClose={() => setCollectModalOpen(false)} title="Collect Payment">
        {selectedFee && <CollectPaymentModal fee={selectedFee} onClose={() => setCollectModalOpen(false)} onSuccess={fetchFees} />}
      </Modal>
      
      {/* Hidden Receipt for Printing */}
      {receiptFee && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
            <FeeReceipt fee={receiptFee} schoolName={profile?.school_name || 'School'} />
        </div>
      )}
    </div>
  );
};

export default Fees;
