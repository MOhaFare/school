import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Modal from '../components/ui/Modal';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

interface SubjectGroup {
  id: string;
  name: string;
  description: string;
  subjects: string[];
}

const SubjectGroups: React.FC = () => {
  const [groups, setGroups] = useState<SubjectGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SubjectGroup | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', subjects: '' });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('subject_groups').select('*').order('name');
    if (error) toast.error('Failed to load subject groups');
    else setGroups(data || []);
    setLoading(false);
  };

  const handleOpenModal = (group?: SubjectGroup) => {
    setSelectedGroup(group || null);
    setFormData({
      name: group?.name || '',
      description: group?.description || '',
      subjects: group?.subjects.join(', ') || ''
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const subjectsArray = formData.subjects.split(',').map(s => s.trim()).filter(s => s);
    const payload = {
      name: formData.name,
      description: formData.description,
      subjects: subjectsArray
    };

    try {
      if (selectedGroup) {
        const { error } = await supabase.from('subject_groups').update(payload).eq('id', selectedGroup.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('subject_groups').insert(payload);
        if (error) throw error;
      }
      toast.success('Subject Group saved');
      setModalOpen(false);
      fetchGroups();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    const { error } = await supabase.from('subject_groups').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Group deleted');
      fetchGroups();
    }
  };

  if (loading) return <TableSkeleton title="Subject Groups" headers={['Group Name', 'Subjects', 'Description', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subject Groups</h1>
          <p className="text-slate-500">Manage academic streams and subject combinations</p>
        </div>
        <Button onClick={() => handleOpenModal()}><Plus size={20} className="mr-2"/> Add Group</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => (
          <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Layers size={24} /></div>
                <h3 className="font-bold text-lg text-slate-900">{group.name}</h3>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleOpenModal(group)} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit size={16}/></button>
                <button onClick={() => handleDelete(group.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 mb-4">{group.description || 'No description provided.'}</p>
            
            <div className="mt-auto">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center"><BookOpen size={12} className="mr-1"/> Subjects</h4>
              <div className="flex flex-wrap gap-2">
                {group.subjects.map((sub, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium">{sub}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {groups.length === 0 && <div className="col-span-full text-center py-12 text-slate-500">No subject groups found. Add one to get started.</div>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={selectedGroup ? 'Edit Group' : 'Add Subject Group'} footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Group Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Science Stream" />
          </div>
          <div className="space-y-2">
            <Label>Subjects (comma separated)</Label>
            <Input value={formData.subjects} onChange={e => setFormData({...formData, subjects: e.target.value})} placeholder="Physics, Chemistry, Biology" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SubjectGroups;
