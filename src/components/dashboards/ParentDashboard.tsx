import React, { useEffect, useState } from 'react';
import { Users, BookOpen, DollarSign } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { supabase } from '../../lib/supabaseClient';
import { Skeleton } from '../ui/Skeleton';
import toast from 'react-hot-toast';
import { Student } from '../../types';

const ParentDashboard: React.FC = () => {
  const { user } = useGlobal();
  const [children, setChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user?.email) return;
      setLoading(true);
      try {
        // Find students where parent_email matches logged in user
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('parent_email', user.email);

        if (error) throw error;
        setChildren(data || []);
      } catch (error: any) {
        console.error("Error fetching children:", error);
        toast.error("Failed to load children data");
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [user]);

  if (loading) {
    return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Parent Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome! Here is an overview of your children's progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map(child => (
          <div key={child.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-500 overflow-hidden">
                {child.avatar ? <img src={child.avatar} alt={child.name} className="w-full h-full object-cover" /> : child.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{child.name}</h3>
                <p className="text-sm text-slate-500">Class {child.class}-{child.section}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <BookOpen size={16} className="text-blue-500" /> Grade
                </div>
                <span className="font-bold text-slate-900">{child.grade}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Users size={16} className="text-green-500" /> Roll No
                </div>
                <span className="font-bold text-slate-900">{child.rollNumber}</span>
              </div>
            </div>
          </div>
        ))}
        
        {children.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">No children linked to your account email ({user?.email}).</p>
            <p className="text-xs text-slate-400 mt-1">Please contact the school administrator to update your email in student records.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
