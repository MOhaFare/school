import React, { useState, useEffect } from 'react';
import { 
  FilePieChart, Users, DollarSign, ClipboardCheck, 
  FileText, BookOpen, Box, Bus, LayoutDashboard 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/ui/Skeleton';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

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
