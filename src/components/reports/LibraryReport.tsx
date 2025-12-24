import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';

const LibraryReport: React.FC = () => {
  const { profile } = useGlobal();
  const [books, setBooks] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      const { data } = await supabase
        .from('library_books')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('title');
      setBooks(data || []);
    };
    fetchData();
  }, [profile]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Library Inventory</h3>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Genre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Available</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {books.map((b, idx) => (
                    <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{b.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{b.author}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{b.genre}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{b.available} / {b.quantity}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};

export default LibraryReport;
