import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, GraduationCap, FileText, DollarSign, Menu, X,
  ClipboardCheck, BookOpen, Building2, Library, BedDouble, Bus, CalendarDays, StickyNote, Award, Search,
  Sparkles, Settings, ChevronLeft, Badge, TrendingUp, TrendingDown, FilePieChart, LogOut, User, ChevronRight,
  ChevronDown, Briefcase, Layers, BarChart3, Shield, Box, Truck, Home, MessageSquare, ScrollText, Book,
  Globe, Moon, Sun, Calendar, ClipboardList, DownloadCloud, Monitor, Video, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobal } from '../context/GlobalContext';
import Logo from './ui/Logo';
import NotificationBell from './ui/NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  title: string;
  translationKey?: string;
  icon: React.ElementType;
  path?: string;
  children?: { title: string; path: string; icon?: React.ElementType }[];
}

const superAdminNavStructure: NavItem[] = [
  { title: 'Overview', icon: LayoutDashboard, path: '/super-admin' },
  { title: 'Schools', icon: Building2, path: '/schools' },
  { title: 'System Logs', icon: Shield, path: '/reports/logs' },
  { title: 'Settings', icon: Settings, path: '/settings' },
];

const adminNavStructure: NavItem[] = [
  { 
    title: 'Dashboard',
    translationKey: 'dashboard',
    icon: LayoutDashboard, 
    path: '/' 
  },
  {
    title: 'Front Office',
    icon: ClipboardList,
    path: '/front-office'
  },
  {
    title: 'Student Information',
    translationKey: 'studentInfo',
    icon: GraduationCap,
    children: [
      { title: 'Student Details', path: '/students' },
      { title: 'Student Admission', path: '/students/admission' },
      { title: 'Disabled Students', path: '/students/disabled' },
      { title: 'Bulk Delete', path: '/students/bulk-delete' },
      { title: 'Student Categories', path: '/students/categories' },
    ]
  },
  {
    title: 'Academics',
    translationKey: 'academics',
    icon: BookOpen,
    children: [
      { title: 'Class Timetable', path: '/timetable' },
      { title: 'Teachers Timetable', path: '/teachers-timetable' },
      { title: 'Assign Class Teacher', path: '/assign-teacher' },
      { title: 'Promote Students', path: '/promote-students' },
      { title: 'Subject Group', path: '/subject-groups' },
      { title: 'Subjects', path: '/courses' },
      { title: 'Class', path: '/classes' },
      { title: 'Sections', path: '/sections' },
    ]
  },
  {
    title: 'Live Classes',
    icon: Video,
    path: '/live-classes'
  },
  {
    title: 'Lesson Plan',
    icon: CalendarDays,
    path: '/lesson-plan'
  },
  {
    title: 'Homework',
    icon: Book,
    path: '/homework'
  },
  {
    title: 'Download Center',
    icon: DownloadCloud,
    path: '/download-center'
  },
  {
    title: 'Human Resource',
    translationKey: 'hr',
    icon: Users,
    children: [
      { title: 'Staff Directory', path: '/teachers' },
      { title: 'Staff Attendance', path: '/staff-attendance' },
      { title: 'Payroll', path: '/payroll' },
      { title: 'Leaves', path: '/leaves' },
    ]
  },
  {
    title: 'Fees Collection',
    translationKey: 'fees',
    icon: DollarSign,
    children: [
      { title: 'Collect Fees', path: '/fees' },
      { title: 'Search Fees Payment', path: '/fees/search' },
      { title: 'Search Due Fees', path: '/fees/due' },
      { title: 'Fees Master', path: '/fees/master' },
    ]
  },
  {
    title: 'Income & Expenses',
    translationKey: 'finance',
    icon: TrendingUp,
    children: [
      { title: 'Income', path: '/incomes' },
      { title: 'Add Income', path: '/incomes?action=add' },
      { title: 'Expense', path: '/expenses' },
      { title: 'Add Expense', path: '/expenses?action=add' },
    ]
  },
  {
    title: 'Attendance',
    translationKey: 'attendance',
    icon: ClipboardCheck,
    children: [
      { title: 'Student Attendance', path: '/attendance' },
      { title: 'Attendance By Date', path: '/attendance/date' },
      { title: 'Approve Leave', path: '/attendance/approve' },
    ]
  },
  {
    title: 'Examinations',
    translationKey: 'exams',
    icon: FileText,
    children: [
      { title: 'Exam Group', path: '/exams' },
      { title: 'Exam Schedule', path: '/exams/schedule' },
      { title: 'Exam Result', path: '/results' },
      { title: 'Transcript', path: '/transcript' },
      { title: 'Design Admit Card', path: '/exams/admit-card' },
      { title: 'Print Result', path: '/results' },
    ]
  },
  {
    title: 'Online Examinations',
    icon: Monitor,
    path: '/online-exam'
  },
  {
    title: 'Communicate',
    translationKey: 'communicate',
    icon: MessageSquare,
    children: [
      { title: 'Notice Board', path: '/noticeboard' },
      { title: 'Send Email', path: '/email' },
      { title: 'Events', path: '/events' },
    ]
  },
  {
    title: 'Library',
    translationKey: 'library',
    icon: Library,
    children: [
      { title: 'Book List', path: '/library' },
      { title: 'Add Book', path: '/library?action=add' },
      { title: 'Issue Return', path: '/library/issue' },
    ]
  },
  {
    title: 'Inventory',
    translationKey: 'inventory',
    icon: Box,
    children: [
      { title: 'Item Stock', path: '/inventory' },
      { title: 'Add Item', path: '/inventory/add' },
      { title: 'Issue Item', path: '/inventory/issue' },
    ]
  },
  {
    title: 'Transport',
    translationKey: 'transport',
    icon: Bus,
    children: [
      { title: 'Routes', path: '/transport' },
      { title: 'Vehicles', path: '/transport' },
      { title: 'Assign Vehicle', path: '/transport/assign' },
    ]
  },
  {
    title: 'Hostel',
    translationKey: 'hostel',
    icon: BedDouble,
    children: [
      { title: 'Hostel Rooms', path: '/hostel' },
      { title: 'Room Type', path: '/hostel/room-type' },
    ]
  },
  {
    title: 'Certificate',
    icon: Badge,
    children: [
      { title: 'Student ID Card', path: '/id-cards' },
      { title: 'Generate Certificate', path: '/certificates' },
    ]
  },
  {
    title: 'Alumni',
    icon: GraduationCap,
    path: '/alumni'
  },
  {
    title: 'Reports',
    translationKey: 'reports',
    icon: FilePieChart,
    children: [
      { title: 'Student Information', path: '/reports' },
      { title: 'Finance', path: '/reports' },
      { title: 'Attendance', path: '/reports' },
      { title: 'Examinations', path: '/reports' },
      { title: 'Human Resource', path: '/reports' },
      { title: 'Library', path: '/reports' },
      { title: 'Inventory', path: '/reports' },
      { title: 'Transport', path: '/reports' },
      { title: 'User Log', path: '/reports/logs' },
      { title: 'Audit Trail Report', path: '/reports/audit' },
    ]
  },
  {
    title: 'System Settings',
    translationKey: 'settings',
    icon: Settings,
    children: [
      { title: 'General Settings', path: '/settings' },
      { title: 'Session Settings', path: '/settings' },
      { title: 'Features', path: '/features' },
      { title: 'Departments', path: '/departments' },
    ]
  }
];

