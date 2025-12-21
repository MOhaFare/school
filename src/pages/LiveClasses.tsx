import React, { useState, useEffect } from 'react';
import { Video, Plus, ExternalLink, Calendar, Clock, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/format';
import { useGlobal } from '../context/GlobalContext';

const LiveClasses: React.FC = () => {
  const { profile, user } = useGlobal();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    class: '9',
    section: 'A',
    subject: 'Mathematics',
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    meeting_url: '',
    teacher_id: ''
  });

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile?.school_id) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('live_classes').select('*, teachers(name)').eq('school_id', profile.school_id).order('date', { ascending: false });

      // If student, filter by class and section
      if (profile?.role === 'student' && user) {
          const { data: studentData } = await supabase.from('students').select('class, section').eq('user_id', user.id).eq('school_id', profile.school_id).single();
          if (studentData) {
              query = query.eq('class', studentData.class).eq('section', studentData.section);
          }
      }

      const [classesRes, teachersRes] = await Promise.all([
        query,
        supabase.from('teachers').select('id, name').eq('school_id', profile.school_id)
      ]);

      if (classesRes.error) throw classesRes.error;
      if (teachersRes.error) throw teachersRes.error;

      setClasses(classesRes.data || []);
      setTeachers(teachersRes.data || []);
      
      // Default teacher
      if (teachersRes.data && teachersRes.data.length > 0) {
        setFormData(prev => ({ ...prev, teacher_id: teachersRes.data[0].id }));
      }
    } catch (error: any) {
      console.error("Error fetching live classes:", error);
      if (error.code === '42P01') {
          setError("The 'live_classes' table does not exist. Please ensure the database migration has been run.");
      } else {
          setError(`Failed to load data: ${error.message}`);
          toast.error(`Failed to load data: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, school_id: profile?.school_id };
      const { error } = await supabase.from('live_classes').insert(payload);
      if (error) throw error;
      toast.success('Class scheduled');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this class?')) return;
    const { error } = await supabase.from('live_classes').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Deleted');
      setClasses(prev => prev.filter(c => c.id !== id));
    }
  };

  const canEdit = profile?.role === 'admin' || profile?.role === 'teacher';

  if (loading) return <TableSkeleton title="Live Classes" headers={['Title', 'Class', 'Date', 'Time', 'Link', 'Actions']} />;

  if (error) {
      return (
          <div className="p-8 text-center bg-white rounded-xl border border-red-200">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Configuration Error</h3>
              <p className="text-slate-600 mb-4">{error}</p>
              <Button onClick={fetchData} variant="secondary">Retry</Button>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Classes</h1>
          <p className="text-slate-500">Schedule and join online classes (Zoom/Meet)</p>
        </div>
        {canEdit && <Button onClick={() => setIsModalOpen(true)}><Plus size={20} className="mr-2"/> Schedule Class</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => (
          <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <Video size={24} />
              </div>
              {canEdit && (
                <button onClick={() => handleDelete(cls.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={18}/></button>
              )}
            </div>
            
            <h3 className="font-bold text-lg text-slate-900 mb-1">{cls.title}</h3>
            <p className="text-sm text-slate-600 mb-4">{cls.subject} • Class {cls.class}-{cls.section}</p>
            
            <div className="space-y-2 text-sm text-slate-500 mb-6">
                <div className="flex items-center gap-2"><Calendar size={14}/> {formatDate(cls.date)}</div>
                <div className="flex items-center gap-2"><Clock size={14}/> {cls.start_time.slice(0,5)} - {cls.end_time.slice(0,5)}</div>
                <div className="flex items-center gap-2 text-slate-400 text-xs">By: {cls.teachers?.name}</div>
            </div>

            <div className="mt-auto">
                <a 
                    href={cls.meeting_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                    <ExternalLink size={16} className="mr-2" /> Join Class
                </a>
            </div>
          </div>
        ))}
        {classes.length === 0 && <div className="col-span-full text-center py-12 text-slate-500">No live classes scheduled for your class.</div>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Live Class" footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Schedule</Button></>}>
        <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2"><Label>Class Title</Label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Class</Label><Input value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} /></div>
                <div className="space-y-2"><Label>Section</Label><Input value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Subject</Label><Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} /></div>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                <div className="space-y-2"><Label>Start</Label><Input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} /></div>
                <div className="space-y-2"><Label>End</Label><Input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Meeting URL (Zoom/Meet)</Label><Input value={formData.meeting_url} onChange={e => setFormData({...formData, meeting_url: e.target.value})} placeholder="https://..." required /></div>
            <div className="space-y-2">
                <Label>Teacher</Label>
                <Select value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})}>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default LiveClasses;
