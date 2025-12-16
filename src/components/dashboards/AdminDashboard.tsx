import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, DollarSign, TrendingDown, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { Skeleton } from '../ui/Skeleton';
import { Student } from '../../types';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatCurrency } from '../../utils/format';
import Badge from '../ui/Badge';
import { useGlobal } from '../../context/GlobalContext';

const DashboardStatCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string; loading: boolean; trend?: string; trendUp?: boolean }> = ({ title, value, icon: Icon, color, loading, trend, trendUp }) => {
  if (loading) {
    return <Skeleton className="h-[140px] w-full rounded-xl" />;
  }
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-card p-6 border border-border relative overflow-hidden group"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-opacity-10`} style={{ backgroundColor: `${color}15`, color: color }}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-xs font-medium">
          <span className={`flex items-center ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trendUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {trend}
          </span>
          <span className="text-muted-foreground ml-2">vs last month</span>
        </div>
      )}
      
      {/* Decorative background blob */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-5 transition-transform group-hover:scale-150 duration-500" style={{ backgroundColor: color }}></div>
    </motion.div>
  );
};

const PerformanceChart: React.FC<{data: any[]; loading: boolean}> = ({data, loading}) => {
  if (loading) {
    return <Skeleton className="h-[400px] w-full rounded-xl" />;
  }
  return (
    <div className="bg-white rounded-xl shadow-card p-6 border border-border h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Academic Performance</h3>
          <p className="text-sm text-muted-foreground">Average student scores over time</p>
        </div>
        <select className="text-sm border-border rounded-lg text-slate-600 focus:ring-primary">
          <option>This Year</option>
          <option>Last Year</option>
        </select>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ color: '#1e293b', fontWeight: 600 }}
            />
            <Area type="monotone" dataKey="performance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPerf)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const RecentStudents: React.FC<{ students: Student[]; loading: boolean }> = ({ students, loading }) => {
  if (loading) {
    return <Skeleton className="h-[400px] w-full rounded-xl" />;
  }
  return (
    <div className="bg-white rounded-xl shadow-card p-6 border border-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">New Admissions</h3>
        <button className="text-sm text-blue-600 font-medium hover:underline flex items-center">
          View All <ArrowRight className="h-3 w-3 ml-1" />
        </button>
      </div>
      <div className="space-y-4 flex-grow">
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent admissions.</p>
        ) : (
          students.map(student => (
            <div key={student.id} className="flex items-center justify-between group p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 overflow-hidden shrink-0">
                  {student.avatar ? <img src={student.avatar} alt={student.name} className="w-full h-full object-cover"/> : student.name.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{student.name}</p>
                  <p className="text-xs text-muted-foreground">Class {student.class}-{student.section}</p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface DashboardStats {
  studentCount: number;
  teacherCount: number;
  totalRevenue: number;
  totalExpenses: number;
}

const AdminDashboard: React.FC = () => {
  const { profile } = useGlobal();
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Wait for profile to load to ensure we have the school_id
      if (!profile) return;

      setLoading(true);
      try {
        // Construct queries with explicit school_id filtering
        let studentQuery = supabase.from('students').select('*', { count: 'exact', head: true });
        let teacherQuery = supabase.from('teachers').select('*', { count: 'exact', head: true });
        let feesQuery = supabase.from('fees').select('amount').eq('status', 'paid');
        let expensesQuery = supabase.from('expenses').select('amount');
        let recentStudentsQuery = supabase.from('students').select('*').order('created_at', { ascending: false }).limit(5);
        let gradesQuery = supabase.from('grades').select('created_at, marks_obtained, exams(total_marks)');

        // Apply School ID filter if not System Admin
        if (profile.role !== 'system_admin' && profile.school_id) {
            const schoolId = profile.school_id;
            studentQuery = studentQuery.eq('school_id', schoolId);
            teacherQuery = teacherQuery.eq('school_id', schoolId);
            feesQuery = feesQuery.eq('school_id', schoolId);
            expensesQuery = expensesQuery.eq('school_id', schoolId);
            recentStudentsQuery = recentStudentsQuery.eq('school_id', schoolId);
            gradesQuery = gradesQuery.eq('school_id', schoolId);
        }

        const [
          studentResult,
          teacherResult,
          feesResult,
          expensesResult,
          recentStudentsResult,
          gradesResult
        ] = await Promise.all([
          studentQuery,
          teacherQuery,
          feesQuery,
          expensesQuery,
          recentStudentsQuery,
          gradesQuery
        ]);

        const results = { studentResult, teacherResult, feesResult, expensesResult, recentStudentsResult, gradesResult };
        for (const [key, result] of Object.entries(results)) {
          if (result.error) {
            throw new Error(`Failed to fetch ${key.replace('Result', '')}: ${result.error.message}`);
          }
        }

        const { count: studentCount } = studentResult;
        const { count: teacherCount } = teacherResult;
        const { data: feesData } = feesResult;
        const { data: expensesData } = expensesResult;
        const { data: recentStudentsData } = recentStudentsResult;
        const { data: gradesData } = gradesResult;

        const totalRevenue = feesData?.reduce((sum, item) => sum + item.amount, 0) || 0;
        const totalExpenses = expensesData?.reduce((sum, item) => sum + item.amount, 0) || 0;
        
        setStats({
          studentCount: studentCount || 0,
          teacherCount: teacherCount || 0,
          totalRevenue,
          totalExpenses
        });
        setStudents(recentStudentsData || []);

        const monthlyPerformance: { [key: string]: { total: number; count: number } } = {};
        if (gradesData) {
            gradesData.forEach((grade: any) => {
                const date = new Date(grade.created_at);
                const month = date.toLocaleString('default', { month: 'short' });
                if (!monthlyPerformance[month]) {
                    monthlyPerformance[month] = { total: 0, count: 0 };
                }
                const totalMarks = grade.exams?.total_marks ?? 100;
                const percentage = totalMarks > 0 ? (grade.marks_obtained / totalMarks) * 100 : 0;
                monthlyPerformance[month].total += percentage;
                monthlyPerformance[month].count += 1;
            });
        }

        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartData = monthOrder.map(month => {
            const data = monthlyPerformance[month];
            return {
                name: month,
                performance: data ? Math.round(data.total / data.count) : 0,
            };
        }).filter(d => d.performance > 0);
        
        // Fallback data for demo if empty
        const finalChartData = chartData.length > 0 ? chartData : [
            { name: 'Jan', performance: 0 }, { name: 'Feb', performance: 0 }, 
            { name: 'Mar', performance: 0 }, { name: 'Apr', performance: 0 },
            { name: 'May', performance: 0 }
        ];
        
        setPerformanceData(finalChartData);

      } catch (error: any) {
        console.error("AdminDashboard Error:", error);
        toast.error("Failed to refresh dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back, {profile?.name || 'Admin'}. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-border shadow-sm">
          <button className="px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-900 rounded-md shadow-sm">Overview</button>
          <button className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">Analytics</button>
          <button className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">Reports</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard 
          title="Total Students" 
          value={`${stats?.studentCount ?? 0}`} 
          icon={GraduationCap} 
          color="#3b82f6" 
          loading={loading} 
          trend="12%" 
          trendUp={true} 
        />
        <DashboardStatCard 
          title="Total Teachers" 
          value={`${stats?.teacherCount ?? 0}`} 
          icon={Users} 
          color="#10b981" 
          loading={loading} 
          trend="4%" 
          trendUp={true} 
        />
        <DashboardStatCard 
          title="Total Revenue" 
          value={formatCurrency(stats?.totalRevenue ?? 0)} 
          icon={DollarSign} 
          color="#8b5cf6" 
          loading={loading} 
          trend="8%" 
          trendUp={true} 
        />
        <DashboardStatCard 
          title="Total Expenses" 
          value={formatCurrency(stats?.totalExpenses ?? 0)} 
          icon={TrendingDown} 
          color="#f59e0b" 
          loading={loading} 
          trend="2%" 
          trendUp={false} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceChart data={performanceData} loading={loading} />
        </div>
        <div>
          <RecentStudents students={students} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
