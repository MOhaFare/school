import React, { useEffect, useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabaseClient';
import { Student, Teacher } from '../types';
import StudentDetailsModal from '../components/students/StudentDetailsModal';
import { Loader, User, Mail, Phone, Calendar, Building2, Briefcase } from 'lucide-react';
import Badge from '../components/ui/Badge';
import { formatDate, formatCurrency } from '../utils/format';

const Profile: React.FC = () => {
  const { user, profile } = useGlobal();
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [teacherData, setTeacherData] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!user || !profile) return;
      setLoading(true);
      try {
        if (profile.role === 'student') {
          const { data } = await supabase
            .from('students')
            .select('*, schools(name)')
            .eq('user_id', user.id)
            .single();
          
          if (data) {
            setStudentData({
              id: data.id,
              name: data.name,
              email: data.email,
              class: data.class,
              section: data.section,
              rollNumber: data.roll_number,
              phone: data.phone,
              enrollmentDate: data.enrollment_date,
              issuedDate: data.issued_date,
              expiryDate: data.expiry_date,
              dob: data.dob,
              status: data.status,
              grade: data.grade,
              avatar: data.avatar,
              parent_name: data.parent_name,
              parent_email: data.parent_email,
              parent_phone: data.parent_phone,
              school_name: data.schools?.name
            } as Student);
          }
        } else if (profile.role === 'teacher') {
          const { data } = await supabase
            .from('teachers')
            .select('*, schools(name)')
            .eq('user_id', user.id)
            .single();
            
          if (data) {
            setTeacherData({
              id: data.id,
              name: data.name,
              email: data.email,
              subject: data.subject,
              phone: data.phone,
              joinDate: data.join_date,
              issuedDate: data.issued_date,
              expiryDate: data.expiry_date,
              dob: data.dob,
              salary: data.salary,
              status: data.status,
              avatar: data.avatar,
              shift: data.shift,
              school_name: data.schools?.name
            } as Teacher);
          }
        }
      } catch (error) {
        console.error("Error fetching profile details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [user, profile]);

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader className="animate-spin text-blue-600" size={48} /></div>;
  }

  // Admin Profile View
  if (profile?.role === 'admin' || profile?.role === 'system_admin' || profile?.role === 'principal') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center">
          <div className="h-32 w-32 rounded-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-500 mb-4 overflow-hidden border-4 border-white shadow-lg">
            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover"/> : profile.name.charAt(0)}
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
          <Badge variant="info" className="mt-2 text-sm px-3 py-1 capitalize">{profile.role.replace('_', ' ')}</Badge>
          
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full text-left max-w-lg">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Email</p>
              <p className="text-slate-900 flex items-center gap-2"><Mail size={16}/> {user?.email}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">School ID</p>
              <p className="text-slate-900 flex items-center gap-2"><Building2 size={16}/> {profile.school_id || 'System'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student Profile View
  if (studentData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <button 
                onClick={() => setIsStudentModalOpen(true)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
                View Full Academic Record
            </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-32"></div>
            <div className="px-8 pb-8">
                <div className="relative flex justify-between items-end -mt-12 mb-6">
                    <div className="h-24 w-24 rounded-full bg-white p-1 shadow-lg">
                        <div className="h-full w-full rounded-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-500 overflow-hidden">
                            {studentData.avatar ? <img src={studentData.avatar} className="w-full h-full object-cover"/> : studentData.name.charAt(0)}
                        </div>
                    </div>
                    <div className="mb-1">
                        <Badge variant="success" className="text-sm px-3 py-1">Active Student</Badge>
                    </div>
                </div>
                
                <h2 className="text-3xl font-bold text-slate-900">{studentData.name}</h2>
                <p className="text-slate-500">{studentData.school_name}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 border-b pb-2">Academic Info</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500">Class</p>
                                <p className="font-medium">{studentData.class} - {studentData.section}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Roll Number</p>
                                <p className="font-medium">{studentData.rollNumber}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Admission No</p>
                                <p className="font-medium">{studentData.id}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Admission Date</p>
                                <p className="font-medium">{formatDate(studentData.enrollmentDate)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 border-b pb-2">Personal Info</h3>
                        <div className="grid grid-cols-1 gap-4 text-sm">
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-slate-400"/>
                                <span>{studentData.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-slate-400"/>
                                <span>{studentData.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-slate-400"/>
                                <span>DOB: {formatDate(studentData.dob)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <StudentDetailsModal 
            student={studentData}
            isOpen={isStudentModalOpen}
            onClose={() => setIsStudentModalOpen(false)}
        />
      </div>
    );
  }

  // Teacher Profile View
  if (teacherData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Staff Profile</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                    <div className="h-32 w-32 rounded-lg bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-500 overflow-hidden">
                        {teacherData.avatar ? <img src={teacherData.avatar} className="w-full h-full object-cover"/> : teacherData.name.charAt(0)}
                    </div>
                </div>
                
                <div className="flex-grow space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{teacherData.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="info">{teacherData.subject} Teacher</Badge>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600">{teacherData.school_name}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-700">
                                <Mail size={16} className="text-slate-400"/> {teacherData.email}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-700">
                                <Phone size={16} className="text-slate-400"/> {teacherData.phone}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-700">
                                <Calendar size={16} className="text-slate-400"/> Joined: {formatDate(teacherData.joinDate)}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-700">
                                <Briefcase size={16} className="text-slate-400"/> ID: {teacherData.id}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-700">
                                <Clock size={16} className="text-slate-400"/> Shift: {teacherData.shift || 'Morning'}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-700">
                                <DollarSign size={16} className="text-slate-400"/> Salary: {formatCurrency(teacherData.salary)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return <div className="text-center py-12 text-slate-500">Profile not found.</div>;
};

export default Profile;
