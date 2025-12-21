import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, Download, DollarSign, Plus, Edit, Trash2, Filter, Printer } from 'lucide-react';
import { type Payroll as PayrollType, Teacher } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import PayrollForm from '../components/payroll/PayrollForm';
import Payslip from '../components/payroll/Payslip';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge';
import { formatCurrency } from '../utils/format';
import EmptyState from '../components/ui/EmptyState';
import { useGlobal } from '../context/GlobalContext';
import { useReactToPrint } from 'react-to-print';

const transformPayrollToCamelCase = (dbPayroll: any): PayrollType => ({
  id: dbPayroll.id,
  created_at: dbPayroll.created_at,
  teacherId: dbPayroll.teacher_id,
  month: dbPayroll.month,
  year: dbPayroll.year,
  baseSalary: dbPayroll.base_salary,
  bonus: dbPayroll.bonus,
  deductions: dbPayroll.deductions,
  netSalary: dbPayroll.net_salary,
  status: dbPayroll.status,
  paidDate: dbPayroll.paid_date,
  teacherName: '',
});

const Payroll: React.FC = () => {
  const { schoolName, schoolAddress, schoolLogo, profile } = useGlobal();
  const [payrolls, setPayrolls] = useState<PayrollType[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [isPayslipModalOpen, setPayslipModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollType | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const payslipRef = useRef<HTMLDivElement>(null);

  const handlePrintPayslip = useReactToPrint({
    content: () => payslipRef.current,
    documentTitle: `Payslip-${selectedPayroll?.id}`,
    onBeforeGetContent: () => {
      if (!payslipRef.current) {
        toast.error("Content not ready for printing");
        return Promise.reject();
      }
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      setLoading(true);
      try {
        let payrollsQuery = supabase.from('payrolls').select('*').order('year', { ascending: false }).order('month', { ascending: false });
        let teachersQuery = supabase.from('teachers').select('id, name, salary, subject, join_date');

        if (profile.role !== 'system_admin' && profile.school_id) {
          payrollsQuery = payrollsQuery.eq('school_id', profile.school_id);
          teachersQuery = teachersQuery.eq('school_id', profile.school_id);
        }

        const [
          { data: payrollsData, error: payrollsError },
          { data: teachersData, error: teachersError }
        ] = await Promise.all([
          payrollsQuery,
          teachersQuery
        ]);

        if (payrollsError) throw payrollsError;
        if (teachersError) throw teachersError;

        setPayrolls((payrollsData || []).map(transformPayrollToCamelCase));
        setTeachers(teachersData.map((t: any) => ({
            ...t,
            joinDate: t.join_date 
        })) || []);
      } catch (error: any) {
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        toast.error(`Failed to load data: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  const enrichedPayrolls = useMemo(() => {
    return payrolls.map(p => ({
      ...p,
      teacherName: teachers.find(t => t.id === p.teacherId)?.name || 'Unknown Teacher'
    }));
  }, [payrolls, teachers]);

  const filteredPayrolls = enrichedPayrolls.filter(payroll => {
    const matchesSearch = payroll.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.month.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || payroll.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  const handleAdd = () => {
    setSelectedPayroll(null);
    setModalOpen(true);
  };

  const handleEdit = (payroll: PayrollType) => {
    setSelectedPayroll(payroll);
    setModalOpen(true);
  };

  const handleViewPayslip = (payroll: PayrollType) => {
    setSelectedPayroll(payroll);
    setPayslipModalOpen(true);
  };

  const handleDelete = (payroll: PayrollType) => {
    setSelectedPayroll(payroll);
    setDeleteModalOpen(true);
  };

  const handleSavePayroll = async (formData: Omit<PayrollType, 'id' | 'teacherName' | 'baseSalary' | 'netSalary' | 'created_at'> & { id?: string }) => {
    setIsSubmitting(true);
    await toast.promise(
      (async () => {
        const teacher = teachers.find(t => t.id === formData.teacherId);
        if (!teacher) throw new Error("Selected teacher not found.");
        
        // Ensure salary is a number
        const baseSalary = Number(teacher.salary) || 0;
        const bonus = Number(formData.bonus) || 0;
        const deductions = Number(formData.deductions) || 0;

        const payrollToSave = {
          teacher_id: formData.teacherId,
          month: formData.month,
          year: formData.year,
          bonus: bonus,
          deductions: deductions,
          status: formData.status,
          paid_date: formData.status === 'paid' ? formData.paidDate || new Date().toISOString().split('T')[0] : null,
          base_salary: baseSalary,
          net_salary: baseSalary + bonus - deductions,
          school_id: profile?.school_id
        };

        if (formData.id) {
          const { data, error } = await supabase.from('payrolls').update(payrollToSave).eq('id', formData.id).select().single();
          if (error) throw error;
          setPayrolls(prev => prev.map(p => p.id === formData.id ? transformPayrollToCamelCase(data) : p));
        } else {
          const { data, error } = await supabase.from('payrolls').insert(payrollToSave).select().single();
          if (error) throw error;
          setPayrolls(prev => [transformPayrollToCamelCase(data), ...prev]);
        }
      })(),
      {
        loading: 'Saving payroll...',
        success: 'Payroll record saved successfully!',
        error: (err) => `Failed to save payroll: ${err.message}`,
      }
    );
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedPayroll) {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const { error } = await supabase.from('payrolls').delete().eq('id', selectedPayroll.id);
          if (error) throw error;
          setPayrolls(prev => prev.filter(p => p.id !== selectedPayroll.id));
        })(),
        {
          loading: 'Deleting payroll record...',
          success: 'Payroll record deleted successfully!',
          error: (err) => `Failed to delete record: ${err.message}`,
        }
      );
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedPayroll(null);
    }
  };

  const totalPaid = payrolls.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.netSalary, 0);
  const totalPending = payrolls.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.netSalary, 0);

  if (loading) {
    return <TableSkeleton title="Payroll" headers={['Teacher', 'Period', 'Net Salary', 'Status', 'Actions']} />;
  }

  return (
    <div className="space-y-6">
      {/* ... (JSX remains similar) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Payroll Management</h1>
          <p className="text-slate-500 mt-1">Manage teacher salaries and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="border border-slate-200">
            <Download size={18} className="mr-2" />
            Export
          </Button>
          <Button onClick={handleAdd} className="shadow-md shadow-blue-500/20">
            <Plus size={18} className="mr-2" />
            Generate Payroll
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">Total Paid</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg"><DollarSign className="h-6 w-6 text-emerald-600" /></div>
            </div>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">Total Pending</p>
                    <p className="text-2xl font-bold text-amber-600 mt-2">{formatCurrency(totalPending)}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg"><DollarSign className="h-6 w-6 text-amber-600" /></div>
            </div>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">This Month</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(totalPaid + totalPending)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg"><DollarSign className="h-6 w-6 text-blue-600" /></div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Search by teacher name, ID, or month..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all" 
            />
          </div>
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
             <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)} 
                className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white appearance-none"
             >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
             </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Period</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Salary</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredPayrolls.map((payroll) => (
                <tr key={payroll.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{payroll.teacherName}</div>
                    <div className="text-xs text-slate-500 font-mono">{payroll.teacherId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-slate-900 font-medium">{payroll.month} {payroll.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{formatCurrency(payroll.netSalary)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={payroll.status === 'paid' ? 'success' : payroll.status === 'processing' ? 'warning' : 'danger'}>
                      {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleViewPayslip(payroll)} title="Print Payslip"><Printer className="h-4 w-4 text-slate-500 hover:text-blue-600" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(payroll)} title="Edit"><Edit className="h-4 w-4 text-slate-500 hover:text-amber-600" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(payroll)} title="Delete"><Trash2 className="h-4 w-4 text-slate-500 hover:text-rose-600" /></Button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPayrolls.length === 0 && (
            <EmptyState 
                icon={DollarSign}
                title="No payroll records found"
                description="Generate a new payroll record to get started."
                actionLabel="Generate Payroll"
                onAction={handleAdd}
            />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={selectedPayroll ? 'Edit Payroll' : 'Generate Payroll'} footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>{selectedPayroll ? 'Save Changes' : 'Generate'}</Button></>}>
        <PayrollForm ref={formRef} payroll={selectedPayroll} teachers={teachers} onSubmit={handleSavePayroll} />
      </Modal>

      {/* Payslip Modal */}
      <Modal 
        isOpen={isPayslipModalOpen} 
        onClose={() => setPayslipModalOpen(false)} 
        title="Payslip"
        footer={
            <Button onClick={handlePrintPayslip}>
                <Printer size={18} className="mr-2" /> Print Payslip
            </Button>
        }
      >
        <div className="bg-gray-100 p-4 rounded overflow-auto max-h-[60vh]">
            {selectedPayroll && (
                <div className="scale-90 origin-top">
                    <Payslip 
                        ref={payslipRef}
                        payroll={{
                            ...selectedPayroll,
                            teacherRole: teachers.find(t => t.id === selectedPayroll.teacherId)?.subject + ' Teacher',
                            joinDate: teachers.find(t => t.id === selectedPayroll.teacherId)?.joinDate
                        }}
                        schoolName={schoolName}
                        schoolAddress={schoolAddress}
                        schoolLogo={schoolLogo}
                    />
                </div>
            )}
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Payroll Record" footer={<><Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete Record</Button></>}>
        <p>Are you sure you want to delete the payroll record for <strong>{selectedPayroll?.teacherName}</strong> for {selectedPayroll?.month}? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Payroll;
