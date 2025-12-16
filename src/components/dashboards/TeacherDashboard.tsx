import React, { useEffect, useState } from 'react';
import { Users, Library, FileText, Clock, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { supabase } from '../../lib/supabaseClient';
import { SchoolClass, Exam, Teacher } from '../../types';
import { Skeleton } from '../ui/Skeleton';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/format';
import { Button } from '../ui/Button';

const TeacherDashboard: React.FC = () => {
  const { profile, user } = useGlobal();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [assignedClasses, setAssignedClasses] = useState<SchoolClass[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [todaysClasses, setTodaysClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!user || !profile?.school_id) return;
      
      setLoading(true);
      try {
        // 1. Try to find teacher by user_id
        let { data: teacherData } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', user.id)
          .eq('school_id', profile.school_id)
          .maybeSingle();

        // 2. Fallback: Try to find by email if user_id link is missing
        if (!teacherData && user.email) {
           const { data: emailMatch } = await supabase
            .from('teachers')
            .select('*')
            .eq('email', user.email)
            .eq('school_id', profile.school_id)
            .maybeSingle();
            
           if (emailMatch) {
             teacherData = emailMatch;
             // Auto-heal: Link the user_id if it was missing
             if (!emailMatch.user_id) {
                await supabase.from('teachers').update({ user_id: user.id }).eq('id', emailMatch.id);
             }
           }
        }

        if (!teacherData) {
            console.warn("Teacher profile not found for user");
            setLoading(false);
            return;
        }

        setTeacher(teacherData);

        // 3. Fetch Related Data
        const [classesRes, examsRes, timetableRes] = await Promise.all([
          // Assigned Classes
          supabase.from('classes')
            .select('*, students(count)')
            .eq('teacher_id', teacherData.id)
            .eq('school_id', profile.school_id),
            
          // Upcoming Exams for these classes
          supabase.from('exams')
            .select('*')
            .eq('status', 'upcoming')
            .eq('school_id', profile.school_id)
            .order('date', { ascending: true })
            .limit(5),

          // Today's Timetable
          supabase.from('timetables')
            .select('*, classes(name), courses(name)')
            .eq('teacher_id', teacherData.id)
            .eq('day_of_week', new Date().toLocaleDateString('en-US', { weekday: 'long' }))
            .order('start_time', { ascending: true })
        ]);

        if (classesRes.error) throw classesRes.error;
        
        const transformedClasses = (classesRes.data || []).map((c: any) => ({ 
            ...c, 
            studentCount: c.students[0]?.count || 0,
            name: c.name.startsWith('Class ') ? c.name : `Class ${c.name}`
        }));
        
        setAssignedClasses(transformedClasses);
        
        // Filter exams relevant to teacher's classes
        const classNames = new Set(transformedClasses.map(c => c.name.replace('Class ', '')));
        const relevantExams = (examsRes.data || []).filter((e: any) => classNames.has(e.class));
        setExams(relevantExams);

        setTodaysClasses(timetableRes.data || []);

      } catch (error: any) {
        console.error("TeacherDashboard Error:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [user, profile, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-yellow-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Profile Not Linked</h2>
        <p className="text-slate-500 mt-2 max-w-md mb-6">
          Your user account is not currently linked to a teacher profile in the staff directory. 
          Please contact the school administrator to ensure your email matches your staff record.
        </p>
        <Button onClick={handleRetry} variant="secondary">
            <RefreshCw size={18} className="mr-2" /> Check Again
        </Button>
      </div>
    );
  }

  const totalStudentsInClasses = assignedClasses.reduce((sum, c) => sum + c.studentCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Teacher Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, {teacher.name}!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-blue-100 rounded-full text-blue-600">
            <Library className="h-8 w-8"/>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Assigned Classes</p>
            <p className="text-3xl font-bold text-slate-900">{assignedClasses.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-green-100 rounded-full text-green-600">
            <Users className="h-8 w-8"/>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Students</p>
            <p className="text-3xl font-bold text-slate-900">{totalStudentsInClasses}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-yellow-100 rounded-full text-yellow-600">
            <FileText className="h-8 w-8"/>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Upcoming Exams</p>
            <p className="text-3xl font-bold text-slate-900">{exams.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-blue-600" /> Today's Schedule
          </h3>
          <div className="space-y-3 flex-grow">
            {todaysClasses.length > 0 ? (
              todaysClasses.map((cls, idx) => (
                <div key={idx} className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-24 text-xs font-bold text-slate-500 text-center border-r border-slate-200 pr-3 mr-3">
                    {cls.start_time.slice(0, 5)} <br/> {cls.end_time.slice(0, 5)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{cls.courses?.name || 'Subject'}</p>
                    <p className="text-xs text-slate-500">Class {cls.classes?.name}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <Calendar size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No classes scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Exam Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <FileText className="mr-2 h-5 w-5 text-orange-600" /> Upcoming Exams
          </h3>
          <div className="space-y-3 flex-grow">
            {exams.length > 0 ? (
              exams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div>
                    <p className="font-semibold text-slate-800">{exam.name}</p>
                    <p className="text-xs text-slate-500">{exam.subject} • Class {exam.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-700">{formatDate(exam.date)}</p>
                    <p className="text-xs text-orange-600">{exam.duration}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <FileText size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No upcoming exams.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
