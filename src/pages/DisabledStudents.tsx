import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Trash2, UserX, AlertCircle } from 'lucide-react';
import { Student } from '../types';
import { Button } from '../components/ui/Button';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const DisabledStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchDisabledStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .in('status', ['inactive', 'alumni', 'suspended'])
        .order('name');
      
      if (error) throw error;
      
      setStudents(data.map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        class: s.class,
        section: s.section,
        rollNumber: s.roll_number,
        phone: s.phone,
        enrollmentDate: s.enrollment_date,
        issuedDate: s.issued_date,
        expiryDate: s.expiry_date,
        dob: s.dob,
        status: s.status,
        grade: s.grade,
        avatar: s.avatar,
        user_id: s.user_id
      })));
    } catch (error: any) {
      toast.error(`Failed to load students: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisabledStudents();
  }, []);

  const handleRestore = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase.from('students').update({ status: 'active' }).eq('id', id);
      if (error) throw error;
      toast.success('Student restored to active status');
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error: any) {
      toast.error(`Failed to restore: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Are you sure? This will permanently delete the student record and cannot be undone.')) return;
    
    setProcessingId(id);
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      toast.success('Student permanently deleted');
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber.includes(searchTerm)
  );

  if (loading) return <TableSkeleton title="Disabled Students" headers={['Name', 'Class', 'Reason/Status', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Disabled Students</h1>
          <p className="text-slate-500 mt-1">Manage inactive, alumni, or suspended student records</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Class Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm overflow-hidden">
                      {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" /> : student.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-500">{student.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  Class {student.class}-{student.section} (Roll: {student.rollNumber})
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="danger" className="capitalize">{student.status}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => handleRestore(student.id)}
                      disabled={processingId === student.id}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                    >
                      <RefreshCw size={16} className={`mr-1 ${processingId === student.id ? 'animate-spin' : ''}`} /> Restore
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handlePermanentDelete(student.id)}
                      disabled={processingId === student.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredStudents.length === 0 && (
          <EmptyState 
            icon={UserX}
            title="No disabled students found"
            description="All students are currently active."
          />
        )}
      </div>
    </div>
  );
};

export default DisabledStudents;
