import React, { useEffect, useState } from 'react';
import { Users, Library, FileText } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { supabase } from '../../lib/supabaseClient';
import { SchoolClass, Exam } from '../../types';
import { Skeleton } from '../ui/Skeleton';
import toast from 'react-hot-toast';

const TeacherDashboard: React.FC = () => {
  const { profile } = useGlobal();
  const [assignedClasses, setAssignedClasses] = useState<SchoolClass[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTeacherId = async () => {
      if (profile?.id) {
        const { data } = await supabase.from('teachers').select('id').eq('user_id', profile.id).single();
        if (data) {
          setTeacherId(data.id);
        }
      }
    };
    getTeacherId();
  }, [profile]);

  useEffect(() => {
    if (!teacherId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [classesResult, examsResult] = await Promise.all([
          supabase.from('classes').select('*, students(count)').eq('teacher_id', teacherId),
          supabase.from('exams').select('*').eq('status', 'upcoming')
        ]);

        const results = { classesResult, examsResult };
        for (const [key, result] of Object.entries(results)) {
          if (result.error) {
            throw new Error(`Failed to fetch ${key.replace('Result', '')}: ${result.error.message}`);
          }
        }

        const { data: classesData } = classesResult;
        const { data: examsData } = examsResult;

        const transformedClasses = (classesData || []).map((c: any) => ({ ...c, studentCount: c.students[0]?.count || 0 }));
        setAssignedClasses(transformedClasses);
        setExams(examsData || []);

      } catch (error: any) {
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        toast.error(`Failed to load dashboard: ${errorMessage}`);
        console.error("TeacherDashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherId]);

  if (loading || !profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const totalStudentsInClasses = assignedClasses.reduce((sum, c) => sum + c.studentCount, 0);
  const upcomingExams = exams.filter(e => assignedClasses.some(c => c.name.includes(e.class))).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {profile.name}!</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg"><Library className="h-6 w-6 text-blue-600"/></div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned Classes</p>
              <p className="text-2xl font-bold">{assignedClasses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg"><Users className="h-6 w-6 text-green-600"/></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{totalStudentsInClasses}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg"><FileText className="h-6 w-6 text-yellow-600"/></div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming Exams</p>
              <p className="text-2xl font-bold">{upcomingExams}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
