import React, { useEffect, useState } from 'react';
import { Users, DollarSign, BookOpen, GraduationCap } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';
import { formatCurrency } from '../../utils/format';
import { Skeleton } from '../ui/Skeleton';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
  </div>
);

const OverviewReport: React.FC = () => {
  const { profile } = useGlobal();
  const [stats, setStats] = useState<any>({
    students: 0,
    teachers: 0,
    classes: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.school_id) return;
      try {
        const [students, teachers, classes, fees] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', profile.school_id),
          supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('school_id', profile.school_id),
          supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', profile.school_id),
          supabase.from('fees').select('amount').eq('status', 'paid').eq('school_id', profile.school_id)
        ]);

        const totalRevenue = fees.data?.reduce((sum, f) => sum + f.amount, 0) || 0;

        setStats({
          students: students.count || 0,
          teachers: teachers.count || 0,
          classes: classes.count || 0,
          revenue: totalRevenue
        });
      } catch (error) {
        console.error('Error fetching overview stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [profile]);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={stats.students} icon={GraduationCap} color="bg-blue-500" />
        <StatCard title="Total Teachers" value={stats.teachers} icon={Users} color="bg-green-500" />
        <StatCard title="Total Classes" value={stats.classes} icon={BookOpen} color="bg-purple-500" />
        <StatCard title="Total Revenue" value={formatCurrency(stats.revenue)} icon={DollarSign} color="bg-yellow-500" />
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center py-12">
        <h3 className="text-lg font-medium text-slate-900">System Overview</h3>
        <p className="text-slate-500 mt-2">Select a specific tab above to view detailed reports and export data.</p>
      </div>
    </div>
  );
};

export default OverviewReport;
