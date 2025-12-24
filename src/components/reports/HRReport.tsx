import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';
import { formatCurrency } from '../../utils/format';

const HRReport: React.FC = () => {
  const { profile } = useGlobal();
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      const { data } = await supabase
        .from('teachers')
        .select('name, subject, phone, salary, status')
        .eq('school_id', profile.school_id)
        .order('name');
      setStaff(data || []);
    };
    fetchData();
  }, [profile]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Staff Directory</h3>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {staff.map((s, idx) => (
                    <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{s.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{s.subject}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{s.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatCurrency(s.salary)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm capitalize text-slate-600">{s.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};

export default HRReport;
