import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import Modal from '../ui/Modal';
import TableSkeleton from '../ui/TableSkeleton';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/format';
import { useGlobal } from '../../context/GlobalContext';

const Complaints: React.FC = () => {
  const { profile } = useGlobal();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [formData, setFormData] = useState({
    complaint_by: '', phone: '', date: new Date().toISOString().split('T')[0], 
    description: '', action_taken: '', status: 'pending'
  });

  useEffect(() => {
    fetchComplaints();
  }, [profile]);

  const fetchComplaints = async () => {
    if (!profile?.school_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('date', { ascending: false });
      
    if (error) toast.error('Failed to load complaints');
    else setComplaints(data || []);
    setLoading(false);
  };

  const handleOpenModal = (complaint?: any) => {
    setSelectedComplaint(complaint || null);
    if (complaint) {
      setFormData(complaint);
    } else {
      setFormData({
        complaint_by: '', phone: '', date: new Date().toISOString().split('T')[0],
        description: '', action_taken: '', status: 'pending'
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, school_id: profile?.school_id };
      
      if (selectedComplaint) {
        const { error } = await supabase.from('complaints').update(payload).eq('id', selectedComplaint.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('complaints').insert(payload);
        if (error) throw error;
      }
      toast.success('Complaint saved');
      setModalOpen(false);
      fetchComplaints();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('complaints').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Deleted');
      setComplaints(prev => prev.filter(c => c.id !== id));
    }
  };

  const filteredComplaints = complaints.filter(c => c.complaint_by.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <TableSkeleton title="Complaints" headers={['Complainant', 'Phone', 'Date', 'Status', 'Actions']} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search complaints..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg" />
        </div>
        <Button onClick={() => handleOpenModal()}><Plus size={18} className="mr-2"/> Add Complaint</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Complainant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredComplaints.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{c.complaint_by}</td>
                <td className="px-6 py-4 text-slate-600">{c.phone}</td>
                <td className="px-6 py-4 text-slate-600">{formatDate(c.date)}</td>
                <td className="px-6 py-4 text-slate-600 text-sm max-w-xs truncate">{c.description}</td>
                <td className="px-6 py-4"><Badge variant={c.status === 'resolved' ? 'success' : c.status === 'in_progress' ? 'warning' : 'danger'}>{c.status}</Badge></td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(c)}><Edit size={16}/></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 size={16} className="text-red-500"/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={selectedComplaint ? 'Edit Complaint' : 'Add Complaint'} footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Complaint By</Label><Input value={formData.complaint_by} onChange={e => setFormData({...formData, complaint_by: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
          </div>
          <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required /></div>
          <div className="space-y-2"><Label>Description</Label><Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required /></div>
          <div className="space-y-2"><Label>Action Taken</Label><Input value={formData.action_taken} onChange={e => setFormData({...formData, action_taken: e.target.value})} /></div>
          <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option></Select></div>
        </form>
      </Modal>
    </div>
  );
};

export default Complaints;
