import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Phone, Calendar } from 'lucide-react';
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

const AdmissionEnquiry: React.FC = () => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', source: 'Google', class: '1', 
    date: new Date().toISOString().split('T')[0], 
    next_follow_up_date: '', status: 'active', note: ''
  });

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('admission_enquiries').select('*').order('date', { ascending: false });
    if (error) toast.error('Failed to load enquiries');
    else setEnquiries(data || []);
    setLoading(false);
  };

  const handleOpenModal = (enquiry?: any) => {
    setSelectedEnquiry(enquiry || null);
    if (enquiry) {
      setFormData(enquiry);
    } else {
      setFormData({
        name: '', phone: '', email: '', source: 'Google', class: '1',
        date: new Date().toISOString().split('T')[0],
        next_follow_up_date: '', status: 'active', note: ''
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedEnquiry) {
        const { error } = await supabase.from('admission_enquiries').update(formData).eq('id', selectedEnquiry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('admission_enquiries').insert(formData);
        if (error) throw error;
      }
      toast.success('Enquiry saved');
      setModalOpen(false);
      fetchEnquiries();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('admission_enquiries').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Deleted');
      setEnquiries(prev => prev.filter(e => e.id !== id));
    }
  };

  const filteredEnquiries = enquiries.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <TableSkeleton title="Admission Enquiries" headers={['Name', 'Phone', 'Source', 'Date', 'Follow Up', 'Status', 'Actions']} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search enquiries..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg" />
        </div>
        <Button onClick={() => handleOpenModal()}><Plus size={18} className="mr-2"/> Add Enquiry</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Enquiry Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Next Follow Up</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredEnquiries.map(e => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{e.name}</td>
                <td className="px-6 py-4 text-slate-600">{e.phone}</td>
                <td className="px-6 py-4 text-slate-600">{e.source}</td>
                <td className="px-6 py-4 text-slate-600">{formatDate(e.date)}</td>
                <td className="px-6 py-4 text-slate-600">{e.next_follow_up_date ? formatDate(e.next_follow_up_date) : '-'}</td>
                <td className="px-6 py-4"><Badge variant={e.status === 'won' ? 'success' : e.status === 'lost' ? 'danger' : 'neutral'}>{e.status}</Badge></td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(e)}><Edit size={16}/></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}><Trash2 size={16} className="text-red-500"/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={selectedEnquiry ? 'Edit Enquiry' : 'Add Enquiry'} footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Class</Label><Input value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} /></div>
            <div className="space-y-2"><Label>Source</Label><Select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}><option>Google</option><option>Friend</option><option>Advertisement</option><option>Other</option></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Next Follow Up</Label><Input type="date" value={formData.next_follow_up_date} onChange={e => setFormData({...formData, next_follow_up_date: e.target.value})} /></div>
          </div>
          <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="active">Active</option><option value="won">Won</option><option value="lost">Lost</option><option value="dead">Dead</option></Select></div>
          <div className="space-y-2"><Label>Note</Label><Input value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} /></div>
        </form>
      </Modal>
    </div>
  );
};

export default AdmissionEnquiry;
