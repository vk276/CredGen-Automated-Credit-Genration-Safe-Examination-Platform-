import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Database, 
  FilePlus2, 
  FileCheck2, 
  Award, 
  BarChart3, 
  Users, 
  Settings, 
  Building2, 
  GraduationCap,
  PlayCircle,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

export const Sidebar = () => {
  const { currentUser, currentView, setCurrentView } = useApp();
  const role = currentUser?.role || 'STUDENT';

  // Navigation Items per Role
  const getNavItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { id: 'dashboard', label: 'Admin Overview', icon: LayoutDashboard, badge: null },
          { id: 'users_mgmt', label: 'User Directory', icon: Users, badge: 'RBAC' },
          { id: 'dept_mgmt', label: 'Departments & Courses', icon: Building2, badge: null },
          { id: 'cbcs_rules', label: 'CBCS Credit Policies', icon: Award, badge: 'UGC' },
          { id: 'exams_all', label: 'Institutional Exams', icon: FileCheck2, badge: null },
          { id: 'analytics', label: 'System Analytics', icon: BarChart3, badge: null },
        ];
      case 'TEACHER':
        return [
          { id: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard, badge: null },
          { id: 'question_bank', label: 'Question Bank', icon: Database, badge: 'Taxonomy' },
          { id: 'exam_creator', label: 'Create Examination', icon: FilePlus2, badge: 'New' },
          { id: 'eval_queue', label: 'Subjective Grading', icon: FileCheck2, badge: 'Rubric' },
          { id: 'marksheets', label: 'Marksheet Registry', icon: Award, badge: null },
          { id: 'analytics', label: 'Subject Analytics', icon: BarChart3, badge: null },
        ];
      case 'STUDENT':
      default:
        return [
          { id: 'dashboard', label: 'My Learning Desk', icon: LayoutDashboard, badge: null },
          { id: 'student_exams', label: 'Scheduled Exams', icon: FilePlus2, badge: 'Active' },
          { id: 'student_live_exam', label: 'Live Test Room', icon: PlayCircle, badge: 'Timed' },
          { id: 'student_results', label: 'My CBCS Marksheets', icon: Award, badge: 'Grade Cards' },
          { id: 'student_analytics', label: 'My Performance', icon: BarChart3, badge: null },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      
      {/* Navigation List */}
      <div className="space-y-6">
        
        {/* Role Identification Header */}
        <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Current Workspace
          </div>
          <div className="text-sm font-semibold text-slate-200 mt-0.5 flex items-center justify-between">
            <span>{role === 'ADMIN' ? 'Control Board' : role === 'TEACHER' ? 'Faculty Portal' : 'Student Desk'}</span>
            <span className={`w-2 h-2 rounded-full ${
              role === 'ADMIN' ? 'bg-rose-500' : role === 'TEACHER' ? 'bg-indigo-500' : 'bg-emerald-500'
            } animate-pulse`} />
          </div>
        </div>

        {/* Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-glow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Compliance & Help Badge */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2">
        <div className="p-3 rounded-xl bg-brand-950/40 border border-brand-800/30 text-[11px] text-slate-300">
          <div className="font-semibold text-brand-300 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> UGC CBCS Compliant
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Automated Letter Grade & Credit Point calculation engine active.
          </p>
        </div>
      </div>

    </aside>
  );
};
