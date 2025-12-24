import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';
import { formatCurrency } from '../../utils/format';

const InventoryReport: React.FC = () => {
  const { profile } = useGlobal();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('name');
      setItems(data || []);
    };
    fetchData();
  }, [profile]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Inventory Stock</h3>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Unit Price</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {items.map((i, idx) => (
                    <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{i.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 capitalize">{i.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{i.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatCurrency(i.unit_price)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};

export default InventoryReport;
