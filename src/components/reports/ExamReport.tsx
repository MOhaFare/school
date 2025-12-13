import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import { Skeleton } from '../ui/Skeleton';

const ExamReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: grades } = await supabase.from('grades').select('gpa, exams(name)');
      
      if (grades) {
        const examStats: any = {};
        grades.forEach((g: any) => {
          const examName = g.exams?.name || 'Unknown';
          if (!examStats[examName]) examStats[examName] = { name: examName, totalGpa: 0, count: 0 };
          examStats[examName].totalGpa += g.gpa;
          examStats[examName].count++;
        });

        const chartData = Object.values(examStats).map((e: any) => ({
          name: e.name,
          avgGpa: parseFloat((e.totalGpa / e.count).toFixed(2))
        }));

        setData(chartData);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Average GPA by Exam</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 4]} />
            <Tooltip />
            <Bar dataKey="avgGpa" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Average GPA" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExamReport;
