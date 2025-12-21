import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import { Skeleton } from '../ui/Skeleton';
import { useGlobal } from '../../context/GlobalContext';

const LibraryReport: React.FC = () => {
  const { profile } = useGlobal();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      setLoading(true);
      const { data: books } = await supabase
        .from('library_books')
        .select('genre, quantity')
        .eq('school_id', profile.school_id);
      
      if (books) {
        const genreStats: any = {};
        books.forEach((b: any) => {
          if (!genreStats[b.genre]) genreStats[b.genre] = 0;
          genreStats[b.genre] += b.quantity;
        });

        const chartData = Object.keys(genreStats).map(key => ({ name: key, count: genreStats[key] }));
        setData(chartData);
      }
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Book Collection by Genre</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} name="Book Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LibraryReport;
