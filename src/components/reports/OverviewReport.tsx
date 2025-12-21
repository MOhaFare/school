import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react';
import StatCard from '../StatCard';
import FinancialSummaryChart from './FinancialSummaryChart';
import ClassDistributionChart from './ClassDistributionChart';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../utils/format';
import { useGlobal } from '../../context/GlobalContext';

const OverviewReport: React.FC = () => {
  const { profile } = useGlobal();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!profile?.school_id) return;
      setLoading(true);
      try {
        const schoolId = profile.school_id;
        
        const [
          studentRes,
          teacherRes,
          gradesRes,
          classesRes,
          feesRes,
          payrollsRes,
          incomesRes,
          expensesRes,
          libraryRes,
          hostelRes
        ] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact' }).eq('school_id', schoolId),
          supabase.from('teachers').select('*', { count: 'exact' }).eq('school_id', schoolId),
          supabase.from('grades').select('gpa').eq('school_id', schoolId),
          supabase.from('classes').select('name').eq('school_id', schoolId),
          supabase.from('fees').select('amount').eq('status', 'paid').eq('school_id', schoolId),
          supabase.from('payrolls').select('net_salary').eq('status', 'paid').eq('school_id', schoolId),
          supabase.from('incomes').select('amount').eq('school_id', schoolId),
          supabase.from('expenses').select('amount').eq('school_id', schoolId),
          supabase.from('library_books').select('quantity, available').eq('school_id', schoolId),
          supabase.from('hostel_rooms').select('capacity, occupants, status').eq('school_id', schoolId)
        ]);

        const students = studentRes.data || [];
        const teachers = teacherRes.data || [];
        const grades = gradesRes.data || [];
        const classes = classesRes.data || [];
        const fees = feesRes.data || [];
        const payrolls = payrollsRes.data || [];
        const incomes = incomesRes.data || [];
        const expenses = expensesRes.data || [];
        const libraryBooks = libraryRes.data || [];
        const hostelRooms = hostelRes.data || [];

        const studentCount = studentRes.count || 0;
        const teacherCount = teacherRes.count || 0;

        const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
        const totalOtherIncomes = incomes.reduce((sum, i) => sum + i.amount, 0);
        const totalRevenue = totalFees + totalOtherIncomes;

        const totalPayroll = payrolls.reduce((sum, p) => sum + p.net_salary, 0);
        const totalOtherExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalCosts = totalPayroll + totalOtherExpenses;

        const netIncome = totalRevenue - totalCosts;

        const financialChartData = [
          { name: 'Fees', value: totalFees, fill: '#3b82f6' },
          { name: 'Other Income', value: totalOtherIncomes, fill: '#84cc16' },
          { name: 'Payroll', value: totalPayroll, fill: '#ef4444' },
          { name: 'Other Expenses', value: totalOtherExpenses, fill: '#f97316' },
        ];

        const classDistribution = classes.map((c: any) => ({ 
          name: `Class ${c.name}`, 
          value: students.filter((s: any) => `${s.class}-${s.section}` === c.name).length 
        })).filter((item: any) => item.value > 0);
        
        const summaryTable = [
            { module: 'Students', total: studentCount, metric1: `Active: ${students.filter((s: any) => s.status === 'active').length}`, metric2: `Avg. GPA: ${(grades.length > 0 ? grades.reduce((sum, g) => sum + g.gpa, 0) / grades.length : 0).toFixed(2)}` },
            { module: 'Teachers', total: teacherCount, metric1: `Active: ${teachers.filter((t: any) => t.status === 'active').length}`, metric2: `Avg. Salary: ${(teachers.length > 0 ? teachers.reduce((sum: number, t: any) => sum + t.salary, 0) / teachers.length : 0).toFixed(0)}` },
            { module: 'Library', total: libraryBooks.reduce((sum, b) => sum + b.quantity, 0), metric1: `Available: ${libraryBooks.reduce((sum, b) => sum + b.available, 0)}`, metric2: `Titles: ${libraryBooks.length}` },
            { module: 'Hostel', total: hostelRooms.length, metric1: `Available Rooms: ${hostelRooms.filter(r => r.status === 'available').length}`, metric2: `Occupancy: ${((hostelRooms.reduce((sum, r) => sum + r.occupants.length, 0) / (hostelRooms.reduce((sum, r) => sum + r.capacity, 0) || 1)) * 100).toFixed(0)}%` },
        ];

        setReportData({ totalRevenue, totalCosts, netIncome, studentCount, financialChartData, classDistribution, summaryTable });
      } catch (error: any) {
        toast.error(`Failed to load report data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [profile]);

  const netIncomeColor = reportData?.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600';

  if (loading || !reportData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Skeleton className="lg:col-span-3 h-80 w-full" />
          <Skeleton className="lg:col-span-2 h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={formatCurrency(reportData.totalRevenue)} icon={TrendingUp} iconBgColor="bg-green-500" trend="+12% this year" trendDirection="up" />
        <StatCard title="Total Costs" value={formatCurrency(reportData.totalCosts)} icon={TrendingDown} iconBgColor="bg-red-500" trend="+5% this year" trendDirection="up" />
        <div className="bg-white rounded-lg shadow-sm p-5 border border-slate-200">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <p className="text-sm font-medium text-slate-500">Net Income</p>
                    <p className={`text-3xl font-bold mt-1 ${netIncomeColor}`}>{formatCurrency(reportData.netIncome)}</p>
                </div>
                <div className={`p-3 rounded-lg ${reportData.netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <DollarSign className={`h-6 w-6 ${netIncomeColor}`} />
                </div>
            </div>
        </div>
        <StatCard title="Total Students" value={reportData.studentCount.toString()} icon={Users} iconBgColor="bg-blue-500" trend="+5% this year" trendDirection="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <FinancialSummaryChart data={reportData.financialChartData} />
        </div>
        <div className="lg:col-span-2">
          <ClassDistributionChart data={reportData.classDistribution} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">System Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Module</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Metric 1</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Metric 2</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {reportData.summaryTable.map((row: any) => (
                <tr key={row.module} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{row.module}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{row.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{row.metric1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{row.metric2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewReport;