// Simplified menus for other roles
const teacherNavStructure: NavItem[] = [
  { title: 'Dashboard', translationKey: 'dashboard', icon: LayoutDashboard, path: '/' },
  { title: 'Students', translationKey: 'studentInfo', icon: GraduationCap, path: '/students' },
  { title: 'My Classes', icon: Library, path: '/classes' },
  { title: 'Live Classes', icon: Video, path: '/live-classes' },
  { title: 'Lesson Plan', icon: CalendarDays, path: '/lesson-plan' },
  { title: 'Homework', icon: Book, path: '/homework' },
  { title: 'Download Center', icon: DownloadCloud, path: '/download-center' },
  { title: 'Attendance', translationKey: 'attendance', icon: ClipboardCheck, path: '/attendance' },
  { title: 'Examinations', translationKey: 'exams', icon: FileText, children: [
      { title: 'Exams', path: '/exams' },
      { title: 'Exam Schedule', path: '/exams/schedule' },
      { title: 'Enter Marks', path: '/grades' },
      { title: 'Results', path: '/results' },
  ]},
  { title: 'Communicate', translationKey: 'communicate', icon: MessageSquare, children: [
      { title: 'Notice Board', path: '/noticeboard' },
      { title: 'Events', path: '/events' },
  ]},
];

