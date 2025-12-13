import React, { useState } from 'react';
import { PhoneCall, Users, AlertCircle, ClipboardList, Mail } from 'lucide-react';
import AdmissionEnquiry from '../components/front-office/AdmissionEnquiry';
import VisitorBook from '../components/front-office/VisitorBook';
import Complaints from '../components/front-office/Complaints';
import PostalRecords from '../components/front-office/PostalRecords';

const tabs = [
  { id: 'enquiry', label: 'Admission Enquiry', icon: PhoneCall },
  { id: 'visitor', label: 'Visitor Book', icon: Users },
  { id: 'complaint', label: 'Complaints', icon: AlertCircle },
  { id: 'postal', label: 'Postal Dispatch/Receive', icon: Mail },
];

const FrontOffice: React.FC = () => {
  const [activeTab, setActiveTab] = useState('enquiry');

  const renderContent = () => {
    switch (activeTab) {
      case 'enquiry': return <AdmissionEnquiry />;
      case 'visitor': return <VisitorBook />;
      case 'complaint': return <Complaints />;
      case 'postal': return <PostalRecords />;
      default: return <AdmissionEnquiry />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ClipboardList className="text-blue-600"/> Front Office
          </h1>
          <p className="text-slate-500 mt-1">Manage reception, enquiries, and visitors.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
        <div className="flex overflow-x-auto pb-2 sm:pb-0 scrollbar-thin scrollbar-thumb-slate-200 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={16} className={`mr-2 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="animate-in fade-in duration-300">
        {renderContent()}
      </div>
    </div>
  );
};

export default FrontOffice;
