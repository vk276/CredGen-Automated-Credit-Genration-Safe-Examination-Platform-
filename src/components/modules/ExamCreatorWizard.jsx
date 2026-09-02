import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FilePlus2, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Award, 
  Sliders, 
  Database,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export const ExamCreatorWizard = () => {
  const { courses, questionBank, createExam, setCurrentView } = useApp();

  const [step, setStep] = useState(1);
  const [examForm, setExamForm] = useState({
    title: '',
    courseId: 'CS-302',
    courseName: 'Database Management Systems',
    examType: 'Hybrid (Objective + Subjective)',
    totalMarks: 30,
    passingMarks: 12,
    durationMinutes: 45,
    negativeMarking: true,
    negativeMarkValue: 0.25, // 25%
    shuffleQuestions: true,
    shuffleOptions: true,
    autoSubmitOnExpiry: true,
    creditWeight: 4,
    assignedBatches: ['B.Tech CSE Sec C 2026'],
    questionIds: ['qb_101', 'qb_102', 'qb_103']
  });

  const handleCourseSelect = (courseId) => {
    const matched = courses.find(c => c.id === courseId);
    setExamForm({
      ...examForm,
      courseId,
      courseName: matched ? matched.name : 'Selected Course',
      creditWeight: matched ? matched.credits : 4,
      title: `${matched ? matched.name : 'Course'} — Assessment ${new Date().getFullYear()}`
    });
  };

  const toggleQuestionSelection = (qId) => {
    if (examForm.questionIds.includes(qId)) {
      setExamForm({
        ...examForm,
        questionIds: examForm.questionIds.filter(id => id !== qId)
      });
    } else {
      setExamForm({
        ...examForm,
        questionIds: [...examForm.questionIds, qId]
      });
    }
  };

  const handleFinish = (status = 'SCHEDULED') => {
    createExam({
      ...examForm,
      status,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
    });
    setCurrentView('dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Wizard Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Examination Creation Wizard</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Step {step} of 4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure examination parameters, negative marking, question set assembly, and CBCS credit rules.
          </p>
        </div>

        {/* Steps Breadcrumbs */}
        <div className="hidden sm:flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s 
                  ? 'bg-brand-600 text-white shadow-glow' 
                  : step > s 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              {step > s ? <Check className="w-3.5 h-3.5" /> : s}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" /> Step 1: Course & Assessment Classification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Target Course / Subject</label>
              <select
                value={examForm.courseId}
                onChange={(e) => handleCourseSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input text-xs bg-slate-900"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name} ({c.credits} Credits)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Assessment Title</label>
              <input
                type="text"
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                placeholder="e.g. Mid-Semester Major Exam — DBMS"
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Examination Format</label>
              <select
                value={examForm.examType}
                onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}
                className="w-full p-2.5 rounded-xl glass-input text-xs bg-slate-900"
              >
                <option value="Hybrid (Objective + Subjective)">Hybrid (Objective + Subjective)</option>
                <option value="Objective MCQ Only">Objective MCQ Only</option>
                <option value="Subjective Theory Examination">Subjective Theory Examination</option>
                <option value="Practical & Code Assessment">Practical & Code Assessment</option>
                <option value="End-Term CBCS Major">End-Term CBCS Major</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Assigned Student Batch</label>
              <input
                type="text"
                value={examForm.assignedBatches[0]}
                onChange={(e) => setExamForm({ ...examForm, assignedBatches: [e.target.value] })}
                placeholder="e.g. B.Tech CSE Sec C 2026"
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Time, Marking & Rules */}
      {step === 2 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Step 2: Timing, Passing & Negative Marking Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                value={examForm.durationMinutes}
                onChange={(e) => setExamForm({ ...examForm, durationMinutes: parseInt(e.target.value) || 45 })}
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Total Maximum Marks</label>
              <input
                type="number"
                value={examForm.totalMarks}
                onChange={(e) => setExamForm({ ...examForm, totalMarks: parseInt(e.target.value) || 30 })}
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Passing Cut-off Marks</label>
              <input
                type="number"
                value={examForm.passingMarks}
                onChange={(e) => setExamForm({ ...examForm, passingMarks: parseInt(e.target.value) || 12 })}
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <div className="text-xs font-semibold text-slate-200">Negative Marking on Incorrect Objective Answers</div>
                <div className="text-[11px] text-slate-400">Deduct fractional penalty on wrong MCQ choices</div>
              </div>
              <div className="flex items-center gap-3">
                {examForm.negativeMarking && (
                  <select
                    value={examForm.negativeMarkValue}
                    onChange={(e) => setExamForm({ ...examForm, negativeMarkValue: parseFloat(e.target.value) })}
                    className="p-1 rounded-lg glass-input text-xs bg-slate-950"
                  >
                    <option value={0.25}>-25% (1/4th)</option>
                    <option value={0.33}>-33% (1/3rd)</option>
                    <option value={0.50}>-50% (1/2)</option>
                  </select>
                )}
                <input
                  type="checkbox"
                  checked={examForm.negativeMarking}
                  onChange={(e) => setExamForm({ ...examForm, negativeMarking: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <div className="text-xs font-semibold text-slate-200">Anti-Malpractice Deterministic Question Shuffling</div>
                <div className="text-[11px] text-slate-400">Randomize question order and options per student session</div>
              </div>
              <input
                type="checkbox"
                checked={examForm.shuffleQuestions}
                onChange={(e) => setExamForm({ ...examForm, shuffleQuestions: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Question Assembly */}
      {step === 3 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" /> Step 3: Assemble Questions from Repository
              </h3>
              <p className="text-xs text-slate-400">Select questions to include in this exam instance ({examForm.questionIds.length} Selected)</p>
            </div>
            <button
              onClick={() => setExamForm({ ...examForm, questionIds: questionBank.map(q => q.id) })}
              className="text-xs text-brand-400 font-semibold hover:underline"
            >
              Select All ({questionBank.length})
            </button>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {questionBank.map((q) => {
              const isSelected = examForm.questionIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleQuestionSelection(q.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    isSelected 
                      ? 'bg-brand-950/40 border-brand-500/50 text-slate-200' 
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-400">{q.courseId}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{q.type}</span>
                      <span className="text-[10px] text-slate-400">{q.topic}</span>
                    </div>
                    <div className="font-medium text-slate-200 line-clamp-1">{q.questionText}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-emerald-400">+{q.marks} M</span>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                      isSelected ? 'bg-brand-600 border-brand-500 text-white' : 'border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: CBCS Credit Mapping & Publish */}
      {step === 4 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" /> Step 4: Review & Finalize Examination
          </h3>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Examination Title:</span>
              <span className="font-semibold text-slate-200">{examForm.title}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Course & Credits:</span>
              <span className="font-semibold text-slate-200">{examForm.courseName} ({examForm.creditWeight} Academic Credits)</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Selected Questions:</span>
              <span className="font-semibold text-emerald-400">{examForm.questionIds.length} Questions included</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">UGC CBCS Conversion:</span>
              <span className="font-semibold text-indigo-400">Auto-Generates 10-Point SGPA Grade Card</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end pt-2">
            <button
              onClick={() => handleFinish('DRAFT')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleFinish('LIVE')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-glow-emerald"
            >
              Launch Exam Now (Set Live)
            </button>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          disabled={step === 1}
          onClick={() => setStep(step - 1)}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 disabled:opacity-40 flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow flex items-center gap-2"
          >
            Next Step <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

    </div>
  );
};
