import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Modal from '../components/ui/Modal';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from '../context/GlobalContext';

interface Section {
  id: string;
  name: string;
}

const Sections: React.FC = () => {
  const { profile } = useGlobal();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [sectionName, setSectionName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSections();
  }, [profile]);

  const fetchSections = async () => {
    if (!profile?.school_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('name');
      
    if (error) toast.error('Failed to load sections');
    else setSections(data || []);
    setLoading(false);
  };

  const handleOpenModal = (section?: Section) => {
    setSelectedSection(section || null);
    setSectionName(section?.name || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedSection) {
        const { error } = await supabase.from('sections').update({ name: sectionName }).eq('id', selectedSection.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sections').insert({ 
            name: sectionName,
            school_id: profile?.school_id
        });
        if (error) throw error;
      }
      toast.success('Section saved successfully');
      setModalOpen(false);
      fetchSections();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    const { error } = await supabase.from('sections').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Section deleted');
      setSections(prev => prev.filter(s => s.id !== id));
    }
  };

  if (loading) return <TableSkeleton title="Sections" headers={['Section Name', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sections</h1>
          <p className="text-slate-500">Manage class sections (e.g., A, B, Science, Arts)</p>
        </div>
        <Button onClick={() => handleOpenModal()}><Plus size={20} className="mr-2"/> Add Section</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase w-full">Section Name</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sections.map(section => (
              <tr key={section.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{section.name}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(section)}><Edit size={16}/></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(section.id)}><Trash2 size={16} className="text-red-500"/></Button>
                </td>
              </tr>
            ))}
            {sections.length === 0 && <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-500">No sections found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title={selectedSection ? 'Edit Section' : 'Add Section'} 
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={isSubmitting}>Save</Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>Section Name</Label>
            <Input value={sectionName} onChange={e => setSectionName(e.target.value)} placeholder="e.g. A, B, Science" required />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sections;
