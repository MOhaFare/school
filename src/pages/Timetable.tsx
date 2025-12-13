import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Clock, User, BookOpen, Edit } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { SchoolClass, Teacher, Course } from '../types';
import { useLocation } from 'react-router-dom';

interface TimetableEntry {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_name: string;
  teacher_name: string;
  class_name?: string;
  // Raw IDs for editing
  subject_id?: string;
  teacher_id?: string;
  class_id?: string;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Timetable: React.FC = () => {
  const location = useLocation();
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [selectedId, setSelectedId] = useState<string>('');
  
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [formData, setFormData] = useState({
    day_of_week: 'Monday',
    subject_id: '',
    teacher_id: '',
    class_id: '',
    start_time: '09:00',
    end_time: '10:00'
  });

  useEffect(() => {
    // Check if we are on the teachers-timetable route
    if (location.pathname === '/teachers-timetable') {
      setViewMode('teacher');
    } else {
      setViewMode('class');
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: classesData } = await supabase.from('classes').select('id, name');
      const { data: teachersData } = await supabase.from('teachers').select('id, name');
      const { data: coursesData } = await supabase.from('courses').select('id, name');
      
      if (classesData) setClasses(classesData.map((c: any) => ({ ...c, name: `Class ${c.name}` })) as any);
      if (teachersData) setTeachers(teachersData as any);
      if (coursesData) setCourses(coursesData as any);
      
      // Set initial selection based on view mode
      if (viewMode === 'class' && classesData && classesData.length > 0) {
        setSelectedId(classesData[0].id);
      } else if (viewMode === 'teacher' && teachersData && teachersData.length > 0) {
        setSelectedId(teachersData[0].id);
      }
    };
    fetchInitialData();
  }, [viewMode]); // Re-run when viewMode changes to set correct initial ID

  useEffect(() => {
    if (selectedId) {
      fetchTimetable();
    }
  }, [selectedId, viewMode]);

  const fetchTimetable = async () => {
    setLoading(true);
    let query = supabase
      .from('timetables')
      .select(`
        id, day_of_week, start_time, end_time, class_id, teacher_id, subject_id,
        courses(name),
        teachers(name),
        classes(name)
      `);

    if (viewMode === 'class') {
      query = query.eq('class_id', selectedId);
    } else {
      query = query.eq('teacher_id', selectedId);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load timetable');
    } else {
      const formattedData = data.map((item: any) => ({
        id: item.id,
        day_of_week: item.day_of_week,
        start_time: item.start_time.slice(0, 5),
        end_time: item.end_time.slice(0, 5),
        subject_name: item.courses?.name || 'N/A',
        teacher_name: item.teachers?.name || 'N/A',
        class_name: item.classes?.name ? `Class ${item.classes.name}` : 'N/A',
        subject_id: item.subject_id,
        teacher_id: item.teacher_id,
        class_id: item.class_id
      }));
      setTimetable(formattedData);
    }
    setLoading(false);
  };

  const handleOpenModal = (entry?: TimetableEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        day_of_week: entry.day_of_week,
        subject_id: entry.subject_id || '',
        teacher_id: entry.teacher_id || '',
        class_id: entry.class_id || '',
        start_time: entry.start_time,
        end_time: entry.end_time
      });
    } else {
      setEditingEntry(null);
      setFormData({
        day_of_week: 'Monday',
        subject_id: '',
        teacher_id: viewMode === 'teacher' ? selectedId : '',
        class_id: viewMode === 'class' ? selectedId : '',
        start_time: '09:00',
        end_time: '10:00'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...formData,
      // Ensure IDs are set if not modified in form
      class_id: formData.class_id || (viewMode === 'class' ? selectedId : ''),
      teacher_id: formData.teacher_id || (viewMode === 'teacher' ? selectedId : ''),
    };

    if (!payload.class_id || !payload.teacher_id || !payload.subject_id) {
        toast.error("Please fill all fields.");
        return;
    }

    try {
      if (editingEntry) {
        const { error } = await supabase.from('timetables').update(payload).eq('id', editingEntry.id);
        if (error) throw error;
        toast.success('Timetable updated');
      } else {
        const { error } = await supabase.from('timetables').insert(payload);
        if (error) throw error;
        toast.success('Added to timetable');
      }
      setIsModalOpen(false);
      fetchTimetable();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      const { error } = await supabase.from('timetables').delete().eq('id', id);
      if (error) throw error;
      toast.success('Entry removed');
      setTimetable(prev => prev.filter(t => t.id !== id));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleViewChange = (mode: 'class' | 'teacher') => {
      setViewMode(mode);
      if (mode === 'class' && classes.length > 0) setSelectedId(classes[0].id);
      if (mode === 'teacher' && teachers.length > 0) setSelectedId(teachers[0].id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Timetable</h1>
          <p className="text-slate-500 mt-1">Manage weekly schedules</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex">
             <button onClick={() => handleViewChange('class')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'class' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>Class View</button>
             <button onClick={() => handleViewChange('teacher')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'teacher' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>Teacher View</button>
          </div>
          
          <Select 
            value={selectedId} 
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-48"
          >
            {viewMode === 'class' 
                ? classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                : teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
            }
          </Select>
          
          <Button onClick={() => handleOpenModal()}>
            <Plus size={20} className="mr-2" /> Add Schedule
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {days.map(day => (
          <div key={day} className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
            <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-t-xl">
              <h3 className="font-semibold text-slate-700 text-center">{day}</h3>
            </div>
            <div className="p-3 space-y-3 flex-grow">
              {timetable.filter(t => t.day_of_week === day).sort((a,b) => a.start_time.localeCompare(b.start_time)).map(entry => (
                <div key={entry.id} className="bg-blue-50 p-3 rounded-lg border border-blue-100 relative group hover:shadow-sm transition-shadow">
                  <div className="flex items-center text-xs font-medium text-blue-600 mb-1">
                    <Clock size={12} className="mr-1" />
                    {entry.start_time} - {entry.end_time}
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{entry.subject_name}</p>
                  
                  {viewMode === 'class' ? (
                      <div className="flex items-center text-xs text-slate-500 mt-1">
                        <User size={12} className="mr-1"/> {entry.teacher_name}
                      </div>
                  ) : (
                      <div className="flex items-center text-xs text-slate-500 mt-1">
                        <BookOpen size={12} className="mr-1"/> {entry.class_name}
                      </div>
                  )}

                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-md p-0.5 shadow-sm">
                    <button onClick={() => handleOpenModal(entry)} className="text-slate-500 hover:text-blue-600 p-0.5"><Edit size={12} /></button>
                    <button onClick={() => handleDelete(entry.id)} className="text-slate-500 hover:text-red-600 p-0.5"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
              {timetable.filter(t => t.day_of_week === day).length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs italic">No classes</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: e.target.value})}>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})}>
                <option value="">Select Subject</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Class</Label>
                <Select 
                    value={formData.class_id} 
                    onChange={e => setFormData({...formData, class_id: e.target.value})}
                    disabled={viewMode === 'class' && !editingEntry}
                >
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
             </div>
             <div className="space-y-2">
                <Label>Teacher</Label>
                <Select 
                    value={formData.teacher_id} 
                    onChange={e => setFormData({...formData, teacher_id: e.target.value})}
                    disabled={viewMode === 'teacher' && !editingEntry}
                >
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Timetable;