const studentNavStructure: NavItem[] = [
  { title: 'Dashboard', translationKey: 'dashboard', icon: LayoutDashboard, path: '/' },
  { title: 'My Profile', translationKey: 'profile', icon: User, path: '/students' },
  { title: 'Homework', icon: Book, path: '/homework' },
  { title: 'Download Center', icon: DownloadCloud, path: '/download-center' },
  { title: 'Live Classes', icon: Video, path: '/live-classes' },
  { title: 'Academics', translationKey: 'academics', icon: BookOpen, children: [
      { title: 'Class Timetable', path: '/timetable' },
      { title: 'Subjects', path: '/courses' },
  ]},
  { title: 'Examinations', translationKey: 'exams', icon: Award, children: [
      { title: 'Exam Schedule', path: '/exams/schedule' },
      { title: 'Exam Result', path: '/results' },
      { title: 'Transcript', path: '/transcript' },
      { title: 'Online Exams', path: '/online-exam' },
  ]},
  { title: 'Attendance', translationKey: 'attendance', icon: ClipboardCheck, path: '/attendance' },
  { title: 'Fees', translationKey: 'fees', icon: DollarSign, path: '/fees' },
  { title: 'Communicate', translationKey: 'communicate', icon: MessageSquare, children: [
      { title: 'Notice Board', path: '/noticeboard' },
      { title: 'Events', path: '/events' },
  ]},
];

const cashierNavStructure: NavItem[] = [
  { title: 'Dashboard', translationKey: 'dashboard', icon: LayoutDashboard, path: '/' },
  {
    title: 'Fees Collection',
    translationKey: 'fees',
    icon: DollarSign,
    children: [
      { title: 'Collect Fees', path: '/fees' },
      { title: 'Search Fees Payment', path: '/fees/search' },
      { title: 'Search Due Fees', path: '/fees/due' },
      { title: 'Fees Master', path: '/fees/master' },
    ]
  },
  {
    title: 'Income & Expenses',
    translationKey: 'finance',
    icon: TrendingUp,
    children: [
      { title: 'Income', path: '/incomes' },
      { title: 'Add Income', path: '/incomes?action=add' },
      { title: 'Expense', path: '/expenses' },
      { title: 'Add Expense', path: '/expenses?action=add' },
    ]
  },
  { title: 'Reports', translationKey: 'reports', icon: FilePieChart, path: '/reports' },
];

const parentNavStructure: NavItem[] = [
  { title: 'Dashboard', translationKey: 'dashboard', icon: LayoutDashboard, path: '/' },
  { title: 'My Children', icon: Users, path: '/students' },
  { title: 'Fees', translationKey: 'fees', icon: DollarSign, path: '/fees' },
  { title: 'Homework', icon: Book, path: '/homework' },
  { title: 'Attendance', translationKey: 'attendance', icon: ClipboardCheck, path: '/attendance' },
  { title: 'Examinations', translationKey: 'exams', icon: Award, children: [
      { title: 'Exam Schedule', path: '/exams/schedule' },
      { title: 'Exam Result', path: '/results' },
  ]},
  { title: 'Notice Board', translationKey: 'communicate', icon: MessageSquare, path: '/noticeboard' },
];

