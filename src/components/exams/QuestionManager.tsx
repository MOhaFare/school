import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Skeleton } from '../ui/Skeleton';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'a' | 'b' | 'c' | 'd';
  marks: number;
}

interface QuestionManagerProps {
  examId: string;
  examTitle: string;
  onClose: () => void;
}

const QuestionManager: React.FC<QuestionManagerProps> = ({ examId, examTitle, onClose }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Omit<Question, 'id'>>({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'a',
    marks: 1
  });

  useEffect(() => {
    fetchQuestions();
  }, [examId]);

  const fetchQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('online_exam_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('created_at', { ascending: true });
    
    if (error) {
      toast.error('Failed to load questions');
    } else {
      setQuestions(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.question_text || !formData.option_a || !formData.option_b) {
      toast.error('Question and at least two options are required');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('online_exam_questions')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Question updated');
      } else {
        const { error } = await supabase
          .from('online_exam_questions')
          .insert({ ...formData, exam_id: examId });
        if (error) throw error;
        toast.success('Question added');
      }
      
      // Reset form
      setFormData({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'a',
        marks: 1
      });
      setEditingId(null);
      fetchQuestions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (q: Question) => {
    setEditingId(q.id);
    setFormData({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      marks: q.marks
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    const { error } = await supabase.from('online_exam_questions').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Question deleted');
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'a',
      marks: 1
    });
  };

  return (
    <div className="flex flex-col h-[80vh]">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Manage Questions</h2>
          <p className="text-sm text-slate-500">Exam: {examTitle}</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
          Total Questions: {questions.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden">
        {/* Question Form */}
        <div className="lg:col-span-1 bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-y-auto">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
            {editingId ? <EditIcon /> : <PlusIcon />}
            {editingId ? 'Edit Question' : 'Add New Question'}
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question Text</Label>
              <textarea 
                className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
                value={formData.question_text}
                onChange={e => setFormData({...formData, question_text: e.target.value})}
                placeholder="Enter question here..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Option A</Label>
                <Input value={formData.option_a} onChange={e => setFormData({...formData, option_a: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Option B</Label>
                <Input value={formData.option_b} onChange={e => setFormData({...formData, option_b: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Option C</Label>
                <Input value={formData.option_c} onChange={e => setFormData({...formData, option_c: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Option D</Label>
                <Input value={formData.option_d} onChange={e => setFormData({...formData, option_d: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Correct Option</Label>
                <Select 
                  value={formData.correct_option} 
                  onChange={e => setFormData({...formData, correct_option: e.target.value as any})}
                >
                  <option value="a">Option A</option>
                  <option value="b">Option B</option>
                  <option value="c">Option C</option>
                  <option value="d">Option D</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marks</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={formData.marks} 
                  onChange={e => setFormData({...formData, marks: parseInt(e.target.value)})} 
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">
                <Save size={16} className="mr-2" /> {editingId ? 'Update' : 'Add'}
              </Button>
              {editingId && (
                <Button variant="secondary" onClick={handleCancelEdit}>Cancel</Button>
              )}
            </div>
          </div>
        </div>

        {/* Question List */}
        <div className="lg:col-span-2 overflow-y-auto pr-2">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <AlertCircle size={48} className="mb-2 opacity-50" />
              <p>No questions added yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={q.id} className={`bg-white p-4 rounded-xl border transition-all ${editingId === q.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 hover:shadow-md'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <h4 className="font-medium text-slate-900">{q.question_text}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                        {q.marks} Marks
                      </span>
                      <button onClick={() => handleEdit(q)} className="text-slate-400 hover:text-blue-600 p-1"><EditIcon size={16}/></button>
                      <button onClick={() => handleDelete(q.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 ml-9 text-sm">
                    <OptionRow label="A" text={q.option_a} isCorrect={q.correct_option === 'a'} />
                    <OptionRow label="B" text={q.option_b} isCorrect={q.correct_option === 'b'} />
                    {q.option_c && <OptionRow label="C" text={q.option_c} isCorrect={q.correct_option === 'c'} />}
                    {q.option_d && <OptionRow label="D" text={q.option_d} isCorrect={q.correct_option === 'd'} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OptionRow = ({ label, text, isCorrect }: { label: string, text: string, isCorrect: boolean }) => (
  <div className={`flex items-center gap-2 ${isCorrect ? 'text-green-700 font-medium' : 'text-slate-500'}`}>
    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${isCorrect ? 'bg-green-100 border-green-300' : 'bg-white border-slate-200'}`}>
      {label}
    </span>
    <span>{text}</span>
    {isCorrect && <CheckCircle size={14} />}
  </div>
);

const EditIcon = ({ size }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);

const PlusIcon = ({ size }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export default QuestionManager;
