import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Building2, 
  Award, 
  FileCheck, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  ArrowUpRight, 
  Settings2,
  BookOpen
} from 'lucide-react';

export const AdminDashboard = () => {
  const { users, departments, courses, gradeRules, exams, setCurrentView } = useApp();

  const totalStudents = users.filter(u => u.role === 'STUDENT').length;
  const totalFaculty = users.filter(u => u.role === 'TEACHER').length;
  const liveExams = exams.filter(e => e.status === 'LIVE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 border border-rose-500/20 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Institutional Master Control
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 font-sans tracking-tight">
              University Examination Control Board
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Full administrative governance: Manage academic departments, enforce UGC CBCS 10-point credit algorithms, and monitor live examination sessions.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setCurrentView('cbcs_rules')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-brand-400" />
              <span>Configure CBCS Policies</span>
            </button>
            <button
              onClick={() => setCurrentView('users_mgmt')}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-glow transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Manage User Directory</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Registered Students</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">{totalStudents} Candidates</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Active across 4 Departments
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Faculty & Examiners</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">{totalFaculty} Teachers</div>
          <div className="text-[11px] text-indigo-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Question Bank Contributors
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Live / Scheduled Exams</span>
            <FileCheck className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">{exams.length} Total</div>
          <div className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /> {liveExams} Live Sessions Right Now
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Credit Framework</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">UGC CBCS 10-Pt</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {gradeRules.length} Defined Grade Tiers (O to F)
          </div>
        </div>

      </div>

      {/* Department & Policy Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Academic Departments Overview */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-200">Academic Departments & Enrollment</h3>
              <p className="text-xs text-slate-400">Accredited engineering divisions under MMDU</p>
            </div>
            <button 
              onClick={() => setCurrentView('dept_mgmt')}
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {departments.map((dept) => (
              <div key={dept.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                    {dept.code}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{dept.name}</div>
                    <div className="text-[11px] text-slate-400">{dept.totalFaculty} Assigned Faculty Members</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400">{dept.totalStudents}</span>
                  <span className="text-[10px] text-slate-500 block">Enrolled Students</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CBCS Grade Scale Reference */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-200">CBCS 10-Point Scale</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active Policy
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Standard UGC conversion applied to compute Letter Grades and Grade Points for all courses.
            </p>
            
            <div className="space-y-1.5 overflow-y-auto max-h-56 pr-1">
              {gradeRules.map((rule, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-7 font-bold text-brand-400">{rule.letterGrade}</span>
                    <span className="text-slate-400 text-[11px]">{rule.description}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">{rule.minPercentage}% - {rule.maxPercentage}%</span>
                    <span className="font-semibold text-emerald-400 w-6 text-right">GP: {rule.gradePoint}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setCurrentView('cbcs_rules')}
            className="w-full mt-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <Settings2 className="w-3.5 h-3.5" /> Modify Grade Cut-Off Thresholds
          </button>
        </div>

      </div>

    </div>
  );
};
