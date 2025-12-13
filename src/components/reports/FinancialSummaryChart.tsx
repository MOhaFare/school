import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  fill: string;
}

interface FinancialSummaryChartProps {
  data: ChartData[];
}

const FinancialSummaryChart: React.FC<FinancialSummaryChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-border h-full">
      <h3 className="text-lg font-semibold text-primary mb-4">Financial Summary</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(value) => `${(value as number / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip formatter={(value) => `${(value as number).toLocaleString()} Birr`} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Bar key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancialSummaryChart;
