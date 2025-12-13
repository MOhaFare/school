import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Student } from '../types';

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

  // Expanded Options
  const classes = ['Lower', 'Upper', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'Graduated'];
  const sections = ['A', 'B', 'C'];

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

  const handlePromote = async () => {
    if (selectedStudentIds.size === 0) {
      toast.error('Please select at least one student.');
      return;
    }
    if (!targetClass || (targetClass !== 'Graduated' && !targetSection)) {
      toast.error('Please select a target class and section.');
      return;
    }

    if (!confirm(`Promote ${selectedStudentIds.size} students to Class ${targetClass}-${targetSection}?`)) return;

    setIsPromoting(true);
    try {
      const updateData: any = {
        class: targetClass,
        section: targetSection,
        grade: targetClass === 'Graduated' ? 'Graduated' : (targetClass === 'Lower' || targetClass === 'Upper' ? `${targetClass} Class` : `Grade ${targetClass}`)
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
      setStudents([]);
      setSelectedStudentIds(new Set());
      setCurrentClass('');
      setCurrentSection('');
      
    } catch (error: any) {
      toast.error(`Promotion failed: ${error.message}`);
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Promote Students</h1>
        <p className="text-slate-500">Move students to the next academic session or class.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Source Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-2">1</div>
            Select Current Class
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Class</label>
              <Select value={currentClass} onChange={e => setCurrentClass(e.target.value)}>
                <option value="">Select</option>
                {classes.filter(c => c !== 'Graduated').map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Section</label>
              <Select value={currentSection} onChange={e => setCurrentSection(e.target.value)}>
                <option value="">Select</option>
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>
        </div>

        {/* Target Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
            <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mr-2">2</div>
            Promote To
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Next Class</label>
              <Select value={targetClass} onChange={e => setTargetClass(e.target.value)}>
                <option value="">Select</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Next Section</label>
              <Select value={targetSection} onChange={e => setTargetSection(e.target.value)} disabled={targetClass === 'Graduated'}>
                <option value="">Select</option>
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <Users size={18} className="mr-2 text-slate-500"/>
              Students in Class {currentClass}-{currentSection}
            </h3>
            <div className="text-sm text-slate-500">
              Selected: <span className="font-bold text-slate-900">{selectedStudentIds.size}</span> / {students.length}
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left w-12">
                    <input 
                      type="checkbox" 
                      checked={selectedStudentIds.size === students.length}
                      onChange={() => {
                        if (selectedStudentIds.size === students.length) setSelectedStudentIds(new Set());
                        else setSelectedStudentIds(new Set(students.map(s => s.id)));
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedStudentIds.has(student.id)}
                        onChange={() => handleToggleStudent(student.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">{student.rollNumber}</td>
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
            >
              Promote Selected Students <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {students.length === 0 && currentClass && currentSection && !loading && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No Students Found</h3>
          <p className="text-slate-500">There are no active students in Class {currentClass}-{currentSection}.</p>
        </div>
      )}
    </div>
  );
};

export default PromoteStudents;
