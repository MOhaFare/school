import React, { useState } from 'react';
import { 
  FilePieChart, Users, DollarSign, ClipboardCheck, 
  FileText, BookOpen, Box, Bus, LayoutDashboard, Download, Loader
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from '../context/GlobalContext';
import { exportToExcel, exportMultipleSheetsToExcel } from '../utils/exportUtils';

// Report Components
import OverviewReport from '../components/reports/OverviewReport';
import StudentReport from '../components/reports/StudentReport';
import FinanceReport from '../components/reports/FinanceReport';
import AttendanceReport from '../components/reports/AttendanceReport';
import ExamReport from '../components/reports/ExamReport';
import HRReport from '../components/reports/HRReport';
import LibraryReport from '../components/reports/LibraryReport';
import InventoryReport from '../components/reports/InventoryReport';
import TransportReport from '../components/reports/TransportReport';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'exams', label: 'Examinations', icon: FileText },
  { id: 'hr', label: 'Human Resource', icon: Users },
  { id: 'library', label: 'Library', icon: BookOpen },
  { id: 'inventory', label: 'Inventory', icon: Box },
  { id: 'transport', label: 'Transport', icon: Bus },
];

const Reports: React.FC = () => {
  const { profile, schoolName } = useGlobal();
  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!profile?.school_id) return;
    setExporting(true);
    const toastId = toast.loading('Generating report...');

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const schoolId = profile.school_id;

      switch (activeTab) {
        case 'students': {
          const { data } = await supabase
            .from('students')
            .select('name, roll_number, class, section, gender, dob, phone, email, parent_name, parent_phone, status')
            .eq('school_id', schoolId)
            .order('class')
            .order('name');
          
          if (data) exportToExcel(data, `${schoolName}_Students_${timestamp}`, 'Students');
          break;
        }

        case 'hr': {
          const { data } = await supabase
            .from('teachers')
            .select('name, email, phone, subject, join_date, salary, status')
            .eq('school_id', schoolId)
            .order('name');
          
          if (data) exportToExcel(data, `${schoolName}_Staff_${timestamp}`, 'Staff');
          break;
        }

        case 'finance': {
          const [fees, incomes, expenses, payroll] = await Promise.all([
            supabase.from('fees').select('description, amount, status, due_date, payment_date, payment_mode').eq('school_id', schoolId),
            supabase.from('incomes').select('title, category, amount, date, description').eq('school_id', schoolId),
            supabase.from('expenses').select('title, category, amount, date, description').eq('school_id', schoolId),
            supabase.from('payrolls').select('month, year, base_salary, bonus, deductions, net_salary, status, paid_date').eq('school_id', schoolId)
          ]);

          exportMultipleSheetsToExcel([
            { data: fees.data || [], sheetName: 'Fees' },
            { data: incomes.data || [], sheetName: 'Incomes' },
            { data: expenses.data || [], sheetName: 'Expenses' },
            { data: payroll.data || [], sheetName: 'Payroll' },
          ], `${schoolName}_Finance_${timestamp}`);
          break;
        }

        case 'attendance': {
          // Exporting last 30 days of attendance to keep it manageable
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const { data } = await supabase
            .from('attendance')
            .select('date, status, class, session, students(name, roll_number)')
            .eq('school_id', schoolId)
            .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
            .order('date', { ascending: false });

          const formattedData = data?.map((r: any) => ({
            Date: r.date,
            Student: r.students?.name,
            RollNo: r.students?.roll_number,
            Class: r.class,
            Session: r.session,
            Status: r.status
          })) || [];

          exportToExcel(formattedData, `${schoolName}_Attendance_${timestamp}`, 'Attendance');
          break;
        }

        case 'exams': {
          const { data } = await supabase
            .from('grades')
            .select('marks_obtained, grade, gpa, date, students(name, class), exams(name, subject, total_marks)')
            .eq('school_id', schoolId)
            .order('date', { ascending: false });

          const formattedData = data?.map((g: any) => ({
            Date: g.date,
            Exam: g.exams?.name,
            Subject: g.exams?.subject,
            Student: g.students?.name,
            Class: g.students?.class,
            Marks: `${g.marks_obtained} / ${g.exams?.total_marks}`,
            Grade: g.grade,
            GPA: g.gpa
          })) || [];

          exportToExcel(formattedData, `${schoolName}_ExamResults_${timestamp}`, 'Results');
          break;
        }

        case 'library': {
          const { data } = await supabase
            .from('library_books')
            .select('title, author, isbn, genre, quantity, available, status')
            .eq('school_id', schoolId)
            .order('title');
          
          if (data) exportToExcel(data, `${schoolName}_Library_${timestamp}`, 'Books');
          break;
        }

        case 'inventory': {
          const { data } = await supabase
            .from('inventory_items')
            .select('name, category, quantity, unit_price, supplier, purchase_date')
            .eq('school_id', schoolId)
            .order('name');
          
          if (data) exportToExcel(data, `${schoolName}_Inventory_${timestamp}`, 'Inventory');
          break;
        }

        case 'transport': {
          const { data } = await supabase
            .from('transport_vehicles')
            .select('vehicle_number, driver_name, route, capacity, student_count')
            .eq('school_id', schoolId);
          
          if (data) exportToExcel(data, `${schoolName}_Transport_${timestamp}`, 'Vehicles');
          break;
        }

        case 'overview': {
           // For overview, we might export a summary of counts
           const [students, teachers, classes] = await Promise.all([
             supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
             supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
             supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
           ]);
           
           const summaryData = [
             { Metric: 'Total Students', Value: students.count },
             { Metric: 'Total Teachers', Value: teachers.count },
             { Metric: 'Total Classes', Value: classes.count },
             { Metric: 'Report Date', Value: timestamp },
           ];
           
           exportToExcel(summaryData, `${schoolName}_Overview_${timestamp}`, 'Summary');
           break;
        }

        default:
          toast.error('Export not supported for this tab yet.');
      }
      
      toast.success('Report downloaded successfully!', { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(`Export failed: ${error.message}`, { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  // Render the active report component
  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewReport />;
      case 'students': return <StudentReport />;
      case 'finance': return <FinanceReport />;
      case 'attendance': return <AttendanceReport />;
      case 'exams': return <ExamReport />;
      case 'hr': return <HRReport />;
      case 'library': return <LibraryReport />;
      case 'inventory': return <InventoryReport />;
      case 'transport': return <TransportReport />;
      default: return <OverviewReport />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FilePieChart className="text-blue-600"/> Reports & Analytics
          </h1>
          <p className="text-slate-500 mt-1">Comprehensive insights into school performance.</p>
        </div>
        <Button onClick={handleExport} disabled={exporting} variant="secondary" className="border border-slate-200 shadow-sm">
          {exporting ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
          Export Excel
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
        <div className="flex overflow-x-auto pb-2 sm:pb-0 scrollbar-thin scrollbar-thumb-slate-200 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={16} className={`mr-2 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Content */}
      <div className="animate-in fade-in duration-300">
        {renderContent()}
      </div>
    </div>
  );
};

export default Reports;
