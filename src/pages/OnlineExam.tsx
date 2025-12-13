import React, { useState, useEffect } from 'react';
import { Monitor, Plus, Edit, Trash2, Calendar, Clock, CheckCircle } from 'lucide-react';
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

interface OnlineExamItem {
  id: string;
  title: string;
  class: string;
  section: string;
  subject: string;
  start_date: string;
  end_date: string;
  duration_minutes: number;
  status: 'draft' | 'published' | 'closed';
}

const OnlineExam: React.FC = () => {
  const [exams, setExams] = useState<OnlineExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<OnlineExamItem | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    class: '9',
    section: 'A',
    subject: 'Mathematics',
    start_date: new Date().toISOString().slice(0, 16), // datetime-local format
    end_date: new Date().toISOString().slice(0, 16),
    duration_minutes: 60,
    status: 'draft' as const
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('online_exams').select('*').order('start_date', { ascending: false });
    if (error) toast.error('Failed to load online exams');
    else setExams(data || []);
    setLoading(false);
  };

  const handleOpenModal = (exam?: OnlineExamItem) => {
    setSelectedExam(exam || null);
    if (exam) {
      setFormData({
        title: exam.title,
        class: exam.class,
        section: exam.section || 'A',
        subject: exam.subject,
        start_date: new Date(exam.start_date).toISOString().slice(0, 16),
        end_date: new Date(exam.end_date).toISOString().slice(0, 16),
        duration_minutes: exam.duration_minutes,
        status: exam.status
      });
    } else {
      setFormData({
        title: '',
        class: '9',
        section: 'A',
        subject: 'Mathematics',
        start_date: new Date().toISOString().slice(0, 16),
        end_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        duration_minutes: 60,
        status: 'draft'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedExam) {
        const { error } = await supabase.from('online_exams').update(formData).eq('id', selectedExam.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('online_exams').insert(formData);
        if (error) throw error;
      }
      toast.success('Exam saved');
      setIsModalOpen(false);
      fetchExams();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('online_exams').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Deleted');
      setExams(prev => prev.filter(e => e.id !== id));
    }
  };

  if (loading) return <TableSkeleton title="Online Examinations" headers={['Exam Title', 'Class', 'Subject', 'Date Range', 'Status', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Online Examinations</h1>
          <p className="text-slate-500">Manage computer-based tests and quizzes</p>
        </div>
        <Button onClick={() => handleOpenModal()}><Plus size={20} className="mr-2"/> Create Exam</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Exam Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date Range</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {exams.map(exam => (
              <tr key={exam.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{exam.title}</td>
                <td className="px-6 py-4 text-slate-600">{exam.class}-{exam.section}</td>
                <td className="px-6 py-4 text-slate-600">{exam.subject}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex flex-col">
                        <span>From: {formatDate(exam.start_date)}</span>
                        <span>To: {formatDate(exam.end_date)}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={exam.status === 'published' ? 'success' : exam.status === 'closed' ? 'danger' : 'neutral'} className="capitalize">
                    {exam.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => handleOpenModal(exam)} className="text-slate-500 hover:text-blue-600 p-1 rounded"><Edit size={16}/></button>
                  <button onClick={() => handleDelete(exam.id)} className="text-slate-500 hover:text-red-600 p-1 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {exams.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No online exams created.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedExam ? 'Edit Exam' : 'Create Online Exam'} footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>Exam Title</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2"><Label>Class</Label><Input value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} /></div>
             <div className="space-y-2"><Label>Section</Label><Input value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} /></div>
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Start Date & Time</Label><Input type="datetime-local" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} /></div>
            <div className="space-y-2"><Label>End Date & Time</Label><Input type="datetime-local" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Duration (Minutes)</Label><Input type="number" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})} /></div>
            <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                </Select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OnlineExam;
