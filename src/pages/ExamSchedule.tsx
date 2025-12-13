import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Exam } from '../types';
import TableSkeleton from '../components/ui/TableSkeleton';
import toast from 'react-hot-toast';
import { Select } from '../components/ui/Select';
import { formatDate } from '../utils/format';

const ExamSchedule: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('exams').select('*').order('date', { ascending: true });
        if (error) throw error;
        
        const formattedExams = data.map((e: any) => ({
            id: e.id,
            name: e.name,
            subject: e.subject,
            class: e.class,
            date: e.date,
            duration: e.duration,
            totalMarks: e.total_marks,
            passingMarks: e.passing_marks,
            status: e.status
        }));
        
        setExams(formattedExams);
        
        // Extract unique classes
        const uniqueClasses = Array.from(new Set(formattedExams.map((e: Exam) => e.class))).sort();
        setClasses(uniqueClasses as string[]);
        
        if (uniqueClasses.length > 0 && !selectedClass) {
            setSelectedClass(uniqueClasses[0] as string);
        }
        
      } catch (error: any) {
        toast.error('Failed to load exam schedule');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const filteredExams = exams.filter(exam => {
    const matchesClass = selectedClass ? exam.class === selectedClass : true;
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // Group by Exam Name (e.g., "Mid Term")
  const groupedExams = filteredExams.reduce((acc, exam) => {
    if (!acc[exam.name]) acc[exam.name] = [];
    acc[exam.name].push(exam);
    return acc;
  }, {} as Record<string, Exam[]>);

  if (loading) return <TableSkeleton title="Exam Schedule" headers={['Date', 'Time', 'Subject', 'Duration', 'Room']} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Exam Schedule</h1>
          <p className="text-slate-500 mt-1">View dates and timings for upcoming examinations</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search subjects or exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="w-full sm:w-48">
            <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">All Classes</option>
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
            </Select>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedExams).map(([examName, examList]) => (
          <div key={examName} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">{examName}</h3>
              <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                Class {selectedClass || 'All'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Marks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {examList.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{exam.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        {formatDate(exam.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-slate-400" />
                            {exam.duration}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        Min: {exam.passingMarks} / Max: {exam.totalMarks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                            exam.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                            exam.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                            {exam.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        
        {Object.keys(groupedExams).length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-500">No exams scheduled for the selected criteria.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ExamSchedule;
