import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Download, DollarSign, Filter, Layers, Printer } from 'lucide-react';
import { Fee, Student } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import FeeForm from '../components/fees/FeeForm';
import GenerateFeesModal from '../components/fees/GenerateFeesModal';
import FeeReceipt from '../components/fees/FeeReceipt';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from '../context/GlobalContext';
import Badge from '../components/ui/Badge';
import { formatCurrency, formatDate } from '../utils/format';
import EmptyState from '../components/ui/EmptyState';
import { useReactToPrint } from 'react-to-print';

const Fees: React.FC = () => {
  const { schoolName, schoolAddress, schoolPhone, schoolEmail, schoolLogo, profile } = useGlobal();
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isModalOpen, setModalOpen] = useState(false);
  const [isGenerateModalOpen, setGenerateModalOpen] = useState(false);
  const [isReceiptModalOpen, setReceiptModalOpen] = useState(false);
  
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createNotification } = useGlobal();

  const formRef = useRef<HTMLFormElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const isAdminOrCashier = ['system_admin', 'admin', 'principal', 'cashier'].includes(profile?.role || '');

  const handlePrintReceipt = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${selectedFee?.id}`,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        { data: feesData, error: feesError },
        { data: studentsData, error: studentsError }
      ] = await Promise.all([
        supabase.from('fees').select('*').order('due_date', { ascending: true }),
        supabase.from('students').select('*')
      ]);

      if (feesError) throw feesError;
      if (studentsError) throw studentsError;

      setFees(feesData || []);
      setStudents(studentsData.map((s: any) => ({
        id: s.id,
        name: s.name,
        rollNumber: s.roll_number,
        class: s.class,
        section: s.section,
        // ... other fields
      } as Student)) || []);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const enrichedFees = useMemo(() => {
    return fees.map(fee => ({
      ...fee,
      studentName: students.find(s => s.id === fee.student_id)?.name || 'Unknown Student',
    }));
  }, [fees, students]);

  const filteredFees = enrichedFees.filter(fee =>
    fee.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedFee(null);
    setModalOpen(true);
  };

  const handleEdit = (fee: Fee) => {
    setSelectedFee(fee);
    setModalOpen(true);
  };

  const handleReceipt = (fee: Fee) => {
    setSelectedFee(fee);
    setReceiptModalOpen(true);
  };

  const handleDelete = (fee: Fee) => {
    setSelectedFee(fee);
    setDeleteModalOpen(true);
  };

  const handleSaveFee = async (formData: Omit<Fee, 'id' | 'studentName' | 'created_at'> & { id?: string }) => {
    setIsSubmitting(true);
    await toast.promise(
      (async () => {
        const feeToSave = {
          student_id: formData.student_id,
          description: formData.description,
          amount: formData.amount,
          due_date: formData.due_date,
          status: formData.status,
          payment_date: formData.status === 'paid' ? formData.payment_date || new Date().toISOString().split('T')[0] : null,
          month: formData.month,
        };

        if (formData.id) {
          const { data, error } = await supabase.from('fees').update(feeToSave).eq('id', formData.id).select().single();
          if (error) throw error;
          setFees(prev => prev.map(f => f.id === formData.id ? data : f));
        } else {
          const { data, error } = await supabase.from('fees').insert(feeToSave).select().single();
          if (error) throw error;
          setFees(prev => [data, ...prev]);

          const student = students.find(s => s.id === formData.student_id);
          if (student?.user_id) {
            await createNotification({
              user_id: student.user_id,
              title: 'New Fee Created',
              message: `A new fee for ${feeToSave.description} of ${feeToSave.amount} Birr is due on ${feeToSave.due_date}.`,
              type: 'fee',
              link_to: '/fees'
            });
          }
        }
      })(),
      {
        loading: 'Saving fee record...',
        success: 'Fee record saved successfully!',
        error: (err) => `Failed to save record: ${err.message}`,
      }
    );
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedFee) {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const { error } = await supabase.from('fees').delete().eq('id', selectedFee.id);
          if (error) throw error;
          setFees(prev => prev.filter(f => f.id !== selectedFee.id));
        })(),
        {
          loading: 'Deleting fee record...',
          success: 'Fee record deleted successfully!',
          error: (err) => `Failed to delete record: ${err.message}`,
        }
      );
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedFee(null);
    }
  };

  if (loading) {
    return <TableSkeleton title="Fees" headers={['Student', 'Details', 'Amount', 'Status', 'Actions']} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Fees Management</h1>
          <p className="text-slate-500 mt-1">Track and manage student fee payments</p>
        </div>
        {isAdminOrCashier && (
          <div className="flex gap-2">
            <Button onClick={() => setGenerateModalOpen(true)} variant="secondary" className="border border-slate-200 bg-white text-blue-600 hover:bg-blue-50">
              <Layers size={18} className="mr-2" />
              Generate Fees
            </Button>
            <Button onClick={handleAdd} className="shadow-md shadow-blue-500/20">
              <Plus size={18} className="mr-2" />
              Add Fee Record
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-card border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by student name or description..."
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Details</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredFees.map((fee) => (
                <tr key={fee.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{fee.studentName}</div>
                    <div className="text-xs text-slate-500 font-mono">{fee.student_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-slate-900 font-medium">{fee.description}</div>
                    <div className="text-xs text-slate-500">
                        {fee.month} • Due: {formatDate(fee.due_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{formatCurrency(fee.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={fee.status === 'paid' ? 'success' : fee.status === 'overdue' ? 'danger' : 'warning'}>
                      {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleReceipt(fee)} title="Print Receipt"><Printer className="h-4 w-4 text-slate-500 hover:text-blue-600" /></Button>
                        {isAdminOrCashier && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(fee)} title="Edit"><Edit className="h-4 w-4 text-slate-500 hover:text-amber-600" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(fee)} title="Delete"><Trash2 className="h-4 w-4 text-slate-500 hover:text-rose-600" /></Button>
                          </>
                        )}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredFees.length === 0 && (
            <EmptyState 
                icon={DollarSign}
                title="No fee records found"
                description={isAdminOrCashier ? "Try adjusting your search or add a new fee record." : "You have no fee records to display."}
                actionLabel={isAdminOrCashier ? "Add Fee Record" : undefined}
                onAction={isAdminOrCashier ? handleAdd : undefined}
            />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedFee ? 'Edit Fee Record' : 'Add New Fee Record'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
              {selectedFee ? 'Save Changes' : 'Add Record'}
            </Button>
          </>
        }
      >
        <FeeForm ref={formRef} fee={selectedFee} students={students} onSubmit={handleSaveFee} />
      </Modal>

      {/* Bulk Generation Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Generate Tuition Fees"
      >
        <GenerateFeesModal 
          onClose={() => setGenerateModalOpen(false)} 
          onSuccess={() => {
            fetchData(); // Refresh list
          }} 
        />
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Fee Receipt"
        footer={
          <Button onClick={handlePrintReceipt}>
            <Printer size={18} className="mr-2" /> Print Receipt
          </Button>
        }
      >
        <div className="bg-gray-100 p-4 rounded overflow-auto max-h-[60vh]">
          {selectedFee && (
            <div className="scale-90 origin-top">
              <FeeReceipt 
                ref={receiptRef}
                fee={{
                  ...selectedFee,
                  studentName: students.find(s => s.id === selectedFee.student_id)?.name,
                  class: students.find(s => s.id === selectedFee.student_id)?.class,
                  section: students.find(s => s.id === selectedFee.student_id)?.section,
                  rollNumber: students.find(s => s.id === selectedFee.student_id)?.rollNumber,
                }}
                schoolName={schoolName}
                schoolAddress={schoolAddress}
                schoolPhone={schoolPhone}
                schoolEmail={schoolEmail}
                schoolLogo={schoolLogo}
              />
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Fee Record"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete Record</Button>
          </>
        }
      >
        <p>Are you sure you want to delete the fee record for <strong>{selectedFee?.studentName}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Fees;
