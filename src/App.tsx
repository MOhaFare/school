import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
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
import { Toaster } from 'react-hot-toast';
import { Loader } from 'lucide-react';

const AppRoutes: React.FC = () => {
  const { session, loading, profile } = useGlobal();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-secondary">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (session && profile?.role === 'system_admin' && window.location.pathname === '/') {
    return <Navigate to="/super-admin" />;
  }

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      <Route path="/forgot-password" element={!session ? <ForgotPassword /> : <Navigate to="/" />} />

      <Route path="/*" element={session ? (
        <Layout>
          <Routes>
            <Route index element={<Dashboard />} />
            
            {profile?.role === 'system_admin' && (
              <>
                <Route path="super-admin" element={<SuperAdminDashboard />} />
                <Route path="schools" element={<Schools />} />
              </>
            )}

            <Route path="front-office" element={<FrontOffice />} />
            <Route path="download-center" element={<DownloadCenter />} />
            <Route path="alumni" element={<Alumni />} />
            <Route path="live-classes" element={<LiveClasses />} />

            {/* Academics */}
            <Route path="timetable" element={<Timetable />} />
            <Route path="teachers-timetable" element={<Timetable />} />
            <Route path="assign-teacher" element={<AssignTeacher />} />
            <Route path="promote-students" element={<PromoteStudents />} />
            <Route path="subject-groups" element={<SubjectGroups />} />
            <Route path="courses" element={<Courses />} />
            <Route path="classes" element={<Classes />} />
            <Route path="sections" element={<Sections />} />
            <Route path="lesson-plan" element={<LessonPlan />} />

            {/* Homework */}
            <Route path="homework" element={<Homework />} />

            {/* Student Info */}
            <Route path="students" element={<Students />} />
            <Route path="students/admission" element={<StudentAdmission />} />
            <Route path="students/disabled" element={<DisabledStudents />} />
            <Route path="students/bulk-delete" element={<BulkDeleteStudents />} />
            <Route path="students/categories" element={<StudentCategories />} />

            {/* HR */}
            <Route path="teachers" element={<Teachers />} />
            <Route path="staff-attendance" element={<StaffAttendance />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="leaves" element={<Leaves />} />

            {/* Fees */}
            <Route path="fees" element={<Fees />} />
            <Route path="fees/search" element={<Navigate to="/fees" replace />} />
            <Route path="fees/due" element={<DueFees />} />
            <Route path="fees/master" element={<FeesMaster />} />

            {/* Income/Expenses */}
            <Route path="incomes" element={<Incomes />} />
            <Route path="expenses" element={<Expenses />} />

            {/* Attendance */}
            <Route path="attendance" element={<Attendance />} />
            <Route path="attendance/date" element={<Navigate to="/attendance" replace />} />
            <Route path="attendance/approve" element={<Navigate to="/leaves" replace />} />

            {/* Examinations */}
            <Route path="exams" element={<Exams />} />
            <Route path="exams/schedule" element={<ExamSchedule />} />
            <Route path="exams/admit-card" element={<AdmitCardDesign />} />
            <Route path="results" element={<Results />} />
            <Route path="grades" element={<Grades />} />
            <Route path="transcript" element={<StudentTranscript />} />
            <Route path="online-exam" element={<OnlineExam />} />

            {/* Communicate */}
            <Route path="noticeboard" element={<Noticeboard />} />
            <Route path="email" element={<ComposeMessage />} />
            <Route path="events" element={<Events />} />

            {/* Library */}
            <Route path="library" element={<Library />} />
            <Route path="library/issue" element={<LibraryIssue />} />

            {/* Inventory */}
            <Route path="inventory" element={<Inventory />} />
            <Route path="inventory/add" element={<Inventory />} />
            <Route path="inventory/issue" element={<InventoryIssue />} />

            {/* Transport */}
            <Route path="transport" element={<Transport />} />
            <Route path="transport/assign" element={<TransportAssign />} />

            {/* Hostel */}
            <Route path="hostel" element={<Hostel />} />
            <Route path="hostel/room-type" element={<Navigate to="/hostel" replace />} />

            {/* Certificate */}
            <Route path="id-cards" element={<IdCards />} />
            <Route path="certificates" element={<Certificates />} />

            {/* Reports */}
            <Route path="reports" element={<Reports />} />
            <Route path="reports/logs" element={<UserLogs />} />
            <Route path="reports/audit" element={<AuditTrail />} />

            {/* Settings */}
            <Route path="settings" element={<Settings />} />
            <Route path="features" element={<Features />} />
            <Route path="departments" element={<Departments />} />

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
