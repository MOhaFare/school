import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Filter, Calendar } from 'lucide-react';
import { Teacher } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/format';

interface StaffAttendanceRecord {
  id: string;
  teacher_id: string;
  teacher_name: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  remarks: string;
}

const StaffAttendance: React.FC = () => {
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<StaffAttendanceRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    teacher_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attendanceRes, teachersRes] = await Promise.all([
        supabase.from('staff_attendance').select('*').eq('date', dateFilter),
        supabase.from('teachers').select('id, name')
      ]);

      if (attendanceRes.error) throw attendanceRes.error;
      if (teachersRes.error) throw teachersRes.error;

      setTeachers(teachersRes.data || []);
      
      const formattedRecords = (attendanceRes.data || []).map((r: any) => ({
        ...r,
        teacher_name: teachersRes.data?.find((t: any) => t.id === r.teacher_id)?.name || 'Unknown'
      }));
      setRecords(formattedRecords);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedRecord(null);
    setFormData({
      teacher_id: teachers[0]?.id || '',
      date: dateFilter,
      status: 'present',
      remarks: ''
    });
    setModalOpen(true);
  };

  const handleEdit = (record: StaffAttendanceRecord) => {
    setSelectedRecord(record);
    setFormData({
      teacher_id: record.teacher_id,
      date: record.date,
      status: record.status as any,
      remarks: record.remarks || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const { error } = await supabase.from('staff_attendance').delete().eq('id', id);
      if (error) throw error;
      toast.success('Record deleted');
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedRecord) {
        const { error } = await supabase.from('staff_attendance').update(formData).eq('id', selectedRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('staff_attendance').insert(formData);
        if (error) throw error;
      }
      toast.success('Attendance saved');
      setModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'leave': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRecords = records.filter(r => 
    r.teacher_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <TableSkeleton title="Staff Attendance" headers={['Teacher', 'Date', 'Status', 'Remarks', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Attendance</h1>
          <p className="text-slate-500">Track daily attendance for teachers and staff</p>
        </div>
        <Button onClick={handleAdd}><Plus size={20} className="mr-2"/> Mark Attendance</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search staff..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="text-slate-400" size={20} />
          <input 
            type="date" 
            value={dateFilter} 
            onChange={e => setDateFilter(e.target.value)} 
            className="border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Staff Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Remarks</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredRecords.map(record => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{record.teacher_name}</td>
                <td className="px-6 py-4 text-slate-600">{formatDate(record.date)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 text-sm">{record.remarks || '-'}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}><Edit size={16}/></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(record.id)}><Trash2 size={16} className="text-red-500"/></Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No attendance records found for this date.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={selectedRecord ? 'Edit Attendance' : 'Mark Attendance'} footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={isSubmitting}>Save</Button></>}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>Staff Member</Label>
            <Select value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})} disabled={!!selectedRecord}>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="leave">On Leave</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Input value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Optional remarks..." />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffAttendance;
