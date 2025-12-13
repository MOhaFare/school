import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import Modal from '../ui/Modal';
import TableSkeleton from '../ui/TableSkeleton';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/format';
import Badge from '../ui/Badge';

const PostalRecords: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: 'receive', reference_no: '', to_title: '', from_title: '', 
    address: '', date: new Date().toISOString().split('T')[0], note: ''
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('postal_records').select('*').order('date', { ascending: false });
    if (error) toast.error('Failed to load postal records');
    else setRecords(data || []);
    setLoading(false);
  };

  const handleOpenModal = (record?: any) => {
    setSelectedRecord(record || null);
    if (record) {
      setFormData(record);
    } else {
      setFormData({
        type: 'receive', reference_no: '', to_title: '', from_title: '',
        address: '', date: new Date().toISOString().split('T')[0], note: ''
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedRecord) {
        const { error } = await supabase.from('postal_records').update(formData).eq('id', selectedRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('postal_records').insert(formData);
        if (error) throw error;
      }
      toast.success('Record saved');
      setModalOpen(false);
      fetchRecords();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('postal_records').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Deleted');
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const filteredRecords = records.filter(r => 
    (r.reference_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.to_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.from_title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <TableSkeleton title="Postal Dispatch & Receive" headers={['Type', 'Ref No', 'From / To', 'Date', 'Address', 'Actions']} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search records..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg" />
        </div>
        <Button onClick={() => handleOpenModal()}><Plus size={18} className="mr-2"/> Add Record</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ref No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">From / To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Address</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredRecords.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                    <Badge variant={r.type === 'dispatch' ? 'info' : 'success'} className="flex w-fit items-center gap-1 capitalize">
                        {r.type === 'dispatch' ? <ArrowUpRight size={12}/> : <ArrowDownLeft size={12}/>}
                        {r.type}
                    </Badge>
                </td>
                <td className="px-6 py-4 text-slate-900 font-medium">{r.reference_no || '-'}</td>
                <td className="px-6 py-4 text-slate-600">
                    {r.type === 'dispatch' ? `To: ${r.to_title}` : `From: ${r.from_title}`}
                </td>
                <td className="px-6 py-4 text-slate-600">{formatDate(r.date)}</td>
                <td className="px-6 py-4 text-slate-600 text-sm max-w-xs truncate">{r.address}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(r)}><Edit size={16}/></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 size={16} className="text-red-500"/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={selectedRecord ? 'Edit Record' : 'Add Postal Record'} footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Type</Label><Select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="receive">Receive</option><option value="dispatch">Dispatch</option></Select></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required /></div>
          </div>
          <div className="space-y-2"><Label>Reference No</Label><Input value={formData.reference_no} onChange={e => setFormData({...formData, reference_no: e.target.value})} /></div>
          {formData.type === 'dispatch' ? (
             <div className="space-y-2"><Label>To Title</Label><Input value={formData.to_title} onChange={e => setFormData({...formData, to_title: e.target.value})} required /></div>
          ) : (
             <div className="space-y-2"><Label>From Title</Label><Input value={formData.from_title} onChange={e => setFormData({...formData, from_title: e.target.value})} required /></div>
          )}
          <div className="space-y-2"><Label>Address</Label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
          <div className="space-y-2"><Label>Note</Label><Input value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} /></div>
        </form>
      </Modal>
    </div>
  );
};

export default PostalRecords;
