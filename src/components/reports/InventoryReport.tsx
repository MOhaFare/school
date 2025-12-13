import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../utils/format';

const InventoryReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: items } = await supabase.from('inventory_items').select('category, quantity, unit_price');
      
      if (items) {
        const categoryStats: any = {};
        items.forEach((i: any) => {
          if (!categoryStats[i.category]) categoryStats[i.category] = 0;
          categoryStats[i.category] += (i.quantity * i.unit_price);
        });

        const chartData = Object.keys(categoryStats).map(key => ({ name: key, value: categoryStats[key] }));
        setData(chartData);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Inventory Value by Category</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(val: number) => formatCurrency(val)} />
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total Value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InventoryReport;
