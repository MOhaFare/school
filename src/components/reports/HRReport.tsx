import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import { Skeleton } from '../ui/Skeleton';
import { useGlobal } from '../../context/GlobalContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const HRReport: React.FC = () => {
  const { profile } = useGlobal();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      setLoading(true);
      const { data: teachers } = await supabase
        .from('teachers')
        .select('subject')
        .eq('school_id', profile.school_id);
      
      if (teachers) {
        const subjectCounts = teachers.reduce((acc: any, curr: any) => {
          acc[curr.subject] = (acc[curr.subject] || 0) + 1;
          return acc;
        }, {});
        
        const chartData = Object.keys(subjectCounts).map(key => ({ name: key, value: subjectCounts[key] }));
        setData(chartData);
      }
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Teacher Distribution by Subject</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HRReport;
