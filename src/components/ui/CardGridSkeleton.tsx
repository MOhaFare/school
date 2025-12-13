import React from 'react';
import { Skeleton } from './Skeleton';

interface CardGridSkeletonProps {
  title: string;
  cardCount?: number;
}

const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({ title, cardCount = 3 }) => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: cardCount }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="pt-4 border-t mt-4">
              <Skeleton className="h-8 w-1/4 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardGridSkeleton;
