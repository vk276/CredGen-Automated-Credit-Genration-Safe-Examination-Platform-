import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  PlusCircle, 
  Database, 
  FileCheck2, 
  Award, 
  Clock, 
  Calendar, 
  AlertCircle, 
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Users
} from 'lucide-react';

export const TeacherDashboard = () => {
  const { currentUser, exams, questionBank, results, setCurrentView, setSelectedExamId } = useApp();

  const teacherExams = exams.filter(e => e.createdBy === currentUser.name || currentUser.assignedSubjects?.includes(e.courseId));
  const pendingSubjective = results.filter(r => r.evaluationStatus === 'PENDING_MANUAL_REVIEW');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Faculty Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 border border-indigo-500/20 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold mb-2">
              <BookOpen className="w-3.5 h-3.5" /> Examiner Portal: {currentUser.department}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 font-sans tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Manage your course question repositories, configure multi-format examinations, and review subjective student submissions with rubric-guided scoring.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setCurrentView('exam_creator')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Exam</span>
            </button>
            <button
              onClick={() => setCurrentView('question_bank')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Question Bank ({questionBank.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">My Active / Scheduled Tests</span>
            <FileCheck2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">{teacherExams.length} Exams</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Assigned to B.Tech CSE Batches
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Pending Subjective Evaluations</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{pendingSubjective.length} Submissions</div>
          <div className="text-[11px] text-amber-300/80 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Requires Rubric Marking
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Questions Authored</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">{questionBank.length} Items</div>
          <div className="text-[11px] text-emerald-400 mt-1">
            Tagged by Unit, Topic & Bloom Level
          </div>
        </div>

      </div>

      {/* Main Content Grid: Assigned Exams & Evaluation Prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Examinations Created */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-200">My Examination Pipeline</h3>
              <p className="text-xs text-slate-400">Lifecycle status of scheduled and live examinations</p>
            </div>
            <button 
              onClick={() => setCurrentView('exam_creator')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              + New Test <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {teacherExams.map((exam) => (
              <div 
                key={exam.id} 
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{exam.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      exam.status === 'LIVE' 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                        : exam.status === 'PUBLISHED'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      ● {exam.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                    <span>{exam.courseName} ({exam.courseId})</span>
                    <span>⏱ {exam.durationMinutes} mins</span>
                    <span>{exam.totalMarks} Marks</span>
                    <span>{exam.negativeMarking ? `-${exam.negativeMarkValue || 0.5} Marks` : 'No Negative'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedExamId(exam.id);
                      setCurrentView('eval_queue');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    Submissions
                  </button>
                  <button
                    onClick={() => setCurrentView('marksheets')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-medium border border-indigo-500/30 transition-colors"
                  >
                    Grade Cards
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Evaluation Queue Box */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-200">Grading Queue</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {pendingSubjective.length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Blind subjective scoring interface with model answers and structured criteria rubrics.
            </p>

            {pendingSubjective.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs text-slate-300 font-medium">All caught up!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">No pending subjective answer sheets to grade.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingSubjective.map((sub, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{sub.studentName}</div>
                      <div className="text-[10px] text-slate-400">{sub.examTitle}</div>
                    </div>
                    <button
                      onClick={() => setCurrentView('eval_queue')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-[11px] font-semibold"
                    >
                      Grade Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setCurrentView('eval_queue')}
            className="w-full mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <FileCheck2 className="w-4 h-4 text-indigo-400" /> Open Full Evaluator Portal
          </button>
        </div>

      </div>

    </div>
  );
};
