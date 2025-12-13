import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import { Skeleton } from '../ui/Skeleton';

const AttendanceReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: attendance } = await supabase.from('attendance').select('date, status');
      
      if (attendance) {
        const dailyStats: any = {};
        attendance.forEach((record: any) => {
          const date = record.date;
          if (!dailyStats[date]) dailyStats[date] = { date, present: 0, total: 0 };
          dailyStats[date].total++;
          if (record.status === 'present') dailyStats[date].present++;
        });

        const chartData = Object.values(dailyStats)
          .map((d: any) => ({ 
            date: d.date, 
            rate: Math.round((d.present / d.total) * 100) 
          }))
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-30); // Last 30 days

        setData(chartData);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Daily Attendance Rate (Last 30 Days)</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month:'short', day:'numeric'})} />
            <YAxis domain={[0, 100]} />
            <Tooltip labelFormatter={(str) => new Date(str).toLocaleDateString()} formatter={(val) => `${val}%`} />
            <Area type="monotone" dataKey="rate" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRate)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceReport;
