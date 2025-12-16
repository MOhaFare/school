import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import StudentAdmission from './pages/StudentAdmission';
import DisabledStudents from './pages/DisabledStudents';
import BulkDeleteStudents from './pages/BulkDeleteStudents';
import StudentCategories from './pages/StudentCategories';
import PromoteStudents from './pages/PromoteStudents';
import Sections from './pages/Sections';
import Exams from './pages/Exams';
import Grades from './pages/Grades';
import Payroll from './pages/Payroll';
import Classes from './pages/Classes';
import Results from './pages/Results';
import IdCards from './pages/IdCards';
import Courses from './pages/Courses';
import Departments from './pages/Departments';
import Library from './pages/Library';
import Hostel from './pages/Hostel';
import Transport from './pages/Transport';
import Events from './pages/Events';
import Noticeboard from './pages/Noticeboard';
import Fees from './pages/Fees';
import DueFees from './pages/DueFees';
import Attendance from './pages/Attendance';
import Features from './pages/Features';
import Settings from './pages/Settings';
import Incomes from './pages/Incomes';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import UserLogs from './pages/UserLogs';
import AuditTrail from './pages/AuditTrail';
import Timetable from './pages/Timetable';
import Inventory from './pages/Inventory';
import InventoryIssue from './pages/InventoryIssue';
import LibraryIssue from './pages/LibraryIssue';
import Leaves from './pages/Leaves';
import Certificates from './pages/Certificates';
import StaffAttendance from './pages/StaffAttendance';
import SubjectGroups from './pages/SubjectGroups';
import FeesMaster from './pages/FeesMaster';
import StudentTranscript from './pages/StudentTranscript';
import ExamSchedule from './pages/ExamSchedule';
import AdmitCardDesign from './pages/AdmitCardDesign';
import AssignTeacher from './pages/AssignTeacher';
import Homework from './pages/Homework';
import TransportAssign from './pages/TransportAssign';
import Schools from './pages/Schools';
import SuperAdminDashboard from './components/dashboards/SuperAdminDashboard';
import ComposeMessage from './pages/ComposeMessage';
import FrontOffice from './pages/FrontOffice';
import DownloadCenter from './pages/DownloadCenter';
import LessonPlan from './pages/LessonPlan';
import OnlineExam from './pages/OnlineExam';
import Alumni from './pages/Alumni';
import LiveClasses from './pages/LiveClasses';
import { GlobalProvider, useGlobal } from './context/GlobalContext';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import SignUp from './pages/auth/SignUp';
import { Toaster } from 'react-hot-toast';
import { Loader } from 'lucide-react';

// Role Groups
const ALL_ROLES = ['system_admin', 'admin', 'principal', 'teacher', 'student', 'parent', 'cashier'];
const STAFF_ROLES = ['system_admin', 'admin', 'principal', 'teacher', 'cashier'];
const ADMIN_ROLES = ['system_admin', 'admin', 'principal'];
const ACADEMIC_ROLES = ['system_admin', 'admin', 'principal', 'teacher'];
const FINANCE_ROLES = ['system_admin', 'admin', 'principal', 'cashier'];

