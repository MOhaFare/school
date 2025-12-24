import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';
import TableSkeleton from '../ui/TableSkeleton';
import Badge from '../ui/Badge';

const StudentReport: React.FC = () => {
  const { profile } = useGlobal();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('class')
        .order('name')
        .limit(50); // Limit for preview
      setStudents(data || []);
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  if (loading) return <TableSkeleton title="Student Report" headers={['Name', 'Class', 'Roll No', 'Parent', 'Status']} />;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Student List Preview</h3>
        <span className="text-xs text-slate-500">Showing first 50 records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Roll No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Parent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{s.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{s.class}-{s.section}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{s.roll_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{s.parent_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={s.status === 'active' ? 'success' : 'neutral'}>{s.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentReport;
