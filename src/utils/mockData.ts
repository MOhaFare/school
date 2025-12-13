import { faker } from '@faker-js/faker';
import { Teacher, Student, Exam, Grade, Payroll, SchoolClass, RecentActivity, EnrollmentData, Department, Course, LibraryBook, Fee, Event, AttendanceRecord, HostelRoom, TransportVehicle, Notice, Expense, Income } from '../types';

const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science'];
const classes = ['9', '10', '11', '12'];
const sections = ['A', 'B', 'C'];

export const generateTeachers = (count: number): Teacher[] => {
  return Array.from({ length: count }, (_, i) => {
    const joinDate = faker.date.past({ years: 5 }).toISOString().split('T')[0];
    const expiryDate = new Date(joinDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 4);

    return {
      id: `T${String(i + 1).padStart(3, '0')}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      subject: faker.helpers.arrayElement(subjects),
      phone: faker.phone.number(),
      joinDate: joinDate,
      issuedDate: joinDate,
      expiryDate: expiryDate.toISOString().split('T')[0],
      dob: faker.date.birthdate({ min: 25, max: 60, mode: 'age' }).toISOString().split('T')[0],
      salary: parseFloat((faker.number.int({ min: 30000, max: 80000 })).toFixed(2)),
      status: Math.random() > 0.1 ? 'active' : 'inactive',
    };
  });
};

export const generateStudents = (count: number): Student[] => {
  const peterParker: Student = {
    id: 'S0001',
    name: 'Peter Parker',
    email: 'peter.parker@schoolms.com',
    class: '12',
    section: 'A',
    rollNumber: '01',
    phone: '123-456-7890',
    enrollmentDate: '2022-08-15',
    issuedDate: '2024-08-15',
    expiryDate: '2025-08-14',
    status: 'active',
    grade: 'Grade 12',
    dob: '2007-08-10',
    avatar: 'P'
  };

  const otherStudents = Array.from({ length: count > 0 ? count - 1 : 0 }, (_, i) => {
    const enrollmentDate = faker.date.past({ years: 2 }).toISOString().split('T')[0];
    const expiryDate = new Date(enrollmentDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 4);

    return {
      id: `S${String(i + 2).padStart(4, '0')}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      class: faker.helpers.arrayElement(classes),
      grade: `Grade ${faker.helpers.arrayElement(classes)}`,
      section: faker.helpers.arrayElement(sections),
      rollNumber: String(faker.number.int({ min: 1, max: 50 })),
      phone: faker.phone.number(),
      enrollmentDate: enrollmentDate,
      issuedDate: enrollmentDate,
      expiryDate: expiryDate.toISOString().split('T')[0],
      dob: faker.date.birthdate({ min: 14, max: 18, mode: 'age' }).toISOString().split('T')[0],
      status: Math.random() > 0.05 ? 'active' : 'inactive',
    };
  });

  return [peterParker, ...otherStudents];
};

export const generateExams = (count: number): Exam[] => {
  const statuses: ('upcoming' | 'ongoing' | 'completed')[] = ['upcoming', 'ongoing', 'completed'];
  return Array.from({ length: count }, (_, i) => ({
    id: `E${String(i + 1).padStart(3, '0')}`,
    name: `${['Mid-Term', 'Final', 'Unit Test', 'Pre-Board'][i % 4]} Exam`,
    subject: faker.helpers.arrayElement(subjects),
    class: faker.helpers.arrayElement(classes),
    date: faker.date.future({ years: 0.5 }).toISOString().split('T')[0],
    totalMarks: 100,
    passingMarks: 40,
    duration: `${faker.number.int({ min: 60, max: 180 })} minutes`,
    status: faker.helpers.arrayElement(statuses),
  }));
};

