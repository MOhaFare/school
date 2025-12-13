import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import Modal from '../ui/Modal';
import TableSkeleton from '../ui/TableSkeleton';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/format';

const VisitorBook: React.FC = () => {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', purpose: '', date: new Date().toISOString().split('T')[0], 
    in_time: '', out_time: '', note: ''
  });

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('visitors').select('*').order('date', { ascending: false });
    if (error) toast.error('Failed to load visitors');
    else setVisitors(data || []);
    setLoading(false);
  };

  const handleOpenModal = (visitor?: any) => {
    setSelectedVisitor(visitor || null);
    if (visitor) {
      setFormData(visitor);
    } else {
      setFormData({
        name: '', phone: '', purpose: '', date: new Date().toISOString().split('T')[0],
        in_time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), 
        out_time: '', note: ''
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedVisitor) {
        const { error } = await supabase.from('visitors').update(formData).eq('id', selectedVisitor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('visitors').insert(formData);
        if (error) throw error;
      }
      toast.success('Visitor saved');
      setModalOpen(false);
      fetchVisitors();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('visitors').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Deleted');
      setVisitors(prev => prev.filter(v => v.id !== id));
    }
  };

  const filteredVisitors = visitors.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <TableSkeleton title="Visitor Book" headers={['Name', 'Phone', 'Purpose', 'Date', 'Time', 'Actions']} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search visitors..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg" />
        </div>
        <Button onClick={() => handleOpenModal()}><Plus size={18} className="mr-2"/> Add Visitor</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Purpose</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredVisitors.map(v => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{v.name}</td>
                <td className="px-6 py-4 text-slate-600">{v.phone}</td>
                <td className="px-6 py-4 text-slate-600">{v.purpose}</td>
                <td className="px-6 py-4 text-slate-600">{formatDate(v.date)}</td>
                <td className="px-6 py-4 text-slate-600 text-sm flex items-center gap-1"><Clock size={12}/> {v.in_time} - {v.out_time || '...'}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(v)}><Edit size={16}/></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}><Trash2 size={16} className="text-red-500"/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={selectedVisitor ? 'Edit Visitor' : 'Add Visitor'} footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
          </div>
          <div className="space-y-2"><Label>Purpose</Label><Input value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} required /></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required /></div>
            <div className="space-y-2"><Label>In Time</Label><Input type="time" value={formData.in_time} onChange={e => setFormData({...formData, in_time: e.target.value})} /></div>
            <div className="space-y-2"><Label>Out Time</Label><Input type="time" value={formData.out_time} onChange={e => setFormData({...formData, out_time: e.target.value})} /></div>
          </div>
          <div className="space-y-2"><Label>Note</Label><Input value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} /></div>
        </form>
      </Modal>
    </div>
  );
};

export default VisitorBook;
