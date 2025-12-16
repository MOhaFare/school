import React, { useState, useEffect } from 'react';
import { Users, Save, Search, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { SchoolClass, Teacher } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';

const AssignTeacher: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [classesRes, teachersRes] = await Promise.all([
          supabase.from('classes').select('*').order('name'),
          supabase.from('teachers').select('id, name').order('name')
        ]);

        if (classesRes.error) throw classesRes.error;
        if (teachersRes.error) throw teachersRes.error;

        setTeachers(teachersRes.data || []);
        
        const initialAssignments: Record<string, string> = {};
        const formattedClasses = (classesRes.data || []).map((c: any) => {
            // Batch assignment updates
            if (c.teacher_id) {
                initialAssignments[c.id] = c.teacher_id;
            } else {
                initialAssignments[c.id] = ''; // Explicitly set empty for unassigned
            }
            
            const teacher = teachersRes.data?.find((t: any) => t.id === c.teacher_id);
            return {
                ...c,
                name: c.name.startsWith('Class ') ? c.name : `Class ${c.name}`,
                teacher: { id: teacher?.id || '', name: teacher?.name || 'Unassigned' }
            };
        });
        
        setAssignments(initialAssignments);
        setClasses(formattedClasses);

      } catch (error: any) {
        toast.error(`Failed to load data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssignmentChange = (classId: string, teacherId: string) => {
    setAssignments(prev => ({ ...prev, [classId]: teacherId }));
  };

  const handleSave = async (classId: string) => {
    const teacherId = assignments[classId];
    // Allow empty string to unassign (set to null)
    const updateValue = teacherId === '' ? null : teacherId;

    setSaving(true);
    try {
      const { error } = await supabase.from('classes').update({ teacher_id: updateValue }).eq('id', classId);
      if (error) throw error;
      
      // Update local state to reflect the change immediately
      const teacher = teachers.find(t => t.id === teacherId);
      setClasses(prev => prev.map(c => c.id === classId ? { ...c, teacher: { id: teacher?.id || '', name: teacher?.name || 'Unassigned' } } : c));
      
      toast.success(updateValue ? 'Teacher assigned successfully' : 'Teacher unassigned successfully');
    } catch (error: any) {
      toast.error(`Failed to update assignment: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <TableSkeleton title="Assign Class Teacher" headers={['Class Name', 'Current Teacher', 'Assign New Teacher', 'Action']} />;

  if (classes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assign Class Teacher</h1>
            <p className="text-slate-500">Manage class teacher allocations</p>
          </div>
        </div>
        <EmptyState 
            icon={BookOpen}
            title="No Classes Found"
            description="You need to create classes before you can assign teachers to them."
            actionLabel="Go to Classes"
            onAction={() => navigate('/classes')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assign Class Teacher</h1>
          <p className="text-slate-500">Manage class teacher allocations</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search classes..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Class Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Current Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assign New Teacher</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredClasses.map(cls => (
              <tr key={cls.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{cls.name}</td>
                <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                    <Users size={16} className="text-slate-400"/>
                    {cls.teacher.name}
                </td>
                <td className="px-6 py-4">
                  <Select 
                    value={assignments[cls.id] || ''} 
                    onChange={e => handleAssignmentChange(cls.id, e.target.value)}
                    className="w-full max-w-xs"
                  >
                    <option value="">-- Unassigned --</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button 
                    size="sm" 
                    onClick={() => handleSave(cls.id)} 
                    disabled={saving || assignments[cls.id] === (cls.teacher.id === 'N/A' || cls.teacher.name === 'Unassigned' ? '' : cls.teacher.id)}
                  >
                    <Save size={16} className="mr-1"/> Save
                  </Button>
                </td>
              </tr>
            ))}
            {filteredClasses.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No classes found matching search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignTeacher;
