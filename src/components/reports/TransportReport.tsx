import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';

const TransportReport: React.FC = () => {
  const { profile } = useGlobal();
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      const { data } = await supabase
        .from('transport_vehicles')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('vehicle_number');
      setVehicles(data || []);
    };
    fetchData();
  }, [profile]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Transport Fleet</h3>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vehicle No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Capacity</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {vehicles.map((v, idx) => (
                    <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{v.vehicle_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{v.driver_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{v.route}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{v.student_count} / {v.capacity}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};

export default TransportReport;