const getNavItemsForRole = (role: 'admin' | 'teacher' | 'student' | 'cashier' | 'principal' | 'parent' | 'system_admin' | null) => {
  switch (role) {
    case 'system_admin': return superAdminNavStructure;
    case 'teacher': return teacherNavStructure;
    case 'student': return studentNavStructure;
    case 'cashier': return cashierNavStructure;
    case 'parent': return parentNavStructure;
    case 'principal': return adminNavStructure; // Principal sees same as Admin
    case 'admin': default: return adminNavStructure;
  }
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  
  const { 
    user, signOut, profile, schoolName, schoolLogo,
    language, setLanguage, theme, toggleTheme, t,
    selectedSession, setSelectedSession, academicYear 
  } = useGlobal();
  
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cast role to any to support new roles
  const navItems = getNavItemsForRole((profile?.role as any) || null);
  const userRoleDisplay = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace('_', ' ') : 'User';
  const userName = profile?.name || user?.email;

  // Automatically expand the menu that contains the current route
  useEffect(() => {
    const currentPath = location.pathname;
    
    navItems.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child => {
            const childPath = child.path.split('?')[0];
            return childPath === currentPath;
        });

        if (isChildActive) {
          setExpandedMenus(prev => {
            if (!prev.includes(item.title)) {
              return [...prev, item.title];
            }
            return prev;
          });
        }
      }
    });
  }, [location.pathname, navItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleSubMenu = (title: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setExpandedMenus(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { path, label };
  });

  // Generate session years (e.g., 2023-2024, 2024-2025, 2025-2026)
  const currentYear = new Date().getFullYear();
  const sessions = [
    `${currentYear-1}-${currentYear}`,
    `${currentYear}-${currentYear+1}`,
    `${currentYear+1}-${currentYear+2}`
  ];
  // Ensure current academic year is in the list if not already
  if (!sessions.includes(academicYear)) sessions.push(academicYear);

  const SidebarContent = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <div className="flex flex-col h-full bg-[#1e1e2d] text-[#a6a6a6] border-r border-slate-800 dark:border-slate-700">
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} border-b border-slate-700 bg-[#1a1a27]`}>
        {schoolLogo ? (
            <img src={schoolLogo} alt="Logo" className="h-8 w-8 object-contain rounded-md bg-white/10 p-0.5" />
        ) : (
            <Logo className="!text-white" />
        )}
        {!isCollapsed && <span className="ml-3 text-lg font-bold text-white truncate">{profile?.role === 'system_admin' ? 'System Admin' : schoolName}</span>}
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {navItems.map((item) => {
          const isActive = item.path === location.pathname || item.children?.some(c => c.path.split('?')[0] === location.pathname);
          const isExpanded = expandedMenus.includes(item.title);
          const displayName = item.translationKey ? t(item.translationKey as any) : item.title;
          
          return (
            <div key={item.title} className="mb-1">
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleSubMenu(item.title)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 
                      ${isActive ? 'text-white bg-slate-800' : 'hover:text-white hover:bg-slate-800'}
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? displayName : undefined}
                  >
                    <div className="flex items-center">
                      <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-orange-500' : ''}`} />
                      {!isCollapsed && <span className="ml-3">{displayName}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && !isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 ml-2 pl-3 border-l border-slate-700 space-y-1">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.title}
                              to={child.path}
                              onClick={() => sidebarOpen && setSidebarOpen(false)}
                              className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200 group
                                ${isActive 
                                  ? 'text-orange-500 bg-slate-800/50 font-medium' 
                                  : 'text-[#a6a6a6] hover:text-white hover:bg-slate-800/30'
                                }`
                              }
                            >
                              <span className="flex items-center">
                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${location.pathname === child.path.split('?')[0] ? 'bg-orange-500' : 'bg-slate-600 group-hover:bg-white'}`}></span>
                                {child.title}
                              </span>
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <NavLink
                  to={item.path!}
                  onClick={() => sidebarOpen && setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-200
                    ${isActive 
                      ? 'text-white bg-orange-600 shadow-md' 
                      : 'hover:text-white hover:bg-slate-800'
                    } ${isCollapsed ? 'justify-center' : ''}`
                  }
                  title={isCollapsed ? displayName : undefined}
                >
                  <item.icon className={`h-5 w-5 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>{displayName}</span>}
                </NavLink>
              )}
            </div>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-700 bg-[#1a1a27]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden lg:flex items-center w-full py-2 text-sm font-medium rounded-md transition-colors text-slate-400 hover:text-white hover:bg-slate-800 ${
            isCollapsed ? 'justify-center' : 'px-2'
          }`}
        >
          <ChevronLeft className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          {!isCollapsed && <span className="ml-3">Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 transition-colors duration-200`}>
      <header className={`bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 fixed top-0 right-0 h-16 z-30 flex items-center shadow-sm transition-all duration-300 ease-in-out left-0 ${isCollapsed ? 'lg:left-20' : 'lg:left-64'}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 focus:outline-none"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center text-sm text-slate-500 dark:text-slate-400">
              <NavLink to="/" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Home</NavLink>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  <ChevronRight size={14} className="mx-2 text-slate-400" />
                  <NavLink 
                    to={crumb.path} 
                    className={`${index === breadcrumbs.length - 1 ? 'font-semibold text-slate-900 dark:text-slate-100' : 'hover:text-slate-900 dark:hover:text-slate-200'} transition-colors`}
                  >
                    {crumb.label}
                  </NavLink>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Multi-System Controls */}
            <div className="hidden lg:flex items-center gap-2 mr-2">
                {/* Session Switcher */}
                <div className="relative group">
                    <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        <Calendar size={14} />
                        {selectedSession}
                    </button>
                    <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 hidden group-hover:block z-50">
                        {sessions.map(s => (
                            <button 
                                key={s} 
                                onClick={() => setSelectedSession(s)}
                                className={`block w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 ${selectedSession === s ? 'text-blue-600 font-bold' : 'text-slate-600 dark:text-slate-300'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Language Switcher */}
                <button 
                    onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    title="Switch Language"
                >
                    <Globe size={18} />
                    <span className="sr-only">Switch Language</span>
                </button>

                {/* Theme Switcher */}
                <button 
                    onClick={toggleTheme}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    title="Toggle Theme"
                >
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

            <NotificationBell />
            
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-3 p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600">
                <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold overflow-hidden ring-2 ring-white dark:ring-slate-700 shadow-sm">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    userName?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">{userName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{userRoleDisplay}</div>
                </div>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{userName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <NavLink to={profile?.role === 'student' ? '/students' : '/teachers'} className="flex items-center w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <User className="mr-2.5 h-4 w-4 text-slate-400" />
                        {t('profile')}
                      </NavLink>
                      <NavLink to="/settings" className="flex items-center w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <Settings className="mr-2.5 h-4 w-4 text-slate-400" />
                        {t('settings')}
                      </NavLink>
                      
                      {/* Mobile Controls */}
                      <div className="lg:hidden border-t border-slate-100 dark:border-slate-700 my-1 pt-1">
                         <button onClick={() => setLanguage(language === 'en' ? 'am' : 'en')} className="flex items-center w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                            <Globe className="mr-2.5 h-4 w-4 text-slate-400" /> {t('language')}: {language.toUpperCase()}
                         </button>
                         <button onClick={toggleTheme} className="flex items-center w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                            {theme === 'light' ? <Moon className="mr-2.5 h-4 w-4 text-slate-400" /> : <Sun className="mr-2.5 h-4 w-4 text-slate-400" />} 
                            {theme === 'light' ? t('darkMode') : t('lightMode')}
                         </button>
                      </div>

                      <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-3 py-2 text-sm text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                      >
                        <LogOut className="mr-2.5 h-4 w-4" />
                        {t('signOut')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <aside
        className={`fixed top-0 left-0 z-40 h-full transition-all duration-300 ease-in-out transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} lg:translate-x-0`}
      >
        <SidebarContent isCollapsed={isCollapsed} />
      </aside>

      <main className={`pt-20 pb-8 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div className="px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
