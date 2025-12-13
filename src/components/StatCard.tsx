import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconBgColor: string;
  trend: string;
  trendDirection: 'up' | 'down';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, iconBgColor, trend, trendDirection }) => {
  const isUp = trendDirection === 'up';
  const trendColor = isUp ? 'text-green-600' : 'text-red-600';
  const TrendIcon = isUp ? ArrowUp : ArrowDown;

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-border">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-primary mt-1">{value}</p>
          <div className={`text-xs flex items-center mt-2 ${trendColor}`}>
            <TrendIcon className="h-3 w-3 mr-1" />
            <span>{trend}</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${iconBgColor}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
