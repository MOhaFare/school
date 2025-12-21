import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../utils/format';
import { useGlobal } from '../../context/GlobalContext';

const FinanceReport: React.FC = () => {
  const { profile } = useGlobal();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      setLoading(true);
      const [fees, incomes, expenses, payrolls] = await Promise.all([
        supabase.from('fees').select('amount, due_date').eq('status', 'paid').eq('school_id', profile.school_id),
        supabase.from('incomes').select('amount, date').eq('school_id', profile.school_id),
        supabase.from('expenses').select('amount, date').eq('school_id', profile.school_id),
        supabase.from('payrolls').select('net_salary, paid_date').eq('status', 'paid').eq('school_id', profile.school_id)
      ]);

      // Aggregate by month (simplified)
      const monthlyData: any = {};
      
      const processIncome = (items: any[], dateKey: string) => {
         items?.forEach(item => {
            const date = new Date(item[dateKey]);
            const month = date.toLocaleString('default', { month: 'short' });
            if (!monthlyData[month]) monthlyData[month] = { name: month, income: 0, expense: 0 };
            monthlyData[month].income += item.amount;
         });
      };
      const processExpense = (items: any[], amountKey: string, dateKey: string) => {
         items?.forEach(item => {
            const date = new Date(item[dateKey]);
            const month = date.toLocaleString('default', { month: 'short' });
            if (!monthlyData[month]) monthlyData[month] = { name: month, income: 0, expense: 0 };
            monthlyData[month].expense += item[amountKey];
         });
      };

      processIncome(fees.data || [], 'due_date');
      processIncome(incomes.data || [], 'date');
      processExpense(expenses.data || [], 'amount', 'date');
      processExpense(payrolls.data || [], 'net_salary', 'paid_date');

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const chartData = months.map(m => monthlyData[m] || { name: m, income: 0, expense: 0 });
      
      setData(chartData);
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Monthly Financial Overview</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinanceReport;
