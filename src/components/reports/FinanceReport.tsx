import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';
import FinancialSummaryChart from './FinancialSummaryChart';
import { formatCurrency } from '../../utils/format';

const FinanceReport: React.FC = () => {
  const { profile } = useGlobal();
  const [data, setData] = useState<any[]>([]);
  const [totals, setTotal] = useState({ fees: 0, income: 0, expenses: 0, payroll: 0 });

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      const [fees, incomes, expenses, payroll] = await Promise.all([
        supabase.from('fees').select('amount').eq('status', 'paid').eq('school_id', profile.school_id),
        supabase.from('incomes').select('amount').eq('school_id', profile.school_id),
        supabase.from('expenses').select('amount').eq('school_id', profile.school_id),
        supabase.from('payrolls').select('net_salary').eq('status', 'paid').eq('school_id', profile.school_id)
      ]);

      const feeTotal = fees.data?.reduce((sum, i) => sum + i.amount, 0) || 0;
      const incomeTotal = incomes.data?.reduce((sum, i) => sum + i.amount, 0) || 0;
      const expenseTotal = expenses.data?.reduce((sum, i) => sum + i.amount, 0) || 0;
      const payrollTotal = payroll.data?.reduce((sum, i) => sum + i.net_salary, 0) || 0;

      setTotal({ fees: feeTotal, income: incomeTotal, expenses: expenseTotal, payroll: payrollTotal });

      setData([
        { name: 'Fees', value: feeTotal, fill: '#10b981' },
        { name: 'Other Income', value: incomeTotal, fill: '#3b82f6' },
        { name: 'Expenses', value: expenseTotal, fill: '#f59e0b' },
        { name: 'Payroll', value: payrollTotal, fill: '#ef4444' },
      ]);
    };
    fetchData();
  }, [profile]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FinancialSummaryChart data={data} />
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Financial Breakdown</h3>
        <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-800 font-medium">Fees Collected</span>
                <span className="text-green-900 font-bold">{formatCurrency(totals.fees)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-800 font-medium">Other Income</span>
                <span className="text-blue-900 font-bold">{formatCurrency(totals.income)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-800 font-medium">Operational Expenses</span>
                <span className="text-yellow-900 font-bold">{formatCurrency(totals.expenses)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-red-800 font-medium">Payroll Expenses</span>
                <span className="text-red-900 font-bold">{formatCurrency(totals.payroll)}</span>
            </div>
            <div className="border-t pt-4 mt-4 flex justify-between items-center">
                <span className="text-slate-800 font-bold">Net Balance</span>
                <span className={`text-xl font-bold ${(totals.fees + totals.income) - (totals.expenses + totals.payroll) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency((totals.fees + totals.income) - (totals.expenses + totals.payroll))}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceReport;
