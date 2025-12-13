import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Skeleton } from '../ui/Skeleton';
import StatCard from '../StatCard';
import { formatCurrency } from '../../utils/format';

const CashierDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalFees: 0,
    pendingFees: 0,
    todayCollection: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const [feesPaid, feesPending, feesToday] = await Promise.all([
        supabase.from('fees').select('amount').eq('status', 'paid'),
        supabase.from('fees').select('amount').neq('status', 'paid'),
        supabase.from('fees').select('amount').eq('status', 'paid').eq('payment_date', today)
      ]);

      const totalFees = feesPaid.data?.reduce((sum, f) => sum + f.amount, 0) || 0;
      const pendingFees = feesPending.data?.reduce((sum, f) => sum + f.amount, 0) || 0;
      const todayCollection = feesToday.data?.reduce((sum, f) => sum + f.amount, 0) || 0;

      setStats({ totalFees, pendingFees, todayCollection });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Cashier Dashboard</h1>
        <p className="text-muted-foreground mt-1">Financial overview and fee collection status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
          title="Today's Collection" 
          value={formatCurrency(stats.todayCollection)} 
          icon={DollarSign} 
          iconBgColor="bg-green-500" 
          trend="Daily" 
          trendDirection="up" 
        />
        <StatCard 
          title="Total Collected" 
          value={formatCurrency(stats.totalFees)} 
          icon={TrendingUp} 
          iconBgColor="bg-blue-500" 
          trend="Lifetime" 
          trendDirection="up" 
        />
        <StatCard 
          title="Pending Fees" 
          value={formatCurrency(stats.pendingFees)} 
          icon={TrendingDown} 
          iconBgColor="bg-red-500" 
          trend="Outstanding" 
          trendDirection="down" 
        />
      </div>
    </div>
  );
};

export default CashierDashboard;
