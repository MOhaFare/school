import React, { useState, useEffect } from 'react';
import { Book, Plus, Search, Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Homework as HomeworkType, SchoolClass, Teacher } from '../types';
import { useGlobal } from '../context/GlobalContext';
import { formatDate } from '../utils/format';

const Homework: React.FC = () => {
  const { profile } = useGlobal();
  const [homeworkList, setHomeworkList] = useState<HomeworkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<HomeworkType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    class: '',
    subject: '',
    teacher_id: '',
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [homeworkRes, classesRes, teachersRes] = await Promise.all([
        supabase.from('homework').select('*, teachers(name)').order('created_at', { ascending: false }),
        supabase.from('classes').select('id, name'),
        supabase.from('teachers').select('id, name, user_id, subject')
      ]);

      if (homeworkRes.error) throw homeworkRes.error;
      
      const formattedHomework = (homeworkRes.data || []).map((h: any) => ({
        ...h,
        teacher_name: h.teachers?.name || 'Unknown'
      }));
      
      setHomeworkList(formattedHomework);
      
      // Ensure we have unique IDs and fallback if needed
      const formattedClasses = (classesRes.data || []).map((c: any) => ({ 
        ...c, 
        name: c.name.startsWith('Class ') ? c.name : `Class ${c.name}` 
      }));
      setClasses(formattedClasses);
      
      setTeachers(teachersRes.data as any || []);
      
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (homework?: HomeworkType) => {
    setSelectedHomework(homework || null);
    if (homework) {
      setFormData({
        class: homework.class,
        subject: homework.subject,
        teacher_id: homework.teacher_id,
        title: homework.title,
        description: homework.description,
        due_date: homework.due_date,
        status: homework.status
      });
    } else {
      // Find the current teacher if logged in as one
      const currentTeacher = profile?.role === 'teacher' 
        ? teachers.find(t => t.user_id === profile.id) 
        : null;
        
      setFormData({
        class: classes[0]?.name || '',
        subject: currentTeacher?.subject || '', // Auto-fill subject
        teacher_id: currentTeacher?.id || '',
        title: '',
        description: '',
        due_date: new Date().toISOString().split('T')[0],
        status: 'active'
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedHomework) {
        const { error } = await supabase.from('homework').update(formData).eq('id', selectedHomework.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('homework').insert(formData);
        if (error) throw error;
      }
      toast.success('Homework saved successfully');
      setModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this homework assignment?')) return;
    try {
      const { error } = await supabase.from('homework').delete().eq('id', id);
      if (error) throw error;
      toast.success('Homework deleted');
      setHomeworkList(prev => prev.filter(h => h.id !== id));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredHomework = homeworkList.filter(h => 
    h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = profile?.role === 'admin' || profile?.role === 'teacher';

  if (loading) return <TableSkeleton title="Homework" headers={['Class', 'Subject', 'Title', 'Due Date', 'Assigned By', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Homework</h1>
          <p className="text-slate-500">Manage and track class assignments</p>
        </div>
        {canEdit && (
          <Button onClick={() => handleOpenModal()}><Plus size={20} className="mr-2"/> Add Homework</Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search homework..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHomework.map(hw => (
          <div key={hw.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">{hw.class}</span>
              <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={12}/> Due: {formatDate(hw.due_date)}</span>
            </div>
            
            <h3 className="font-bold text-lg text-slate-900 mb-1">{hw.title}</h3>
            <p className="text-sm font-medium text-slate-600 mb-3">{hw.subject}</p>
            
            <p className="text-sm text-slate-500 flex-grow mb-4 line-clamp-3">{hw.description}</p>
            
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-auto">
              <span className="text-xs text-slate-400">By: {hw.teacher_name}</span>
              {canEdit && (
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(hw)} className="text-slate-400 hover:text-blue-600"><Edit size={16}/></button>
                  <button onClick={() => handleDelete(hw.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredHomework.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">No homework assignments found.</div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={selectedHomework ? 'Edit Homework' : 'Add Homework'} footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})}>
                <option value="">Select Class</option>
                {classes.map((c, index) => (
                  <option key={c.id || index} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input 
                value={formData.subject} 
                onChange={e => setFormData({...formData, subject: e.target.value})} 
                placeholder="e.g. Mathematics" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Assignment Title" />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                rows={4}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
            </div>
            {profile?.role === 'admin' && (
                <div className="space-y-2">
                  <Label>Teacher</Label>
                  <Select value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})}>
                    <option value="">Select Teacher</option>
                    {teachers.map((t, index) => (
                      <option key={t.id || index} value={t.id}>{t.name}</option>
                    ))}
                  </Select>
                </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Homework;
