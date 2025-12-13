import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import { Skeleton } from '../ui/Skeleton';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const StudentReport: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: students } = await supabase.from('students').select('*');
      
      if (students) {
        // Status Distribution
        const statusCounts = students.reduce((acc: any, curr: any) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {});
        const statusData = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));

        // Class Distribution
        const classCounts = students.reduce((acc: any, curr: any) => {
          const cls = `Class ${curr.class}`;
          acc[cls] = (acc[cls] || 0) + 1;
          return acc;
        }, {});
        const classData = Object.keys(classCounts).map(key => ({ name: key, value: classCounts[key] }));

        setData({ statusData, classData });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Student Status Distribution</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data?.statusData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                {data?.statusData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Enrollment by Class</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.classData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StudentReport;
