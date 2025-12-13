import React from 'react';
import { Skeleton } from './Skeleton';

interface TableSkeletonProps {
  title: string;
  headers: string[];
  rowCount?: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ title, headers, rowCount = 5 }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: rowCount }).map((_, index) => (
                <tr key={index}>
                  {headers.map((header) => (
                    <td key={header} className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TableSkeleton;
