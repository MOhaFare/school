import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import { Skeleton } from '../ui/Skeleton';
import { useGlobal } from '../../context/GlobalContext';

const TransportReport: React.FC = () => {
  const { profile } = useGlobal();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      setLoading(true);
      const { data: vehicles } = await supabase
        .from('transport_vehicles')
        .select('vehicle_number, capacity, student_count')
        .eq('school_id', profile.school_id);
      
      if (vehicles) {
        const chartData = vehicles.map((v: any) => ({
          name: v.vehicle_number,
          capacity: v.capacity,
          occupied: v.student_count
        }));
        setData(chartData);
      }
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Vehicle Capacity vs Occupancy</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="capacity" fill="#94a3b8" name="Total Capacity" />
            <Bar dataKey="occupied" fill="#0ea5e9" name="Occupied Seats" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TransportReport;
