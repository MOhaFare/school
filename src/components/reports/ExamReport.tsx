import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';

const ExamReport: React.FC = () => {
  const { profile } = useGlobal();
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      const { data } = await supabase
        .from('grades')
        .select('grade, marks_obtained, students(name), exams(name, subject, total_marks)')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false })
        .limit(20);
      setResults(data || []);
    };
    fetchData();
  }, [profile]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Recent Exam Results</h3>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Exam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Grade</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {results.map((r, idx) => (
                    <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{r.students?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{r.exams?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{r.exams?.subject}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{r.marks_obtained} / {r.exams?.total_marks}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{r.grade}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};

export default ExamReport;