const AppRoutes: React.FC = () => {
  const { session, loading, profile } = useGlobal();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Redirect System Admin to their dashboard if they hit root
  if (session && profile?.role === 'system_admin' && window.location.pathname === '/') {
    return <Navigate to="/super-admin" />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      <Route path="/forgot-password" element={!session ? <ForgotPassword /> : <Navigate to="/" />} />
      <Route path="/activate" element={!session ? <SignUp /> : <Navigate to="/" />} />

      {/* Protected Routes */}
      <Route path="/*" element={session ? (
        <Layout>
          <Routes>
            {/* Dashboard - Accessible by all authenticated users (Role specific view handled inside) */}
            <Route index element={<Dashboard />} />
            
            {/* System Admin Only */}
            <Route path="super-admin" element={<ProtectedRoute allowedRoles={['system_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="schools" element={<ProtectedRoute allowedRoles={['system_admin']}><Schools /></ProtectedRoute>} />

            {/* Front Office - Admin & Staff */}
            <Route path="front-office" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><FrontOffice /></ProtectedRoute>} />
            
            {/* Common Modules - Accessible by most but with internal restrictions */}
            <Route path="download-center" element={<ProtectedRoute allowedRoles={ALL_ROLES}><DownloadCenter /></ProtectedRoute>} />
            <Route path="noticeboard" element={<ProtectedRoute allowedRoles={ALL_ROLES}><Noticeboard /></ProtectedRoute>} />
            <Route path="events" element={<ProtectedRoute allowedRoles={ALL_ROLES}><Events /></ProtectedRoute>} />
            <Route path="live-classes" element={<ProtectedRoute allowedRoles={ALL_ROLES}><LiveClasses /></ProtectedRoute>} />
            <Route path="homework" element={<ProtectedRoute allowedRoles={[...ACADEMIC_ROLES, 'student', 'parent']}><Homework /></ProtectedRoute>} />

            {/* Academics - Admin & Teachers */}
            <Route path="timetable" element={<ProtectedRoute allowedRoles={[...ACADEMIC_ROLES, 'student']}><Timetable /></ProtectedRoute>} />
            <Route path="teachers-timetable" element={<ProtectedRoute allowedRoles={ACADEMIC_ROLES}><Timetable /></ProtectedRoute>} />
            <Route path="lesson-plan" element={<ProtectedRoute allowedRoles={ACADEMIC_ROLES}><LessonPlan /></ProtectedRoute>} />
            <Route path="courses" element={<ProtectedRoute allowedRoles={[...ACADEMIC_ROLES, 'student']}><Courses /></ProtectedRoute>} />
            <Route path="classes" element={<ProtectedRoute allowedRoles={[...ACADEMIC_ROLES, 'student']}><Classes /></ProtectedRoute>} />
            
            {/* Academics - Admin Only */}
            <Route path="assign-teacher" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AssignTeacher /></ProtectedRoute>} />
            <Route path="promote-students" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><PromoteStudents /></ProtectedRoute>} />
            <Route path="subject-groups" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><SubjectGroups /></ProtectedRoute>} />
            <Route path="sections" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Sections /></ProtectedRoute>} />
            <Route path="departments" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Departments /></ProtectedRoute>} />

            {/* Student Info */}
            <Route path="students" element={<ProtectedRoute allowedRoles={[...ACADEMIC_ROLES, 'parent', 'student']}><Students /></ProtectedRoute>} />
            <Route path="students/admission" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><StudentAdmission /></ProtectedRoute>} />
            <Route path="students/disabled" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><DisabledStudents /></ProtectedRoute>} />
            <Route path="students/bulk-delete" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><BulkDeleteStudents /></ProtectedRoute>} />
            <Route path="students/categories" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><StudentCategories /></ProtectedRoute>} />
            <Route path="alumni" element={<ProtectedRoute allowedRoles={ALL_ROLES}><Alumni /></ProtectedRoute>} />

            {/* HR - Admin Only */}
            <Route path="teachers" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Teachers /></ProtectedRoute>} />
            <Route path="staff-attendance" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><StaffAttendance /></ProtectedRoute>} />
            <Route path="payroll" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Payroll /></ProtectedRoute>} />
            <Route path="leaves" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Leaves /></ProtectedRoute>} />

            {/* Finance - Admin & Cashier */}
            <Route path="fees" element={<ProtectedRoute allowedRoles={[...FINANCE_ROLES, 'student', 'parent']}><Fees /></ProtectedRoute>} />
            <Route path="fees/search" element={<ProtectedRoute allowedRoles={FINANCE_ROLES}><Navigate to="/fees" replace /></ProtectedRoute>} />
            <Route path="fees/due" element={<ProtectedRoute allowedRoles={FINANCE_ROLES}><DueFees /></ProtectedRoute>} />
            <Route path="fees/master" element={<ProtectedRoute allowedRoles={FINANCE_ROLES}><FeesMaster /></ProtectedRoute>} />
            <Route path="incomes" element={<ProtectedRoute allowedRoles={FINANCE_ROLES}><Incomes /></ProtectedRoute>} />
            <Route path="expenses" element={<ProtectedRoute allowedRoles={FINANCE_ROLES}><Expenses /></ProtectedRoute>} />

            {/* Attendance */}
            <Route path="attendance" element={<ProtectedRoute allowedRoles={[...ACADEMIC_ROLES, 'student', 'parent']}><Attendance /></ProtectedRoute>} />
            <Route path="attendance/date" element={<ProtectedRoute allowedRoles={ACADEMIC_ROLES}><Navigate to="/attendance" replace /></ProtectedRoute>} />
            <Route path="attendance/approve" element={<ProtectedRoute allowedRoles={ACADEMIC_ROLES}><Navigate to="/leaves" replace /></ProtectedRoute>} />

            {/* Examinations */}
            <Route path="exams" element={<ProtectedRoute allowedRoles={[...ACADEMIC_ROLES, 'student']}><Exams /></ProtectedRoute>} />
            <Route path="exams/schedule" element={<ProtectedRoute allowedRoles={[...ACADEMIC_ROLES, 'student', 'parent']}><ExamSchedule /></ProtectedRoute>} />
            <Route path="exams/admit-card" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdmitCardDesign /></ProtectedRoute>} />
            <Route path="results" element={<ProtectedRoute allowedRoles={[...ACADEMIC_ROLES, 'student', 'parent']}><Results /></ProtectedRoute>} />
            <Route path="grades" element={<ProtectedRoute allowedRoles={ACADEMIC_ROLES}><Grades /></ProtectedRoute>} />
            <Route path="transcript" element={<ProtectedRoute allowedRoles={[...ACADEMIC_ROLES, 'student']}><StudentTranscript /></ProtectedRoute>} />
            <Route path="online-exam" element={<ProtectedRoute allowedRoles={[...ACADEMIC_ROLES, 'student']}><OnlineExam /></ProtectedRoute>} />

            {/* Communicate */}
            <Route path="email" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><ComposeMessage /></ProtectedRoute>} />

            {/* Library */}
            <Route path="library" element={<ProtectedRoute allowedRoles={ALL_ROLES}><Library /></ProtectedRoute>} />
            <Route path="library/issue" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><LibraryIssue /></ProtectedRoute>} />

            {/* Inventory */}
            <Route path="inventory" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><Inventory /></ProtectedRoute>} />
            <Route path="inventory/add" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><Inventory /></ProtectedRoute>} />
            <Route path="inventory/issue" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><InventoryIssue /></ProtectedRoute>} />

            {/* Transport & Hostel */}
            <Route path="transport" element={<ProtectedRoute allowedRoles={ALL_ROLES}><Transport /></ProtectedRoute>} />
            <Route path="transport/assign" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><TransportAssign /></ProtectedRoute>} />
            <Route path="hostel" element={<ProtectedRoute allowedRoles={ALL_ROLES}><Hostel /></ProtectedRoute>} />
            <Route path="hostel/room-type" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Navigate to="/hostel" replace /></ProtectedRoute>} />

            {/* Certificate */}
            <Route path="id-cards" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><IdCards /></ProtectedRoute>} />
            <Route path="certificates" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Certificates /></ProtectedRoute>} />

            {/* Reports & Logs */}
            <Route path="reports" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Reports /></ProtectedRoute>} />
            <Route path="reports/logs" element={<ProtectedRoute allowedRoles={['system_admin']}><UserLogs /></ProtectedRoute>} />
            <Route path="reports/audit" element={<ProtectedRoute allowedRoles={['system_admin']}><AuditTrail /></ProtectedRoute>} />

            {/* Settings */}
            <Route path="settings" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Settings /></ProtectedRoute>} />
            <Route path="features" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Features /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      ) : <Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <GlobalProvider>
        <AppRoutes />
        <Toaster position="bottom-right" />
      </GlobalProvider>
    </Router>
  );
}

export default App;
