import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';
import { formatDate } from '../../utils/format';

const AttendanceReport: React.FC = () => {
  const { profile } = useGlobal();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      const { data } = await supabase
        .from('attendance')
        .select('date, status, class, students(name)')
        .eq('school_id', profile.school_id)
        .order('date', { ascending: false })
        .limit(20);
      setLogs(data || []);
    };
    fetchData();
  }, [profile]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Recent Attendance Logs</h3>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {logs.map((log, idx) => (
                    <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDate(log.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{log.students?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{log.class}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${log.status === 'present' ? 'bg-green-100 text-green-800' : log.status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {log.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};

export default AttendanceReport;
