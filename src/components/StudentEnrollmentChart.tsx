import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EnrollmentData } from '../types';

interface StudentEnrollmentChartProps {
  data: EnrollmentData[];
}

const StudentEnrollmentChart: React.FC<StudentEnrollmentChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-border h-full">
      <h3 className="text-lg font-semibold text-primary mb-4">Student Enrollment by Grade</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            barGap={10}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="grade" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(238, 242, 255, 0.6)' }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '0.5rem',
              }}
            />
            <Bar dataKey="students" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StudentEnrollmentChart;
