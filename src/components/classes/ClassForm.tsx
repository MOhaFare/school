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
  onSubmit: (data: { name: string; teacher_id: string; capacity: number; id?: string; school_id?: string }) => void;
}

const grades = ['Lower', 'Upper', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const ClassForm = forwardRef<HTMLFormElement, ClassFormProps>(({ schoolClass, teachers, onSubmit }, ref) => {
  const { profile } = useGlobal();
  
  // State for form fields
  const [grade, setGrade] = useState(grades[0]);
  const [section, setSection] = useState('A');
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');
  const [capacity, setCapacity] = useState(30);
  const [schoolId, setSchoolId] = useState<string | undefined>(profile?.school_id);
  
  // State for dynamic sections
  const [availableSections, setAvailableSections] = useState<string[]>(['A', 'B', 'C']);

  // Fetch sections from DB
  useEffect(() => {
    const fetchSections = async () => {
      const { data } = await supabase.from('sections').select('name').order('name');
      if (data && data.length > 0) {
        setAvailableSections(data.map(s => s.name));
        if (!schoolClass) setSection(data[0].name);
      }
    };
    fetchSections();
  }, [schoolClass]);

  // Initialize form data when editing
  useEffect(() => {
    if (schoolClass) {
      // Parse "10-A" from "Class 10-A"
      const rawName = schoolClass.name.replace('Class ', '');
      const parts = rawName.split('-');
      
      if (parts.length >= 2) {
        setGrade(parts[0]);
        setSection(parts[1]);
      } else {
        // Fallback if format doesn't match
        setGrade(grades[0]);
        setSection(availableSections[0] || 'A');
      }

      setTeacherId(schoolClass.teacher.id);
      setCapacity(schoolClass.capacity || 30);
      setSchoolId((schoolClass as any).school_id || profile?.school_id);
    } else {
      // Defaults for new class
      setGrade(grades[0]);
      setSection(availableSections[0] || 'A');
      setTeacherId(teachers[0]?.id || '');
      setCapacity(30);
      setSchoolId(profile?.school_id);
    }
  }, [schoolClass, teachers, profile, availableSections]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Combine Grade and Section to form the Name (e.g., "10-A")
    const className = `${grade}-${section}`;
    
    onSubmit({ 
      name: className,
      teacher_id: teacherId,
      capacity,
      id: schoolClass?.id,
      school_id: schoolId
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
          <Select 
            id="section" 
            value={section} 
            onChange={(e) => setSection(e.target.value)} 
            required
          >
            {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
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
