import React from 'react';
import { Wrench } from 'lucide-react';

interface PlaceholderProps {
  title: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-white rounded-lg border border-border">
      <Wrench className="h-16 w-16 text-gray-400 mb-4" />
      <h1 className="text-2xl font-bold text-primary mb-2">{title}</h1>
      <p className="text-muted-foreground">This page is under construction.</p>
      <p className="text-muted-foreground">Check back soon for updates!</p>
    </div>
  );
};

export default Placeholder;
