import React, { useState, useEffect, forwardRef } from 'react';
import { Exam } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { supabase } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';

interface ExamFormProps {
  exam?: Exam | null;
  onSubmit: (data: Omit<Exam, 'id'> & { id?: string }) => void;
}

const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science', 'Amharic', 'General Science', 'Social Studies'];
const classes = ['KG1', 'KG2', 'KG3', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const semesters = ['First Semester', 'Second Semester', 'Summer Semester'];

const ExamForm = forwardRef<HTMLFormElement, ExamFormProps>(({ exam, onSubmit }, ref) => {
  const { profile } = useGlobal();
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    subject: subjects[0],
    class: classes[0],
    section: '',
    date: new Date().toISOString().split('T')[0],
    totalMarks: 100,
    passingMarks: 40,
    duration: '120 minutes',
    status: 'upcoming' as 'upcoming' | 'ongoing' | 'completed',
    semester: 'First Semester',
  });

  useEffect(() => {
    if (exam) {
      setFormData({
        name: exam.name,
        subject: exam.subject,
        class: exam.class,
        section: exam.section || '',
        date: exam.date,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        duration: exam.duration,
        status: exam.status,
        semester: exam.semester || 'First Semester',
      });
    } else {
      setFormData({
        name: '',
        subject: subjects[0],
        class: classes[0],
        section: '',
        date: new Date().toISOString().split('T')[0],
        totalMarks: 100,
        passingMarks: 40,
        duration: '120 minutes',
        status: 'upcoming',
        semester: 'First Semester',
      });
    }
  }, [exam]);

  // Fetch sections based on selected class
  useEffect(() => {
    const fetchSections = async () => {
      if (!profile?.school_id) return;
      
      const grade = formData.class;
      
      try {
        // Fetch classes that start with the grade (e.g., "9-%")
        // We removed "Class " prefix from the query as DB stores "9-A"
        const { data } = await supabase
          .from('classes')
          .select('name')
          .eq('school_id', profile.school_id)
          .ilike('name', `${grade}-%`);
          
        if (data && data.length > 0) {
          // Filter and extract sections
          const sections = data
            .filter(c => {
                // Ensure exact grade match (e.g., "1-A" matches "1", but "10-A" does not)
                const parts = c.name.split('-');
                return parts[0] === grade;
            })
            .map(c => {
              const parts = c.name.split('-');
              return parts.length > 1 ? parts[1] : '';
            })
            .filter(Boolean)
            .sort();
          
          const uniqueSections = Array.from(new Set(sections));
          setAvailableSections(uniqueSections);
          
          // Logic to preserve or reset selected section
          if (formData.section && !uniqueSections.includes(formData.section)) {
             // If current section is invalid for new class, reset to first available or empty
             setFormData(prev => ({ ...prev, section: uniqueSections[0] || '' }));
          } else if (!formData.section && uniqueSections.length > 0) {
             // If no section selected but options exist, select first one by default
             setFormData(prev => ({ ...prev, section: uniqueSections[0] }));
          }
        } else {
          setAvailableSections([]);
          setFormData(prev => ({ ...prev, section: '' }));
        }
      } catch (error) {
        console.error("Error fetching sections:", error);
      }
    };

    fetchSections();
  }, [formData.class, profile?.school_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, id: exam?.id });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Exam Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Mid Term" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="semester">Semester</Label>
          <Select id="semester" name="semester" value={formData.semester} onChange={handleChange}>
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select id="subject" name="subject" value={formData.subject} onChange={handleChange}>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="class">Class</Label>
          <Select id="class" name="class" value={formData.class} onChange={handleChange}>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="section">Section</Label>
          <Select id="section" name="section" value={formData.section} onChange={handleChange}>
            <option value="">All Sections</option>
            {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (e.g., 120 minutes)</Label>
          <Input id="duration" name="duration" value={formData.duration} onChange={handleChange} required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="totalMarks">Total Marks</Label>
          <Input id="totalMarks" name="totalMarks" type="number" value={formData.totalMarks} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passingMarks">Passing Marks</Label>
          <Input id="passingMarks" name="passingMarks" type="number" value={formData.passingMarks} onChange={handleChange} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" value={formData.status} onChange={handleChange}>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </Select>
      </div>
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

ExamForm.displayName = 'ExamForm';

export default ExamForm;
