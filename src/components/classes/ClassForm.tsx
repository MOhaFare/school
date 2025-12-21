import React, { useState, useEffect, forwardRef } from 'react';
import { SchoolClass, Teacher } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { useGlobal } from '../../context/GlobalContext';
import { supabase } from '../../lib/supabaseClient';

interface ClassFormProps {
  schoolClass?: Omit<SchoolClass, 'studentCount' | 'averageGpa' | 'subjects'> | null;
  teachers: Teacher[];
  onSubmit: (data: { name: string; teacher_id: string; capacity: number; id?: string; school_id?: string; subject_group_id?: string }) => void;
}

// Updated grades list: KG1 to 12
const grades = ['KG1', 'KG2', 'KG3', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const ClassForm = forwardRef<HTMLFormElement, ClassFormProps>(({ schoolClass, teachers, onSubmit }, ref) => {
  const { profile } = useGlobal();
  
  // State for form fields
  const [grade, setGrade] = useState(grades[0]);
  const [section, setSection] = useState('');
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');
  const [capacity, setCapacity] = useState(30);
  const [schoolId, setSchoolId] = useState<string | undefined>(profile?.school_id);
  const [subjectGroupId, setSubjectGroupId] = useState('');
  
  // State for dynamic data
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [subjectGroups, setSubjectGroups] = useState<{id: string, name: string}[]>([]);

  // Fetch sections and subject groups
  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      
      const [sectionsRes, groupsRes] = await Promise.all([
        supabase.from('sections').select('name').eq('school_id', profile.school_id).order('name'),
        supabase.from('subject_groups').select('id, name').eq('school_id', profile.school_id).order('name')
      ]);

      if (sectionsRes.data && sectionsRes.data.length > 0) {
        const sections = sectionsRes.data.map(s => s.name);
        setAvailableSections(sections);
        if (!schoolClass) setSection(sections[0]);
      } else {
        setAvailableSections(['A', 'B', 'C']);
        if (!schoolClass) setSection('A');
      }

      if (groupsRes.data) {
        setSubjectGroups(groupsRes.data);
      }
    };
    fetchData();
  }, [schoolClass, profile]);

  // Initialize form data when editing
  useEffect(() => {
    if (schoolClass) {
      const rawName = schoolClass.name.replace('Class ', '');
      const parts = rawName.split('-');
      
      if (parts.length >= 2) {
        setGrade(parts[0]);
        setSection(parts[1]);
      } else {
        setGrade(grades[0]);
      }

      setTeacherId(schoolClass.teacher.id);
      setCapacity(schoolClass.capacity || 30);
      setSchoolId((schoolClass as any).school_id || profile?.school_id);
      setSubjectGroupId((schoolClass as any).subject_group_id || '');
    } else {
      setGrade(grades[0]);
      setTeacherId(teachers[0]?.id || '');
      setCapacity(30);
      setSchoolId(profile?.school_id);
    }
  }, [schoolClass, teachers, profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const className = `${grade}-${section}`;
    
    onSubmit({ 
      name: className,
      teacher_id: teacherId,
      capacity,
      id: schoolClass?.id,
      school_id: schoolId,
      subject_group_id: subjectGroupId || undefined
    });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="grade">Grade / Class</Label>
          <Select 
            id="grade" 
            value={grade} 
            onChange={(e) => setGrade(e.target.value)} 
            required
          >
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="section">Section</Label>
          {availableSections.length > 0 ? (
            <Select 
              id="section" 
              value={section} 
              onChange={(e) => setSection(e.target.value)} 
              required
            >
              {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          ) : (
            <div className="text-sm text-red-500 mt-2">
              No sections found. Please add sections in Academics &gt; Sections.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="teacher_id">Class Teacher</Label>
          {teachers.length > 0 ? (
            <Select 
              id="teacher_id" 
              value={teacherId} 
              onChange={(e) => setTeacherId(e.target.value)} 
              required
            >
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          ) : (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-xs">
              No teachers available.
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input 
            id="capacity" 
            type="number" 
            min="1" 
            value={capacity} 
            onChange={(e) => setCapacity(parseInt(e.target.value))} 
            required 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject_group">Assign Subject Group</Label>
        <Select 
            id="subject_group" 
            value={subjectGroupId} 
            onChange={(e) => setSubjectGroupId(e.target.value)}
        >
            <option value="">-- No Subjects Assigned --</option>
            {subjectGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
            ))}
        </Select>
        <p className="text-xs text-gray-500">
            Assign a subject group to define what subjects are taught in this class.
        </p>
      </div>

      <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
        <p className="text-sm text-blue-800">
          <strong>Preview:</strong> Class {grade}-{section}
        </p>
      </div>

      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

ClassForm.displayName = 'ClassForm';

export default ClassForm;
