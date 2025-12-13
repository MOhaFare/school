import React, { useState, useEffect } from 'react';
import { Search, Trash2, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { Student } from '../types';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import TableSkeleton from '../components/ui/TableSkeleton';

const BulkDeleteStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterClass, setFilterClass] = useState('all');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('students').select('*').order('class').order('name');
      if (error) throw error;
      setStudents(data.map((s: any) => ({
        id: s.id,
        name: s.name,
        class: s.class,
        section: s.section,
        rollNumber: s.roll_number,
        status: s.status,
        // ... other fields not needed for list
      } as Student)));
    } catch (error: any) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    filterClass === 'all' || s.class === filterClass
  );

  const handleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE ${selectedIds.size} students? This action cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('students').delete().in('id', Array.from(selectedIds));
      if (error) throw error;
      
      toast.success(`Successfully deleted ${selectedIds.size} students.`);
      setStudents(prev => prev.filter(s => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const uniqueClasses = Array.from(new Set(students.map(s => s.class))).sort();

  if (loading) return <TableSkeleton title="Bulk Delete" headers={['Select', 'Name', 'Class', 'Status']} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bulk Delete Students</h1>
          <p className="text-slate-500 mt-1">Permanently remove multiple student records</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg flex items-center text-sm font-medium border border-red-100">
                <AlertTriangle size={16} className="mr-2" />
                Warning: Actions are irreversible
            </div>
            <Button 
                variant="danger" 
                onClick={handleBulkDelete} 
                disabled={selectedIds.size === 0 || isDeleting}
                loading={isDeleting}
            >
                <Trash2 size={18} className="mr-2" />
                Delete {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
            </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div className="flex-grow max-w-xs">
            <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Class</label>
            <Select value={filterClass} onChange={e => { setFilterClass(e.target.value); setSelectedIds(new Set()); }}>
                <option value="all">All Classes</option>
                {uniqueClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
            </Select>
        </div>
        <div className="flex-grow text-right text-sm text-slate-500 pt-5">
            Showing {filteredStudents.length} students
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left w-16">
                <button onClick={handleSelectAll} className="text-slate-500 hover:text-slate-700">
                    {filteredStudents.length > 0 && selectedIds.size === filteredStudents.length ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Class Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredStudents.map((student) => (
              <tr key={student.id} className={`hover:bg-slate-50 cursor-pointer ${selectedIds.has(student.id) ? 'bg-blue-50' : ''}`} onClick={() => handleSelectOne(student.id)}>
                <td className="px-6 py-4">
                    <div className={`text-slate-400 ${selectedIds.has(student.id) ? 'text-blue-600' : ''}`}>
                        {selectedIds.has(student.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">{student.name}</td>
                <td className="px-6 py-4 text-slate-600">Class {student.class}-{student.section} (Roll: {student.rollNumber})</td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {student.status}
                    </span>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No students found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BulkDeleteStudents;
