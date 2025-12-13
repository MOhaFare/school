import React, { useState, useRef, useEffect } from 'react';
import { Search, Printer, User, Users, Badge } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Student, Teacher } from '../types';
import IdCard from '../components/IdCard';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/ui/Skeleton';
import { useGlobal } from '../context/GlobalContext';

type Person = Student | Teacher;

const transformStudentToCamelCase = (dbStudent: any): Student => ({
  id: dbStudent.id,
  created_at: dbStudent.created_at,
  name: dbStudent.name,
  email: dbStudent.email,
  class: dbStudent.class,
  section: dbStudent.section,
  rollNumber: dbStudent.roll_number,
  phone: dbStudent.phone,
  enrollmentDate: dbStudent.enrollment_date,
  issuedDate: dbStudent.issued_date,
  expiryDate: dbStudent.expiry_date,
  dob: dbStudent.dob,
  status: dbStudent.status,
  avatar: dbStudent.avatar,
  grade: dbStudent.grade,
  user_id: dbStudent.user_id,
});

const transformTeacherToCamelCase = (dbTeacher: any): Teacher => ({
  id: dbTeacher.id,
  created_at: dbTeacher.created_at,
  name: dbTeacher.name,
  email: dbTeacher.email,
  subject: dbTeacher.subject,
  phone: dbTeacher.phone,
  joinDate: dbTeacher.join_date,
  issuedDate: dbTeacher.issued_date,
  expiryDate: dbTeacher.expiry_date,
  dob: dbTeacher.dob,
  salary: dbTeacher.salary,
  status: dbTeacher.status,
  avatar: dbTeacher.avatar,
  user_id: dbTeacher.user_id,
});

const PrintableGrid = React.forwardRef<HTMLDivElement, { people: Person[], type: 'Student' | 'Teacher', schoolName: string, schoolLogo?: string | null }>(({ people, type, schoolName, schoolLogo }, ref) => (
  <div ref={ref}>
    <div className="print-grid-container">
      {people.map(person => (
        <div key={person.id} className="print-card-wrapper">
          <IdCard person={person} type={type} schoolName={schoolName} schoolLogo={schoolLogo} />
        </div>
      ))}
    </div>
  </div>
));
PrintableGrid.displayName = 'PrintableGrid';

const IdCards: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const { schoolName, schoolLogo } = useGlobal();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          { data: studentsData, error: studentsError },
          { data: teachersData, error: teachersError }
        ] = await Promise.all([
          supabase.from('students').select('*'),
          supabase.from('teachers').select('*')
        ]);

        if (studentsError) throw studentsError;
        if (teachersError) throw teachersError;

        const transformedStudents = (studentsData || []).map(transformStudentToCamelCase);
        const transformedTeachers = (teachersData || []).map(transformTeacherToCamelCase);

        setStudents(transformedStudents);
        setTeachers(transformedTeachers);
        
        setSelectedPerson(transformedStudents[0] || null);
        
      } catch (error: any) {
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        toast.error(`Failed to load data: ${errorMessage}`);
        console.error("Error fetching ID card data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const listData = activeTab === 'students' ? students : teachers;
  const filteredData = listData.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const componentRef = useRef<HTMLDivElement>(null);
  const printAllRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `${selectedPerson?.name}-ID-Card` || 'ID-Card',
  });

  const handlePrintAll = useReactToPrint({
    content: () => printAllRef.current,
    documentTitle: `${activeTab}-ID-Cards-All`,
    pageStyle: `@page { size: A4 portrait; margin: 1cm; }`
  });

  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
  };

  const handleTabChange = (tab: 'students' | 'teachers') => {
    setActiveTab(tab);
    setSearchTerm('');
    const newPerson = tab === 'students' ? students[0] : teachers[0];
    setSelectedPerson(newPerson || null);
  };

  const themeColor = activeTab === 'students' ? 'orange' : 'teal';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">ID Card Generator</h1>
        <p className="text-muted-foreground mt-1">Create and print ID cards for students and teachers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex border-b border-border">
              <button onClick={() => handleTabChange('students')} className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'students' ? 'border-b-2 border-orange-600 text-orange-700' : 'text-muted-foreground hover:text-orange-600'}`}>
                <Users size={16} /> Students
              </button>
              <button onClick={() => handleTabChange('teachers')} className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'teachers' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-muted-foreground hover:text-teal-600'}`}>
                <User size={16} /> Teachers
              </button>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2 border bg-secondary border-border rounded-lg focus:ring-2 focus:border-transparent outline-none text-sm ${themeColor === 'orange' ? 'focus:ring-orange-500' : 'focus:ring-teal-500'}`} />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
            {loading ? (
              <div className="p-4 space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : (
              <>
                {filteredData.map(person => (
                  <div key={person.id} onClick={() => handleSelectPerson(person)} className={`flex items-center p-4 cursor-pointer border-l-4 transition-colors ${selectedPerson?.id === person.id ? (themeColor === 'orange' ? 'bg-orange-50 border-orange-600' : 'bg-teal-50 border-teal-600') : 'border-transparent hover:bg-gray-50'}`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold uppercase transition-colors overflow-hidden ${selectedPerson?.id === person.id ? (themeColor === 'orange' ? 'bg-orange-600' : 'bg-teal-600') : 'bg-gray-400'}`}>
                      {person.avatar ? <img src={person.avatar} alt={person.name} className="w-full h-full object-cover"/> : person.name.charAt(0)}
                    </div>
                    <div className="ml-3"><p className="font-medium text-primary">{person.name}</p><p className="text-sm text-muted-foreground">{person.id}</p></div>
                  </div>
                ))}
                {filteredData.length === 0 && <div className="p-8 text-center text-muted-foreground"><p>No {activeTab} found.</p></div>}
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-secondary rounded-lg flex flex-col items-center justify-center p-6">
          {loading ? (
            <Skeleton className="w-[512px] h-[300px]" />
          ) : selectedPerson ? (
            <div className="w-full flex flex-col items-center">
              <IdCard ref={componentRef} person={selectedPerson} type={activeTab === 'students' ? 'Student' : 'Teacher'} schoolName={schoolName} schoolLogo={schoolLogo} />
              <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <button onClick={handlePrint} className={`flex-1 flex items-center justify-center px-6 py-3 text-white rounded-lg transition-colors shadow-sm ${themeColor === 'orange' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700'}`}>
                  <Printer size={20} className="mr-2" /> Print Card
                </button>
                <button onClick={handlePrintAll} className={`flex-1 flex items-center justify-center px-6 py-3 rounded-lg transition-colors shadow-sm ${themeColor === 'orange' ? 'bg-orange-200 text-orange-800 hover:bg-orange-300' : 'bg-teal-200 text-teal-800 hover:bg-teal-300'}`}>
                  <Printer size={20} className="mr-2" /> Print All
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground"><Badge size={48} className="mx-auto mb-4" /><h3 className="text-lg font-medium text-primary">ID Card Preview</h3><p>No {activeTab} available to display.</p></div>
          )}
        </div>
      </div>
      
      <div style={{ display: 'none' }}>
        <PrintableGrid ref={printAllRef} people={filteredData} type={activeTab === 'students' ? 'Student' : 'Teacher'} schoolName={schoolName} schoolLogo={schoolLogo} />
      </div>
    </div>
  );
};

export default IdCards;
