import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';
import { Download, CheckCircle, Clock, FileText, Save } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { formatDate } from '../../utils/format';

interface HomeworkEvaluationModalProps {
  homeworkId: string;
  homeworkTitle: string;
  onClose: () => void;
}

interface Submission {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  submitted_at: string;
  file_url: string;
  message: string;
  score: number;
  remarks: string;
  status: 'submitted' | 'evaluated';
}

const HomeworkEvaluationModal: React.FC<HomeworkEvaluationModalProps> = ({ homeworkId, homeworkTitle, onClose }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  
  // Evaluation Form
  const [score, setScore] = useState<number>(0);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [homeworkId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('homework_submissions')
        .select('*, students(name, roll_number)')
        .eq('homework_id', homeworkId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      setSubmissions(data.map((s: any) => ({
        ...s,
        student_name: s.students?.name || 'Unknown',
        roll_number: s.students?.roll_number || '-'
      })));
    } catch (error: any) {
      toast.error(`Failed to load submissions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEvaluation = (submission: Submission) => {
    setEvaluatingId(submission.id);
    setScore(submission.score || 0);
    setRemarks(submission.remarks || '');
  };

  const saveEvaluation = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('homework_submissions')
        .update({
          score,
          remarks,
          status: 'evaluated'
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success('Evaluation saved');
      setEvaluatingId(null);
      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex flex-col h-[70vh]">
      <div className="mb-4 pb-4 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg text-slate-800">{homeworkTitle}</h3>
          <p className="text-sm text-slate-500">{submissions.length} Submissions</p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md">
            Evaluated: {submissions.filter(s => s.status === 'evaluated').length}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
            Pending: {submissions.filter(s => s.status === 'submitted').length}
          </span>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto pr-2">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText size={48} className="mx-auto mb-3 opacity-20" />
            <p>No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub.id} className={`p-4 rounded-lg border transition-all ${evaluatingId === sub.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{sub.student_name}</h4>
                    <p className="text-xs text-slate-500">Roll No: {sub.roll_number} • Submitted: {formatDate(sub.submitted_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.status === 'evaluated' ? (
                      <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                        <CheckCircle size={12} className="mr-1" /> {sub.score}/100
                      </span>
                    ) : (
                      <span className="flex items-center text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                        <Clock size={12} className="mr-1" /> Pending
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 mb-3 border border-slate-100">
                  {sub.message || <span className="italic text-slate-400">No message provided.</span>}
                  {sub.file_url && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <a 
                        href={sub.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:underline"
                      >
                        <Download size={14} className="mr-1" /> Download Attachment
                      </a>
                    </div>
                  )}
                </div>

                {evaluatingId === sub.id ? (
                  <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Marks (0-100)</label>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={score} 
                        onChange={e => setScore(parseInt(e.target.value))} 
                        className="bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-slate-700 block mb-1">Remarks</label>
                      <div className="flex gap-2">
                        <Input 
                          value={remarks} 
                          onChange={e => setRemarks(e.target.value)} 
                          placeholder="Good work..." 
                          className="bg-white"
                        />
                        <Button size="icon" onClick={() => saveEvaluation(sub.id)} className="bg-green-600 hover:bg-green-700 shrink-0">
                          <Save size={18} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-slate-500 italic">
                      {sub.remarks ? `Teacher: "${sub.remarks}"` : ''}
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => startEvaluation(sub)}>
                      {sub.status === 'evaluated' ? 'Edit Grade' : 'Evaluate'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkEvaluationModal;
