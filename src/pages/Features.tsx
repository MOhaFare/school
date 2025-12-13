import React from 'react';
import { 
  Sparkles, 
  GraduationCap, 
  Users, 
  HandHeart, 
  ClipboardCheck, 
  FileText, 
  CalendarClock, 
  Library, 
  Bus, 
  BedDouble, 
  Landmark, 
  CalendarDays, 
  FilePieChart 
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const featuresList: Omit<FeatureCardProps, 'color'>[] = [
  { icon: GraduationCap, title: 'Student Management', description: 'Manage student profiles, academic records, and personal information.' },
  { icon: Users, title: 'Teacher Management', description: 'Oversee teacher profiles, subjects, schedules, and contact details.' },
  { icon: HandHeart, title: 'Parent Management', description: 'Engage with parents, manage communication, and share progress.' },
  { icon: ClipboardCheck, title: 'Attendance', description: 'Track daily student attendance with easy-to-use registers and reports.' },
  { icon: FileText, title: 'Examination', description: 'Schedule exams, manage grades, and publish results seamlessly.' },
  { icon: CalendarClock, title: 'Timetable', description: 'Create and manage class schedules for students and teachers.' },
  { icon: Library, title: 'Library', description: 'Catalog books, manage borrowing, and track library inventory.' },
  { icon: Bus, title: 'Transport', description: 'Manage bus routes, vehicle details, and student transport assignments.' },
  { icon: BedDouble, title: 'Hostel', description: 'Oversee hostel rooms, occupancy, and resident information.' },
  { icon: Landmark, title: 'Accounting', description: 'Handle fees, payroll, incomes, and expenses with integrated financial tools.' },
  { icon: CalendarDays, title: 'Events', description: 'Organize and announce school events, holidays, and functions.' },
  { icon: FilePieChart, title: 'Reports', description: 'Generate insightful reports on academics, finance, and administration.' },
];

const colors = [
  'text-blue-500', 'text-green-500', 'text-purple-500', 'text-yellow-500', 
  'text-red-500', 'text-indigo-500', 'text-pink-500', 'text-sky-500',
  'text-emerald-500', 'text-rose-500', 'text-cyan-500', 'text-orange-500'
];

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-start hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
    <div className={`p-3 rounded-lg mb-4`} style={{ backgroundColor: `${color.replace('text-','bg-')}1A` }}>
      <Icon className={`h-8 w-8 ${color}`} />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 flex-grow">{description}</p>
  </div>
);

const Features: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-yellow-100 rounded-lg">
          <Sparkles className="h-8 w-8 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">System Features</h1>
          <p className="text-gray-600 mt-1">A comprehensive overview of the School Management System's capabilities.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {featuresList.map((feature, index) => (
          <FeatureCard 
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            color={colors[index % colors.length]}
          />
        ))}
      </div>
    </div>
  );
};

export default Features;
