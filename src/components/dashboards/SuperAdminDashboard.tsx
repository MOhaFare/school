import React, { useEffect, useState } from 'react';
import { Building2, Users, DollarSign, Activity, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import StatCard from '../StatCard';
import { Skeleton } from '../ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [roleStats, setRoleStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch high-level stats
        const [schoolsRes, usersRes] = await Promise.all([
          supabase.from('schools').select('*', { count: 'exact' }),
          supabase.from('profiles').select('*', { count: 'exact' })
        ]);

        const schools = schoolsRes.data || [];
        
        setStats({
          totalSchools: schoolsRes.count || 0,
          activeSchools: schools.filter((s: any) => s.is_active).length,
          totalUsers: usersRes.count || 0,
          totalRevenue: schools.length * 10000 // Mock revenue
        });

        // Fetch Role Distribution via RPC
        const { data: roleData, error: roleError } = await supabase.rpc('get_school_stats');
        
        if (roleError) {
            console.error("Error fetching role stats:", roleError);
        } else if (roleData) {
            // Transform data for chart: Group by school
            // Format: { name: "School A", admin: 2, teacher: 10, student: 100 }
            const chartDataMap: Record<string, any> = {};
            
            roleData.forEach((item: any) => {
                if (!chartDataMap[item.school_name]) {
                    chartDataMap[item.school_name] = { name: item.school_name, admin: 0, teacher: 0, student: 0 };
                }
                // Map roles to chart keys
                const roleKey = ['admin', 'teacher', 'student'].includes(item.role) ? item.role : 'other';
                if (roleKey !== 'other') {
                    chartDataMap[item.school_name][roleKey] = item.user_count;
                }
            });
            
            setRoleStats(Object.values(chartDataMap));
        }

      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
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

      {/* Role Distribution Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="text-lg font-bold text-slate-900">User Distribution by School</h3>
                <p className="text-sm text-slate-500">Verify role assignments across tenants</p>
            </div>
            <ShieldCheck className="text-blue-600 h-6 w-6" />
        </div>
        
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        cursor={{ fill: '#f8fafc' }}
                    />
                    <Legend />
                    <Bar dataKey="student" name="Students" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="teacher" name="Teachers" stackId="a" fill="#10b981" />
                    <Bar dataKey="admin" name="Admins" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