export const generateGrades = (students: Student[], exams: Exam[]): Grade[] => {
  const grades: Grade[] = [];
  
  students.forEach(student => {
    const studentExams = faker.helpers.arrayElements(exams, faker.number.int({ min: 3, max: 8 }));
    studentExams.forEach(exam => {
      if (student.class === exam.class) {
        const marksObtained = faker.number.int({ min: 20, max: 100 });
        const percentage = (marksObtained / exam.totalMarks) * 100;
        const gpa = percentage >= 90 ? 4.0 :
                    percentage >= 80 ? 3.5 :
                    percentage >= 70 ? 3.0 :
                    percentage >= 60 ? 2.5 :
                    percentage >= 50 ? 2.0 :
                    percentage >= 40 ? 1.5 : 0.0;
        
        const grade = percentage >= 90 ? 'A+' :
                     percentage >= 80 ? 'A' :
                     percentage >= 70 ? 'B+' :
                     percentage >= 60 ? 'B' :
                     percentage >= 50 ? 'C+' :
                     percentage >= 40 ? 'C' :
                     percentage >= 33 ? 'D' : 'F';

        grades.push({
          id: `G${String(grades.length + 1).padStart(4, '0')}`,
          studentId: student.id,
          studentName: student.name,
          examId: exam.id,
          examName: exam.name,
          subject: exam.subject,
          marksObtained: parseFloat(marksObtained.toFixed(2)),
          totalMarks: exam.totalMarks,
          percentage: parseFloat(percentage.toFixed(2)),
          grade,
          gpa: parseFloat(gpa.toFixed(2)),
          date: exam.date,
        });
      }
    });
  });
  
  return grades;
};

export const generatePayrolls = (teachers: Teacher[]): Payroll[] => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const payrolls: Payroll[] = [];
  
  teachers.forEach(teacher => {
    months.slice(0, 3).forEach((month, i) => {
      const bonus = parseFloat((faker.number.int({ min: 0, max: 5000 })).toFixed(2));
      const deductions = parseFloat((faker.number.int({ min: 0, max: 2000 })).toFixed(2));
      const netSalary = parseFloat((teacher.salary + bonus - deductions).toFixed(2));
      
      payrolls.push({
        id: `P${String(payrolls.length + 1).padStart(4, '0')}`,
        teacherId: teacher.id,
        teacherName: teacher.name,
        month,
        year: 2025,
        baseSalary: parseFloat(teacher.salary.toFixed(2)),
        bonus,
        deductions,
        netSalary,
        status: i === 0 ? 'pending' : i === 1 ? 'processing' : 'paid',
        paidDate: i === 2 ? faker.date.recent({ days: 30 }).toISOString().split('T')[0] : undefined,
      });
    });
  });
  
  return payrolls;
};

export const generateClasses = (teachers: Teacher[], students: Student[], grades: Grade[]): SchoolClass[] => {
  const classMap = new Map<string, { students: Student[], teacher?: Teacher }>();

  students.forEach(student => {
    const className = `${student.class}-${student.section}`;
    if (!classMap.has(className)) {
      classMap.set(className, { students: [], teacher: undefined });
    }
    classMap.get(className)!.students.push(student);
  });

  let teacherIndex = 0;
  for (const className of classMap.keys()) {
    if (teacherIndex < teachers.length) {
      classMap.get(className)!.teacher = teachers[teacherIndex];
      teacherIndex++;
    }
  }

  const schoolClasses: SchoolClass[] = [];
  let classIdCounter = 1;

  for (const [className, data] of classMap.entries()) {
    if (data.students.length === 0) continue;

    const studentIds = new Set(data.students.map(s => s.id));
    const classGrades = grades.filter(g => studentIds.has(g.studentId));
    
    const totalGpa = classGrades.reduce((sum, g) => sum + g.gpa, 0);
    const averageGpa = classGrades.length > 0 ? totalGpa / classGrades.length : 0;
    
    const classSubjects = [...new Set(classGrades.map(g => g.subject))];

    schoolClasses.push({
      id: `C${String(classIdCounter++).padStart(3, '0')}`,
      name: `Class ${className}`,
      teacher: {
        id: data.teacher?.id || 'N/A',
        name: data.teacher?.name || 'Unassigned',
      },
      studentCount: data.students.length,
      averageGpa: parseFloat(averageGpa.toFixed(2)),
      subjects: classSubjects.slice(0, 5),
    });
  }

  return schoolClasses.sort((a, b) => a.name.localeCompare(b.name));
};

export const generateRecentActivities = (count: number): RecentActivity[] => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    description: faker.helpers.arrayElement([
      `New student, ${faker.person.fullName()}, was added.`,
      `Fee payment of $${faker.finance.amount(100, 1000, 0)} received from ${faker.person.fullName()}.`,
      `Exam results for ${faker.helpers.arrayElement(subjects)} have been published.`,
      `New event "${faker.company.catchPhrase()}" has been scheduled.`,
      `${faker.person.fullName()} has been assigned as the new ${faker.helpers.arrayElement(subjects)} teacher.`,
    ]),
    timestamp: `${faker.number.int({ min: 1, max: 23 })} hours ago`,
  }));
};

