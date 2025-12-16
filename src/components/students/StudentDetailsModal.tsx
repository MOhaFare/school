import React, { useState, useEffect } from 'react';
import { Student, Fee, Grade, AttendanceRecord } from '../../types';
import Modal from '../ui/Modal';
import { User, DollarSign, GraduationCap, Calendar, Clock, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Badge from '../ui/Badge';
import { formatCurrency, formatDate } from '../../utils/format';
import { Skeleton } from '../ui/Skeleton';

interface StudentDetailsModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({ student, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'fees' | 'exams' | 'attendance'>('profile');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [fees, setFees] = useState<Fee[]>([]);
  const [grades, setGrades] = useState<(Grade & { examName: string })[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });

  useEffect(() => {
    if (student && isOpen) {
      fetchStudentData();
    }
  }, [student, isOpen]);

  const fetchStudentData = async () => {
    if (!student) return;
    setLoading(true);
    try {
      const [feesRes, gradesRes, attendanceRes] = await Promise.all([
        supabase.from('fees').select('*').eq('student_id', student.id).order('due_date', { ascending: false }),
        supabase.from('grades').select('*, exams(name)').eq('student_id', student.id).order('date', { ascending: false }),
        supabase.from('attendance').select('status').eq('student_id', student.id)
      ]);

      if (feesRes.data) setFees(feesRes.data);
      
      if (gradesRes.data) {
        setGrades(gradesRes.data.map((g: any) => ({
          ...g,
          examName: g.exams?.name || 'Unknown Exam'
        })));
      }

      if (attendanceRes.data) {
        const stats = attendanceRes.data.reduce((acc: any, curr: any) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          acc.total++;
          return acc;
        }, { present: 0, absent: 0, late: 0, total: 0 });
        setAttendanceStats(stats);
      }

    } catch (error) {
      console.error("Error fetching student details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0 flex flex-col items-center space-y-3">
          <div className="h-32 w-32 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-slate-400 overflow-hidden">
            {student.avatar ? (
              <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              student.name.charAt(0)
            )}
          </div>
          <Badge variant={student.status === 'active' ? 'success' : 'neutral'} className="text-sm px-3 py-1">
            {student.status.toUpperCase()}
          </Badge>
        </div>
        
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase">Full Name</h4>
            <p className="text-lg font-medium text-slate-900">{student.name}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase">Admission No</h4>
            <p className="text-base text-slate-900 font-mono">{student.id}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase">Class & Section</h4>
            <p className="text-base text-slate-900">{student.class} - {student.section}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase">Roll Number</h4>
            <p className="text-base text-slate-900">{student.rollNumber}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase">Date of Birth</h4>
            <p className="text-base text-slate-900">{formatDate(student.dob)}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase">Gender</h4>
            <p className="text-base text-slate-900">N/A</p> 
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase">Category</h4>
            <p className="text-base text-slate-900">{student.category_id || 'General'}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase">Admission Date</h4>
            <p className="text-base text-slate-900">{formatDate(student.enrollmentDate)}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <User size={20} className="mr-2 text-blue-600" /> Parent / Guardian Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase">Father/Guardian Name</h4>
            <p className="text-base font-medium text-slate-900">{student.parent_name || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase">Phone Number</h4>
            <div className="flex items-center gap-2 mt-1">
              <Phone size={16} className="text-slate-400" />
              <p className="text-base text-slate-900">{student.parent_phone || 'N/A'}</p>
            </div>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase">Email Address</h4>
            <div className="flex items-center gap-2 mt-1">
              <Mail size={16} className="text-slate-400" />
              <p className="text-base text-slate-900">{student.parent_email || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFees = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
          <p className="text-xs text-green-600 uppercase font-bold">Paid</p>
          <p className="text-xl font-bold text-green-700">{fees.filter(f => f.status === 'paid').length}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
          <p className="text-xs text-red-600 uppercase font-bold">Unpaid</p>
          <p className="text-xl font-bold text-red-700">{fees.filter(f => f.status === 'unpaid').length}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-center">
          <p className="text-xs text-orange-600 uppercase font-bold">Overdue</p>
          <p className="text-xl font-bold text-orange-700">{fees.filter(f => f.status === 'overdue').length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {fees.map(fee => (
              <tr key={fee.id}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{fee.description}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatDate(fee.due_date)}</td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900">{formatCurrency(fee.amount)}</td>
                <td className="px-4 py-3 text-right">
                  <Badge variant={fee.status === 'paid' ? 'success' : fee.status === 'overdue' ? 'danger' : 'warning'}>
                    {fee.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-slate-500">No fee records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderExams = () => (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Exam</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Grade</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">GPA</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {grades.map(grade => (
              <tr key={grade.id}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{grade.examName}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{grade.subject}</td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900">{grade.marks_obtained}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                    grade.grade.startsWith('A') ? 'bg-green-100 text-green-800' :
                    grade.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                    grade.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {grade.grade}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{grade.gpa}</td>
              </tr>
            ))}
            {grades.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-500">No exam records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
          <p className="text-3xl font-bold text-green-600">{attendanceStats.present}</p>
          <p className="text-xs text-slate-500 uppercase mt-1">Present</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
          <p className="text-3xl font-bold text-red-600">{attendanceStats.absent}</p>
          <p className="text-xs text-slate-500 uppercase mt-1">Absent</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
          <p className="text-3xl font-bold text-yellow-600">{attendanceStats.late}</p>
          <p className="text-xs text-slate-500 uppercase mt-1">Late</p>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center justify-between">
        <span className="font-semibold text-blue-900">Overall Attendance Rate</span>
        <span className="text-2xl font-bold text-blue-700">
          {attendanceStats.total > 0 
            ? Math.round((attendanceStats.present / attendanceStats.total) * 100) 
            : 0}%
        </span>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Profile" size="3xl">
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User size={16} className="inline mr-2" /> Profile
        </button>
        <button
          onClick={() => setActiveTab('fees')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'fees' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <DollarSign size={16} className="inline mr-2" /> Fees
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'exams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <GraduationCap size={16} className="inline mr-2" /> Exam Results
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'attendance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar size={16} className="inline mr-2" /> Attendance
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="min-h-[300px]">
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'fees' && renderFees()}
          {activeTab === 'exams' && renderExams()}
          {activeTab === 'attendance' && renderAttendance()}
        </div>
      )}
    </Modal>
  );
};

export default StudentDetailsModal;
