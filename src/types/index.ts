export interface Teacher {
  id: string;
  created_at?: string;
  name: string;
  email: string;
  subject: string;
  phone: string;
  joinDate: string;
  issuedDate: string;
  expiryDate: string;
  dob: string;
  salary: number;
  status: 'active' | 'inactive';
  avatar?: string;
  user_id?: string | null;
  shift?: 'Morning' | 'Afternoon';
  school_id?: string;
  school_name?: string;
}

export interface Student {
  id: string;
  created_at?: string;
  name: string;
  email: string;
  class: string;
  section: string;
  rollNumber: string;
  phone: string;
  enrollmentDate: string;
  issuedDate: string;
  expiryDate: string;
  dob: string;
  status: 'active' | 'inactive' | 'alumni' | 'suspended';
  avatar?: string;
  grade: string;
  user_id?: string | null;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  student_role?: string;
  shift?: 'Morning' | 'Afternoon';
  school_id?: string;
  school_name?: string;
  student_house?: string;
  category_id?: string;
}

export interface School {
  id: string;
  created_at?: string;
  name: string;
  address: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  subscription_plan: 'basic' | 'pro' | 'enterprise';
  is_active: boolean;
  features?: string[];
}

export interface Exam {
  id: string;
  created_at?: string;
  name: string;
  subject: string;
  class: string;
  section?: string; // Added section
  date: string;
  totalMarks: number;
  passingMarks: number;
  duration: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  school_id?: string;
  semester?: string;
}

export interface Grade {
  id: string;
  created_at?: string;
  student_id: string;
  studentName: string;
  exam_id: string;
  examName: string;
  subject: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  gpa: number;
  date: string;
  school_id?: string;
  semester?: string;
}

export interface Payroll {
  id: string;
  created_at?: string;
  teacherId: string;
  teacherName: string;
  month: string;
  year: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: 'paid' | 'pending' | 'processing';
  paidDate?: string;
  school_id?: string;
}

export interface SchoolClass {
  id: string;
  created_at?: string;
  name: string;
  teacher: {
    id: string;
    name: string;
  };
  studentCount: number;
  averageGpa: number;
  subjects: string[];
  capacity: number;
  school_id?: string;
}

export interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
}

export interface EnrollmentData {
  grade: string;
  students: number;
}

export interface Course {
  id: string;
  created_at?: string;
  name: string;
  code: string;
  teacherId: string;
  teacherName: string;
  credits: number;
  departmentId: string;
  departmentName: string;
  school_id?: string;
}

export interface Department {
  id: string;
  created_at?: string;
  name: string;
  headOfDepartmentId: string;
  headOfDepartmentName: string;
  description: string;
  courseCount: number;
  school_id?: string;
}

export interface LibraryBook {
  id: string;
  created_at?: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  quantity: number;
  available: number;
  status: 'available' | 'unavailable';
  school_id?: string;
}

export interface Fee {
  id: string;
  created_at?: string;
  student_id: string;
  studentName: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'unpaid' | 'overdue';
  payment_date?: string;
  description: string;
  month?: string;
  school_id?: string;
}

export interface Event {
  id: string;
  created_at?: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: 'academic' | 'sports' | 'cultural' | 'other';
  school_id?: string;
}

export interface AttendanceRecord {
  id: string;
  created_at?: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  class: string;
  session: 'Morning' | 'Afternoon';
  school_id?: string;
}

export interface HostelRoom {
  id: string;
  created_at?: string;
  roomNumber: string;
  building: string;
  capacity: number;
  occupants: string[];
  status: 'available' | 'full' | 'maintenance';
  school_id?: string;
}

export interface TransportVehicle {
  id: string;
  created_at?: string;
  vehicleNumber: string;
  driverName: string;
  route: string;
  capacity: number;
  studentCount: number;
  school_id?: string;
}

export interface Notice {
  id: string;
  created_at?: string;
  title: string;
  content: string;
  authorName: string;
  date: string;
  audience: 'all' | 'students' | 'teachers';
  school_id?: string;
}

export interface Expense {
  id: string;
  created_at?: string;
  title: string;
  category: 'salaries' | 'utilities' | 'maintenance' | 'supplies' | 'technology' | 'other';
  amount: number;
  date: string;
  description: string;
  school_id?: string;
}

export interface Income {
  id: string;
  created_at?: string;
  title: string;
  category: 'donations' | 'grants' | 'rentals' | 'fundraising' | 'other';
  amount: number;
  date: string;
  description: string;
  school_id?: string;
}

export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  type: 'grade' | 'fee' | 'event' | 'notice' | 'system';
  link_to?: string;
}

export interface Homework {
  id: string;
  created_at?: string;
  class: string;
  subject: string;
  teacher_id: string;
  teacher_name?: string;
  title: string;
  description: string;
  due_date: string;
  status: 'active' | 'archived';
  school_id?: string;
}
