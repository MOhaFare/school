import React, { useEffect, useState } from 'react';
import { BookOpen, Calendar, Clock, DollarSign, GraduationCap, TrendingUp, AlertCircle } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { supabase } from '../../lib/supabaseClient';
import { Skeleton } from '../ui/Skeleton';
import StatCard from '../StatCard';
import { formatCurrency, formatDate } from '../../utils/format';
import { Student } from '../../types';

const StudentDashboard: React.FC = () => {
  const { user, profile } = useGlobal();
  const [student, setStudent] = useState<Student | null>(null);
  const [stats, setStats] = useState({
    attendanceRate: 0,
    pendingFees: 0,
    avgGpa: 0,
    homeworkCount: 0
  });
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [todaysClasses, setTodayClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user || !profile?.school_id) return;
      setLoading(true);
      try {
        // 1. Try to get Student Details linked to this user_id
        let { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .eq('school_id', profile.school_id)
          .maybeSingle();

        // 2. Fallback: If not linked by user_id, try finding by email
        if (!studentData) {
           const { data: emailMatch } = await supabase
            .from('students')
            .select('*')
            .eq('email', user.email)
            .eq('school_id', profile.school_id)
            .maybeSingle();
            
           if (emailMatch) {
             studentData = emailMatch;
             // Optional: We could try to self-heal the link here, but the migration handles it better
           }
        }

        if (!studentData) {
          console.error("Student profile not found linked to user");
          setLoading(false);
          return;
        }

        setStudent(studentData);

        // 2. Fetch Stats in parallel
        const [attendanceRes, feesRes, gradesRes, homeworkRes, examsRes, timetableRes] = await Promise.all([
          // Attendance
          supabase.from('attendance')
            .select('status')
            .eq('student_id', studentData.id)
            .eq('school_id', profile.school_id),
          
          // Pending Fees
          supabase.from('fees')
            .select('amount')
            .eq('student_id', studentData.id)
            .eq('school_id', profile.school_id)
            .neq('status', 'paid'),

          // Grades (for GPA)
          supabase.from('grades')
            .select('gpa')
            .eq('student_id', studentData.id)
            .eq('school_id', profile.school_id),

          // Active Homework
          supabase.from('homework')
            .select('id', { count: 'exact' })
            .eq('class', studentData.class)
            .eq('school_id', profile.school_id)
            .eq('status', 'active'),

          // Upcoming Exams
          supabase.from('exams')
            .select('*')
            .eq('class', studentData.class)
            .eq('school_id', profile.school_id)
            .eq('status', 'upcoming')
            .order('date', { ascending: true })
            .limit(3),

          // Today's Timetable
          supabase.from('timetables')
            .select('*, courses(name), teachers(name)')
            .eq('class_id', (await supabase.from('classes').select('id').eq('name', `${studentData.class}-${studentData.section}`).eq('school_id', profile.school_id).single()).data?.id)
            .eq('day_of_week', new Date().toLocaleDateString('en-US', { weekday: 'long' }))
            .order('start_time', { ascending: true })
        ]);

        // Process Attendance
        const totalDays = attendanceRes.data?.length || 0;
        const presentDays = attendanceRes.data?.filter(a => a.status === 'present').length || 0;
        const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

        // Process Fees
        const pendingFees = feesRes.data?.reduce((sum, f) => sum + f.amount, 0) || 0;

        // Process GPA
        const gpaList = gradesRes.data?.map(g => g.gpa) || [];
        const avgGpa = gpaList.length > 0 ? gpaList.reduce((a, b) => a + b, 0) / gpaList.length : 0;

        setStats({
          attendanceRate,
          pendingFees,
          avgGpa,
          homeworkCount: homeworkRes.count || 0
        });

        setUpcomingExams(examsRes.data || []);
        setTodayClasses(timetableRes.data || []);

      } catch (error) {
        console.error("Error fetching student dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-yellow-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Profile Not Linked</h2>
        <p className="text-slate-500 mt-2 max-w-md">
          Your user account is not currently linked to a student profile. Please contact the school administrator to link your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Student Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, {student.name}! Here is your daily overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Attendance" 
          value={`${stats.attendanceRate}%`} 
          icon={Calendar} 
          iconBgColor="bg-blue-500" 
          trend={stats.attendanceRate < 75 ? "Low Attendance" : "Good Standing"} 
          trendDirection={stats.attendanceRate >= 75 ? "up" : "down"} 
        />
        <StatCard 
          title="Pending Fees" 
          value={formatCurrency(stats.pendingFees)} 
          icon={DollarSign} 
          iconBgColor="bg-red-500" 
          trend={stats.pendingFees > 0 ? "Payment Due" : "All Clear"} 
          trendDirection={stats.pendingFees > 0 ? "down" : "up"} 
        />
        <StatCard 
          title="Average GPA" 
          value={stats.avgGpa.toFixed(2)} 
          icon={GraduationCap} 
          iconBgColor="bg-green-500" 
          trend="Current Term" 
          trendDirection="up" 
        />
        <StatCard 
          title="Homework" 
          value={stats.homeworkCount.toString()} 
          icon={BookOpen} 
          iconBgColor="bg-purple-500" 
          trend="Active Tasks" 
          trendDirection="up" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
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
                    <p className="text-xs text-slate-500">{cls.teachers?.name || 'Teacher'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-8">No classes scheduled for today.</p>
            )}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-orange-600" /> Upcoming Exams
          </h3>
          <div className="space-y-3 flex-grow">
            {upcomingExams.length > 0 ? (
              upcomingExams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div>
                    <p className="font-semibold text-slate-800">{exam.name}</p>
                    <p className="text-xs text-slate-500">{exam.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-700">{formatDate(exam.date)}</p>
                    <p className="text-xs text-orange-600">{exam.duration}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-8">No upcoming exams.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
