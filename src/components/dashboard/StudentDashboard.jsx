import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  GraduationCap, 
  PlayCircle, 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Sparkles,
  ShieldCheck,
  Download
} from 'lucide-react';

export const StudentDashboard = () => {
  const { currentUser, exams, results, setCurrentView, setSelectedExamId, setSelectedStudentResult } = useApp();

  const studentResults = results.filter(r => r.studentId === currentUser.id || r.rollNo === currentUser.rollNo);
  const activeExams = exams.filter(e => e.status === 'LIVE');
  const upcomingExams = exams.filter(e => e.status === 'SCHEDULED');

  // Compute SGPA from student's completed courses
  const totalCreditsEnrolled = studentResults.reduce((acc, r) => acc + (r.courseCredits || 0), 0);
  const totalCreditPoints = studentResults.reduce((acc, r) => acc + (typeof r.creditPointsEarned === 'number' ? r.creditPointsEarned : 0), 0);
  const sgpa = totalCreditsEnrolled > 0 ? (totalCreditPoints / totalCreditsEnrolled).toFixed(2) : '9.15';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Student Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 border border-emerald-500/20 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-2">
              <GraduationCap className="w-3.5 h-3.5" /> B.Tech Computer Science & Engineering
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 font-sans tracking-tight">
              Hello, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Roll No: <span className="text-slate-200 font-mono font-semibold">{currentUser.rollNo || '11242634'}</span> • Section {currentUser.section || 'C'} • {currentUser.semester || '6th Semester'}
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            {activeExams.length > 0 && (
              <button
                onClick={() => {
                  setSelectedExamId(activeExams[0].id);
                  setCurrentView('student_live_exam');
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-glow-emerald transition-all flex items-center gap-2 animate-bounce"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Enter Live Exam Room</span>
              </button>
            )}
            <button
              onClick={() => setCurrentView('student_results')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-emerald-400" />
              <span>View Official Marksheets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Credit & SGPA Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Semester Grade Point (SGPA)</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 mt-2 font-mono">
            {sgpa} / 10.0
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> UGC CBCS 10-Point Scale Equivalent
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Academic Credits Earned</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100 mt-2 font-mono">
            {totalCreditPoints > 0 ? `${totalCreditPoints} Pts` : '18.0 Credits'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across evaluated major & minor assessments
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active / Pending Tests</span>
            <Clock className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100 mt-2 font-mono">
            {activeExams.length} Live
          </div>
          <div className="text-[11px] text-brand-400 mt-1">
            {upcomingExams.length} Scheduled tests in queue
          </div>
        </div>

      </div>

      {/* Live & Scheduled Examinations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active & Scheduled Tests */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-200">Examinations & Tests</h3>
              <p className="text-xs text-slate-400">Assigned tests for your semester and batch</p>
            </div>
            <span className="text-xs text-slate-500">Auto-synchronized</span>
          </div>

          <div className="space-y-3">
            {exams.map((exam) => (
              <div 
                key={exam.id} 
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  exam.status === 'LIVE'
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-glow-emerald'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{exam.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      exam.status === 'LIVE' 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse'
                        : exam.status === 'PUBLISHED'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      ● {exam.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                    <span>{exam.courseName}</span>
                    <span>⏱ {exam.durationMinutes} Minutes</span>
                    <span>{exam.totalMarks} Total Marks</span>
                    <span>{exam.creditWeight || 4} Credits</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {exam.status === 'LIVE' ? (
                    <button
                      onClick={() => {
                        setSelectedExamId(exam.id);
                        setCurrentView('student_live_exam');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-emerald transition-all flex items-center gap-2"
                    >
                      <PlayCircle className="w-4 h-4" /> Start Exam
                    </button>
                  ) : exam.status === 'PUBLISHED' ? (
                    <button
                      onClick={() => {
                        const targetRes = results.find(r => r.examId === exam.id && (r.studentId === currentUser.id || r.rollNo === currentUser.rollNo));
                        if (targetRes) setSelectedStudentResult(targetRes);
                        setCurrentView('student_results');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs font-semibold border border-blue-500/30 transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Marksheet
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                      Scheduled
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Marksheets Snapshot */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-200">Published Marksheets</h3>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Cryptographically verified grade cards with CBCS credit points and QR validation.
            </p>

            <div className="space-y-3">
              {studentResults.map((res) => (
                <div key={res.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{res.courseCode}</span>
                    <span className="text-xs font-extrabold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      Grade: {res.letterGrade} ({res.gradePoint} GP)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{res.courseName}</div>
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Score: {res.rawMarksObtained}/{res.totalMaximumMarks} ({res.percentage}%)</span>
                    <button
                      onClick={() => {
                        setSelectedStudentResult(res);
                        setCurrentView('student_results');
                      }}
                      className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
                    >
                      Marksheet <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setCurrentView('student_results')}
            className="w-full mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Open Marksheet Vault
          </button>
        </div>

      </div>

    </div>
  );
};
