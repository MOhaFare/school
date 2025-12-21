import React, { useState, useEffect } from 'react';
import { Search, DollarSign, AlertCircle, Filter, Download } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import TableSkeleton from '../components/ui/TableSkeleton';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate } from '../utils/format';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';
import EmptyState from '../components/ui/EmptyState';
import { useGlobal } from '../context/GlobalContext';

interface DueFee {
  id: string;
  student_id: string;
  student_name: string;
  class: string;
  section: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'unpaid' | 'overdue';
}

const DueFees: React.FC = () => {
  const { profile } = useGlobal();
  const [fees, setFees] = useState<DueFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    fetchDueFees();
  }, [profile]);

  const fetchDueFees = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      // Fetch fees that are NOT paid
      let query = supabase
        .from('fees')
        .select(`
          id, amount, due_date, description, status, student_id,
          students (name, class, section)
        `)
        .neq('status', 'paid')
        .order('due_date', { ascending: true });

      // Apply School Isolation
      if (profile.role !== 'system_admin' && profile.school_id) {
        query = query.eq('school_id', profile.school_id);
      }

      const { data: feesData, error: feesError } = await query;

      if (feesError) throw feesError;

      const formattedFees = feesData.map((f: any) => ({
        id: f.id,
        student_id: f.student_id,
        student_name: f.students?.name || 'Unknown',
        class: f.students?.class || 'N/A',
        section: f.students?.section || '',
        description: f.description,
        amount: f.amount,
        due_date: f.due_date,
        status: f.status
      }));

      setFees(formattedFees);
      
      // Extract unique classes for filter
      const uniqueClasses = Array.from(new Set(formattedFees.map((f: any) => f.class))).sort();
      setClasses(uniqueClasses as string[]);

    } catch (error: any) {
      toast.error(`Failed to load due fees: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredFees = fees.filter(fee => {
    const matchesSearch = fee.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fee.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'all' || fee.class === filterClass;
    return matchesSearch && matchesClass;
  });

  const totalDue = filteredFees.reduce((sum, f) => sum + f.amount, 0);

  const handleExport = () => {
    const headers = ["Student", "Class", "Description", "Due Date", "Amount", "Status"];
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + filteredFees.map(f => `"${f.student_name}","${f.class}-${f.section}","${f.description}","${f.due_date}","${f.amount}","${f.status}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "due_fees_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <TableSkeleton title="Due Fees Report" headers={['Student', 'Class', 'Description', 'Due Date', 'Amount', 'Status']} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Due Fees Report</h1>
          <p className="text-slate-500">Track outstanding payments and overdue fees</p>
        </div>
        <Button variant="secondary" onClick={handleExport}>
          <Download size={20} className="mr-2" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalDue)}</p>
          </div>
          <div className="p-3 bg-red-100 rounded-lg text-red-600">
            <DollarSign size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Overdue Records</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{filteredFees.filter(f => f.status === 'overdue').length}</p>
          </div>
          <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search student or fee description..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={20} />
          <select 
            value={filterClass} 
            onChange={e => setFilterClass(e.target.value)} 
            className="border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Classes</option>
            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredFees.map(fee => (
              <tr key={fee.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{fee.student_name}</td>
                <td className="px-6 py-4 text-slate-600">{fee.class}-{fee.section}</td>
                <td className="px-6 py-4 text-slate-600">{fee.description}</td>
                <td className="px-6 py-4 text-slate-600">{formatDate(fee.due_date)}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(fee.amount)}</td>
                <td className="px-6 py-4">
                  <Badge variant={fee.status === 'overdue' ? 'danger' : 'warning'} className="capitalize">
                    {fee.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {filteredFees.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">No due fees found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DueFees;