export const generateEnrollmentData = (students: Student[]): EnrollmentData[] => {
  const enrollmentMap = new Map<string, number>();
  students.forEach(student => {
    const grade = student.grade;
    enrollmentMap.set(grade, (enrollmentMap.get(grade) || 0) + 1);
  });
  return Array.from(enrollmentMap, ([grade, students]) => ({ grade, students }))
    .sort((a, b) => a.grade.localeCompare(b.grade));
};

export const generateDepartments = (count: number, teachers: Teacher[]): Department[] => {
  return Array.from({ length: count }, (_, i) => {
    const hod = faker.helpers.arrayElement(teachers);
    return {
      id: `DPT${String(i + 1).padStart(3, '0')}`,
      name: faker.commerce.department() + ' Studies',
      headOfDepartmentId: hod.id,
      headOfDepartmentName: hod.name,
      description: faker.lorem.sentence(),
      courseCount: faker.number.int({ min: 5, max: 15 }),
    };
  });
};

export const generateCourses = (count: number, teachers: Teacher[], departments: Department[]): Course[] => {
  return Array.from({ length: count }, (_, i) => {
    const teacher = faker.helpers.arrayElement(teachers);
    const department = faker.helpers.arrayElement(departments);
    return {
      id: `CRS${String(i + 1).padStart(3, '0')}`,
      name: faker.hacker.noun().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' 101',
      code: `${faker.hacker.abbreviation()}-${faker.number.int({ min: 100, max: 499 })}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      credits: faker.number.int({ min: 2, max: 4 }),
      departmentId: department.id,
      departmentName: department.name,
    };
  });
};

export const generateLibraryBooks = (count: number): LibraryBook[] => {
  return Array.from({ length: count }, (_, i) => {
    const quantity = faker.number.int({ min: 1, max: 20 });
    const available = faker.number.int({ min: 0, max: quantity });
    return {
      id: `LIB${String(i + 1).padStart(4, '0')}`,
      title: faker.lorem.words(3).split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      author: faker.person.fullName(),
      isbn: faker.commerce.isbn(),
      genre: faker.helpers.arrayElement(['Fiction', 'Science', 'History', 'Biography', 'Fantasy', 'Mystery']),
      quantity,
      available,
      status: available > 0 ? 'available' : 'unavailable',
    };
  });
};

export const generateFees = (students: Student[], baseTuition: number): Fee[] => {
  const fees: Fee[] = [];
  students.slice(0, 30).forEach(student => {
    const feeTypes = [
      { description: 'Tuition Fee', amount: baseTuition },
      { description: 'Exam Fee', amount: faker.number.int({ min: 50, max: 150 }) },
      { description: 'Library Fee', amount: faker.number.int({ min: 20, max: 50 }) },
      { description: 'Sports Fee', amount: faker.number.int({ min: 100, max: 300 }) },
    ];

    const tuitionFee = feeTypes[0];
    const tuitionStatus = faker.helpers.arrayElement(['paid', 'unpaid', 'overdue'] as const);
    const tuitionDueDate = faker.date.between({ from: '2025-01-01', to: '2025-06-30' }).toISOString().split('T')[0];
    let tuitionPaymentDate: string | undefined;
    if (tuitionStatus === 'paid') {
      tuitionPaymentDate = faker.date.past({ refDate: tuitionDueDate }).toISOString().split('T')[0];
    }
    fees.push({
      id: `FEE${String(fees.length + 1).padStart(4, '0')}`,
      studentId: student.id,
      studentName: student.name,
      amount: tuitionFee.amount,
      dueDate: tuitionDueDate,
      status: tuitionStatus,
      paymentDate: tuitionPaymentDate,
      description: tuitionFee.description,
    });

    if (Math.random() > 0.5) {
      const otherFee = faker.helpers.arrayElement(feeTypes.slice(1));
      const otherStatus = faker.helpers.arrayElement(['paid', 'unpaid', 'overdue'] as const);
      const otherDueDate = faker.date.between({ from: '2025-01-01', to: '2025-06-30' }).toISOString().split('T')[0];
      let otherPaymentDate: string | undefined;
      if (otherStatus === 'paid') {
        otherPaymentDate = faker.date.past({ refDate: otherDueDate }).toISOString().split('T')[0];
      }
      fees.push({
        id: `FEE${String(fees.length + 1).padStart(4, '0')}`,
        studentId: student.id,
        studentName: student.name,
        amount: otherFee.amount,
        dueDate: otherDueDate,
        status: otherStatus,
        paymentDate: otherPaymentDate,
        description: otherFee.description,
      });
    }
  });
  return fees;
};

export const generateEvents = (count: number): Event[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `EVT${String(i + 1).padStart(3, '0')}`,
    title: faker.company.catchPhrase(),
    date: faker.date.future().toISOString().split('T')[0],
    time: `${faker.number.int({ min: 9, max: 17 })}:00`,
    location: faker.helpers.arrayElement(['Auditorium', 'Sports Ground', 'Main Hall', 'Library']),
    description: faker.lorem.paragraph(),
    type: faker.helpers.arrayElement(['academic', 'sports', 'cultural', 'other'] as const),
  }));
};

export const generateAttendance = (students: Student[]): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const date = new Date().toISOString().split('T')[0];
  students.forEach(student => {
    if (Math.random() > 0.1) { // 90% chance of having a record for today
      records.push({
        id: faker.string.uuid(),
        studentId: student.id,
        studentName: student.name,
        date: date,
        status: faker.helpers.arrayElement(['present', 'absent', 'late'] as const),
        class: `Class ${student.class}-${student.section}`,
      });
    }
  });
  return records;
};

export const generateHostelRooms = (count: number, students: Student[]): HostelRoom[] => {
  return Array.from({ length: count }, (_, i) => {
    const capacity = faker.helpers.arrayElement([2, 3, 4]);
    const occupantsCount = faker.number.int({ min: 0, max: capacity });
    const occupants = faker.helpers.arrayElements(students, occupantsCount).map(s => s.name);
    let status: 'available' | 'full' | 'maintenance';
    if (Math.random() < 0.05) {
      status = 'maintenance';
    } else if (occupantsCount === capacity) {
      status = 'full';
    } else {
      status = 'available';
    }

    return {
      id: `HR${String(i + 1).padStart(3, '0')}`,
      roomNumber: `${faker.helpers.arrayElement(['A', 'B', 'C'])}-${String(i + 101)}`,
      building: faker.helpers.arrayElement(['North Wing', 'South Wing', 'East Wing']),
      capacity,
      occupants,
      status,
    };
  });
};

export const generateTransportVehicles = (count: number): TransportVehicle[] => {
  return Array.from({ length: count }, (_, i) => {
    const capacity = faker.helpers.arrayElement([20, 30, 40]);
    return {
      id: `TRN${String(i + 1).padStart(3, '0')}`,
      vehicleNumber: `MH-${faker.number.int({min: 10, max: 50})} AB-${faker.number.int({min: 1000, max: 9999})}`,
      driverName: faker.person.fullName(),
      route: `Route ${i + 1}: ${faker.location.streetAddress()}`,
      capacity,
      studentCount: faker.number.int({ min: 10, max: capacity }),
    };
  });
};

export const generateNotices = (count: number, teachers: Teacher[]): Notice[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `NTC${String(i + 1).padStart(3, '0')}`,
    title: faker.lorem.sentence(5),
    content: faker.lorem.paragraphs(3),
    authorName: faker.helpers.arrayElement(teachers).name,
    date: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
    audience: faker.helpers.arrayElement(['all', 'students', 'teachers'] as const),
  }));
};

export const generateExpenses = (count: number): Expense[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `EXP${String(i + 1).padStart(4, '0')}`,
    title: faker.commerce.productName(),
    category: faker.helpers.arrayElement(['salaries', 'utilities', 'maintenance', 'supplies', 'technology', 'other'] as const),
    amount: faker.number.int({ min: 50, max: 2000 }),
    date: faker.date.recent({ days: 90 }).toISOString().split('T')[0],
    description: faker.lorem.sentence(),
  }));
};

export const generateIncomes = (count: number): Income[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `INC${String(i + 1).padStart(4, '0')}`,
    title: faker.company.catchPhrase(),
    category: faker.helpers.arrayElement(['donations', 'grants', 'rentals', 'fundraising', 'other'] as const),
    amount: faker.number.int({ min: 200, max: 5000 }),
    date: faker.date.recent({ days: 90 }).toISOString().split('T')[0],
    description: faker.lorem.sentence(),
  }));
};
