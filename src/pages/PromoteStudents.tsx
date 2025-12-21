import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, AlertTriangle, Users, Filter, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Student } from '../types';
import TableSkeleton from '../components/ui/TableSkeleton';

const PromoteStudents: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Selection States
  const [currentClass, setCurrentClass] = useState('');
  const [currentSection, setCurrentSection] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [targetSection, setTargetSection] = useState('');
  
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isPromoting, setIsPromoting] = useState(false);
  
  // Dynamic Data
  const [existingClasses, setExistingClasses] = useState<{grade: string, section: string}[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  
  // Standard Progression Order
  const progressionOrder = ['KG1', 'KG2', 'KG3', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'Graduated'];

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('name').order('name');
      if (data) {
        // Parse "Class 9-A" -> {grade: "9", section: "A"}
        const parsed = data.map(c => {
            const clean = c.name.replace('Class ', '');
            const parts = clean.split('-');
            if (parts.length >= 2) return { grade: parts[0], section: parts[1] };
            return null;
        }).filter(c => c !== null) as {grade: string, section: string}[];
        
        setExistingClasses(parsed);
        
        // Extract unique grades for dropdown
        const uniqueGrades = Array.from(new Set(parsed.map(c => c.grade))).sort((a, b) => {
             const idxA = progressionOrder.indexOf(a);
             const idxB = progressionOrder.indexOf(b);
             if (idxA !== -1 && idxB !== -1) return idxA - idxB;
             return a.localeCompare(b);
        });
        setAvailableGrades(uniqueGrades);
      }
    };
    fetchClasses();
  }, []);

  // Update Available Sections when Current Class changes
  useEffect(() => {
    if (currentClass) {
        const sections = existingClasses
            .filter(c => c.grade === currentClass)
            .map(c => c.section)
            .sort();
        setAvailableSections(sections);
        if (sections.length > 0) setCurrentSection(sections[0]);
        else setCurrentSection('');

        // AUTO-SELECT NEXT CLASS
        const currentIndex = progressionOrder.indexOf(currentClass);
        if (currentIndex !== -1 && currentIndex < progressionOrder.length - 1) {
            setTargetClass(progressionOrder[currentIndex + 1]);
        } else {
            setTargetClass('');
        }
    } else {
        setAvailableSections([]);
        setCurrentSection('');
        setTargetClass('');
    }
  }, [currentClass, existingClasses]);

  // Auto-set Target Section to match Current Section if possible
  useEffect(() => {
      if (targetClass && targetClass !== 'Graduated') {
          // Try to keep the same section (e.g. 9-A -> 10-A)
          // But we should ideally check if 10-A exists. For now, we allow selecting any valid section from the system.
          // Or we can just default to currentSection if we assume sections carry over.
          setTargetSection(currentSection);
      } else if (targetClass === 'Graduated') {
          setTargetSection('');
      }
  }, [targetClass, currentSection]);

  const fetchStudents = async () => {
    if (!currentClass || !currentSection) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class', currentClass)
        .eq('section', currentSection)
        .eq('status', 'active')
        .order('name');
        
      if (error) throw error;
      
      const fetchedStudents = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        rollNumber: s.roll_number,
        class: s.class,
        section: s.section,
        status: s.status,
        // ... other fields
      } as Student));
      
      setStudents(fetchedStudents);
      // Default select all
      setSelectedStudentIds(new Set(fetchedStudents.map(s => s.id)));
      
    } catch (error: any) {
      toast.error(`Failed to load students: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [currentClass, currentSection]);

  const handleToggleStudent = (id: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudentIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map(s => s.id)));
    }
  };

  const handlePromote = async () => {
    if (selectedStudentIds.size === 0) {
      toast.error('Please select at least one student.');
      return;
    }
    if (!targetClass || (targetClass !== 'Graduated' && !targetSection)) {
      toast.error('Please select a target class and section.');
      return;
    }

    if (!confirm(`Promote ${selectedStudentIds.size} students from Class ${currentClass}-${currentSection} to ${targetClass === 'Graduated' ? 'Graduated' : `Class ${targetClass}-${targetSection}`}?`)) return;

    setIsPromoting(true);
    try {
      const updateData: any = {
        class: targetClass,
        section: targetSection,
        grade: targetClass === 'Graduated' ? 'Graduated' : (targetClass.startsWith('KG') ? targetClass : `Grade ${targetClass}`)
      };

      if (targetClass === 'Graduated') {
        updateData.status = 'alumni';
        updateData.section = ''; // Clear section for alumni
      }

      const { error } = await supabase
        .from('students')
        .update(updateData)
        .in('id', Array.from(selectedStudentIds));

      if (error) throw error;

      toast.success('Students promoted successfully!');
      // Refresh list (which will be empty now as they moved)
      fetchStudents();
      setSelectedStudentIds(new Set());
      
    } catch (error: any) {
      toast.error(`Promotion failed: ${error.message}`);
    } finally {
      setIsPromoting(false);
    }
  };

  // Get all unique sections available in the system for the target dropdown
  const allSystemSections = Array.from(new Set(existingClasses.map(c => c.section))).sort();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <Users size={24} />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Promote Students</h1>
            <p className="text-slate-500">Move students to the next academic session or class.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Source Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-2">1</span>
            Select Current Class
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Class</label>
              <Select value={currentClass} onChange={e => setCurrentClass(e.target.value)}>
                <option value="">Select</option>
                {availableGrades.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Section</label>
              <Select value={currentSection} onChange={e => setCurrentSection(e.target.value)} disabled={!currentClass}>
                <option value="">Select</option>
                {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>
        </div>

        {/* Target Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mr-2">2</span>
            Promote To
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Next Class</label>
              <Select value={targetClass} onChange={e => setTargetClass(e.target.value)}>
                <option value="">Select</option>
                {progressionOrder.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Next Section</label>
              <Select value={targetSection} onChange={e => setTargetSection(e.target.value)} disabled={targetClass === 'Graduated'}>
                <option value="">Select</option>
                {allSystemSections.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <Filter size={18} className="mr-2 text-slate-500"/>
              Student List
            </h3>
            <div className="text-sm text-slate-500">
              Selected: <span className="font-bold text-slate-900">{selectedStudentIds.size}</span> / {students.length}
            </div>
        </div>
        
        {loading ? (
            <div className="p-6">
                <TableSkeleton title="" headers={['Roll No', 'Name', 'Current Status']} />
            </div>
        ) : students.length > 0 ? (
            <>
                <div className="max-h-[500px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                        <tr>
                        <th className="px-6 py-3 text-left w-16 bg-slate-50">
                            <input 
                            type="checkbox" 
                            checked={selectedStudentIds.size === students.length && students.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase bg-slate-50">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase bg-slate-50">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase bg-slate-50">Current Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {students.map(student => (
                        <tr key={student.id} className={`hover:bg-slate-50 ${selectedStudentIds.has(student.id) ? 'bg-blue-50/30' : ''}`}>
                            <td className="px-6 py-3">
                            <input 
                                type="checkbox" 
                                checked={selectedStudentIds.has(student.id)}
                                onChange={() => handleToggleStudent(student.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            </td>
                            <td className="px-6 py-3 text-sm text-slate-600 font-mono">{student.rollNumber}</td>
                            <td className="px-6 py-3 text-sm font-medium text-slate-900">{student.name}</td>
                            <td className="px-6 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                            </span>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <Button 
                    onClick={handlePromote} 
                    disabled={isPromoting || selectedStudentIds.size === 0}
                    loading={isPromoting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    >
                    Promote Selected Students <ArrowRight size={16} className="ml-2" />
                    </Button>
                </div>
            </>
        ) : (
            <div className="text-center py-16">
                {currentClass && currentSection ? (
                    <>
                        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">No Students Found</h3>
                        <p className="text-slate-500">There are no active students in Class {currentClass}-{currentSection}.</p>
                    </>
                ) : (
                    <>
                        <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">Select Class</h3>
                        <p className="text-slate-500">Please select a class and section to view students.</p>
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default PromoteStudents;
