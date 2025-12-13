import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import TableSkeleton from '../components/ui/TableSkeleton';
import { formatDate } from '../utils/format';
import Modal from '../components/ui/Modal';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

interface LeaveRequest {
  id: string;
  teacher_id: string;
  teacher_name: string;
  type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

const Leaves: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [formData, setFormData] = useState({
    teacher_id: '', type: 'Sick Leave', start_date: '', end_date: '', reason: ''
  });

  useEffect(() => {
    fetchLeaves();
    fetchTeachers();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leaves')
      .select('*, teachers(name)')
      .order('created_at', { ascending: false });
    
    if (error) toast.error('Failed to load leaves');
    else {
      setLeaves(data.map((l: any) => ({
        id: l.id,
        teacher_id: l.teacher_id,
        teacher_name: l.teachers?.name || 'Unknown',
        type: l.type,
        start_date: l.start_date,
        end_date: l.end_date,
        reason: l.reason,
        status: l.status
      })));
    }
    setLoading(false);
  };

  const fetchTeachers = async () => {
    const { data } = await supabase.from('teachers').select('id, name');
    if (data) setTeachers(data);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    const { error } = await supabase.from('leaves').update({ status }).eq('id', id);
    if (error) toast.error('Update failed');
    else {
      toast.success(`Leave ${status}`);
      fetchLeaves();
    }
  };

  const handleOpenModal = (leave?: LeaveRequest) => {
    if (leave) {
      setSelectedLeave(leave);
      setFormData({
        teacher_id: leave.teacher_id,
        type: leave.type,
        start_date: leave.start_date,
        end_date: leave.end_date,
        reason: leave.reason
      });
    } else {
      setSelectedLeave(null);
      setFormData({
        teacher_id: teachers[0]?.id || '',
        type: 'Sick Leave',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedLeave) {
        const { error } = await supabase.from('leaves').update(formData).eq('id', selectedLeave.id);
        if (error) throw error;
        toast.success('Leave updated');
      } else {
        const { error } = await supabase.from('leaves').insert({ ...formData, status: 'pending' });
        if (error) throw error;
        toast.success('Leave applied');
      }
      setIsModalOpen(false);
      fetchLeaves();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    const { error } = await supabase.from('leaves').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Request deleted');
      setLeaves(prev => prev.filter(l => l.id !== id));
    }
  };

  if (loading) return <TableSkeleton title="Leave Management" headers={['Teacher', 'Type', 'Dates', 'Reason', 'Status', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leave Management</h1>
          <p className="text-slate-500">Review and approve staff leave requests</p>
        </div>
        <Button onClick={() => handleOpenModal()}>Apply Leave</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {leaves.map(leave => (
              <tr key={leave.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{leave.teacher_name}</td>
                <td className="px-6 py-4 text-slate-600">{leave.type}</td>
                <td className="px-6 py-4 text-slate-600 text-sm">
                  {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                </td>
                <td className="px-6 py-4 text-slate-600 text-sm max-w-xs truncate">{leave.reason}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 ${leave.status === 'approved' ? 'bg-green-100 text-green-700' : leave.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {leave.status === 'pending' && <Clock size={12} />}
                    {leave.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {leave.status === 'pending' && (
                      <>
                        <button onClick={() => handleStatusUpdate(leave.id, 'approved')} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Approve"><CheckCircle size={18}/></button>
                        <button onClick={() => handleStatusUpdate(leave.id, 'rejected')} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Reject"><XCircle size={18}/></button>
                        <button onClick={() => handleOpenModal(leave)} className="text-slate-500 hover:text-blue-600 p-1 rounded" title="Edit"><Edit size={18}/></button>
                        <button onClick={() => handleDelete(leave.id)} className="text-slate-500 hover:text-red-600 p-1 rounded" title="Delete"><Trash2 size={18}/></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedLeave ? 'Edit Leave Request' : 'Apply for Leave'} footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Teacher</Label>
            <Select value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})} disabled={!!selectedLeave}>
              <option value="">Select Teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option>Sick Leave</option>
              <option>Casual Leave</option>
              <option>Maternity Leave</option>
              <option>Unpaid Leave</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} /></div>
          </div>
          <div className="space-y-2"><Label>Reason</Label><Input value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} /></div>
        </div>
      </Modal>
    </div>
  );
};

export default Leaves;
