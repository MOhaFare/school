import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <ShieldCheck className="text-blue-600" size={36} strokeWidth={1.5} />
      <span className="absolute text-blue-600 text-sm font-bold" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        SP
      </span>
    </div>
  );
};

export default Logo;
