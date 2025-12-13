import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/format';
import Badge from '../components/ui/Badge';
import { useGlobal } from '../context/GlobalContext';

interface LessonPlanItem {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  class: string;
  section: string;
  subject: string;
  topic: string;
  date: string;
  time_from: string;
  time_to: string;
  status: 'planned' | 'completed' | 'postponed';
}

const LessonPlan: React.FC = () => {
  const { profile } = useGlobal();
  const [lessons, setLessons] = useState<LessonPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonPlanItem | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    teacher_id: '',
    class: '9',
    section: 'A',
    subject: 'Mathematics',
    topic: '',
    date: new Date().toISOString().split('T')[0],
    time_from: '09:00',
    time_to: '10:00',
    status: 'planned' as const
  });

  useEffect(() => {
    fetchLessons();
    fetchTeachers();
  }, []);

  const fetchLessons = async () => {
    setLoading(true);
    let query = supabase.from('lesson_plans').select('*, teachers(name)').order('date', { ascending: false });
    
    // If teacher, only show their lessons
    if (profile?.role === 'teacher') {
        const { data: teacherData } = await supabase.from('teachers').select('id').eq('user_id', profile.id).single();
        if (teacherData) {
            query = query.eq('teacher_id', teacherData.id);
        }
    }

    const { data, error } = await query;
    if (error) toast.error('Failed to load lesson plans');
    else {
        setLessons(data.map((l: any) => ({
            ...l,
            teacher_name: l.teachers?.name || 'Unknown'
        })));
    }
    setLoading(false);
  };

  const fetchTeachers = async () => {
    const { data } = await supabase.from('teachers').select('id, name');
    if (data) setTeachers(data);
  };

  const handleOpenModal = (lesson?: LessonPlanItem) => {
    setSelectedLesson(lesson || null);
    if (lesson) {
      setFormData({
        teacher_id: lesson.teacher_id,
        class: lesson.class,
        section: lesson.section,
        subject: lesson.subject,
        topic: lesson.topic,
        date: lesson.date,
        time_from: lesson.time_from,
        time_to: lesson.time_to,
        status: lesson.status
      });
    } else {
      // Default teacher if logged in as teacher
      const currentTeacher = profile?.role === 'teacher' ? teachers.find(t => t.name === profile.name) : null;
      setFormData({
        teacher_id: currentTeacher?.id || (teachers[0]?.id || ''),
        class: '9',
        section: 'A',
        subject: 'Mathematics',
        topic: '',
        date: new Date().toISOString().split('T')[0],
        time_from: '09:00',
        time_to: '10:00',
        status: 'planned'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedLesson) {
        const { error } = await supabase.from('lesson_plans').update(formData).eq('id', selectedLesson.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lesson_plans').insert(formData);
        if (error) throw error;
      }
      toast.success('Lesson plan saved');
      setIsModalOpen(false);
      fetchLessons();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('lesson_plans').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Deleted');
      setLessons(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
      const { error } = await supabase.from('lesson_plans').update({ status }).eq('id', id);
      if (error) toast.error('Update failed');
      else {
          toast.success(`Marked as ${status}`);
          fetchLessons();
      }
  };

  if (loading) return <TableSkeleton title="Lesson Planning" headers={['Date', 'Class', 'Subject', 'Topic', 'Status', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lesson Planning</h1>
          <p className="text-slate-500">Manage syllabus and daily teaching plans</p>
        </div>
        <Button onClick={() => handleOpenModal()}><Plus size={20} className="mr-2"/> Add Lesson Plan</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Topic</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {lessons.map(lesson => (
              <tr key={lesson.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{formatDate(lesson.date)}</div>
                    <div className="text-xs text-slate-500">{lesson.time_from.slice(0,5)} - {lesson.time_to.slice(0,5)}</div>
                </td>
                <td className="px-6 py-4 text-slate-600">{lesson.class}-{lesson.section}</td>
                <td className="px-6 py-4 text-slate-600">{lesson.subject}</td>
                <td className="px-6 py-4 font-medium text-slate-800">{lesson.topic}</td>
                <td className="px-6 py-4 text-slate-600 text-sm">{lesson.teacher_name}</td>
                <td className="px-6 py-4">
                  <Badge variant={lesson.status === 'completed' ? 'success' : lesson.status === 'postponed' ? 'danger' : 'warning'} className="capitalize">
                    {lesson.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  {lesson.status !== 'completed' && (
                      <button onClick={() => handleStatusChange(lesson.id, 'completed')} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Mark Complete"><CheckCircle size={16}/></button>
                  )}
                  <button onClick={() => handleOpenModal(lesson)} className="text-slate-500 hover:text-blue-600 p-1 rounded"><Edit size={16}/></button>
                  <button onClick={() => handleDelete(lesson.id)} className="text-slate-500 hover:text-red-600 p-1 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {lessons.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No lesson plans found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedLesson ? 'Edit Lesson Plan' : 'Add Lesson Plan'} footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Teacher</Label>
                <Select value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})} disabled={profile?.role === 'teacher'}>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
             </div>
             <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2"><Label>Class</Label><Input value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} /></div>
             <div className="space-y-2"><Label>Section</Label><Input value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} /></div>
          </div>
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} placeholder="e.g. Algebra - Quadratic Equations" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
            <div className="space-y-2"><Label>From</Label><Input type="time" value={formData.time_from} onChange={e => setFormData({...formData, time_from: e.target.value})} /></div>
            <div className="space-y-2"><Label>To</Label><Input type="time" value={formData.time_to} onChange={e => setFormData({...formData, time_to: e.target.value})} /></div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                <option value="planned">Planned</option>
                <option value="completed">Completed</option>
                <option value="postponed">Postponed</option>
            </Select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LessonPlan;
