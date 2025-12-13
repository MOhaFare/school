import React from 'react';
import { RecentActivity } from '../types';

interface RecentActivitiesProps {
  activities: RecentActivity[];
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-border h-full">
      <h3 className="text-lg font-semibold text-primary mb-4">Recent Activities</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex items-start">
            <div className="mt-1">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${index % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-gray-700">{activity.description}</p>
              <p className="text-xs text-gray-500 mt-0.5">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivities;
