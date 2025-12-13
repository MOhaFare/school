import React, { useEffect, useState } from 'react';
import { Building2, Users, DollarSign, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import StatCard from '../StatCard';
import { Skeleton } from '../ui/Skeleton';

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    totalUsers: 0,
    totalRevenue: 0 // Placeholder for SaaS revenue
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const [schoolsRes, usersRes] = await Promise.all([
        supabase.from('schools').select('*', { count: 'exact' }),
        supabase.from('profiles').select('*', { count: 'exact' })
      ]);

      const schools = schoolsRes.data || [];
      
      setStats({
        totalSchools: schoolsRes.count || 0,
        activeSchools: schools.filter((s: any) => s.is_active).length,
        totalUsers: usersRes.count || 0,
        totalRevenue: schools.length * 10000 // Mock revenue calculation
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">System Overview</h1>
        <p className="text-slate-500 mt-1">Super Admin Control Panel</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Schools" 
          value={stats.totalSchools.toString()} 
          icon={Building2} 
          iconBgColor="bg-blue-500" 
          trend={`${stats.activeSchools} Active`} 
          trendDirection="up" 
        />
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers.toString()} 
          icon={Users} 
          iconBgColor="bg-purple-500" 
          trend="System-wide" 
          trendDirection="up" 
        />
        <StatCard 
          title="System Health" 
          value="99.9%" 
          icon={Activity} 
          iconBgColor="bg-green-500" 
          trend="Uptime" 
          trendDirection="up" 
        />
        <StatCard 
          title="Est. Revenue" 
          value={`$${(stats.totalRevenue/1000).toFixed(1)}k`} 
          icon={DollarSign} 
          iconBgColor="bg-yellow-500" 
          trend="Monthly" 
          trendDirection="up" 
        />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
