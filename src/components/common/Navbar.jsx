import { UserAvatar } from './UserAvatar';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  GraduationCap, 
  Shield, 
  UserCheck, 
  BookOpen, 
  LogOut, 
  User, 
  ChevronDown,
  Bell,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const Navbar = ({ onOpenAuth }) => {
  const { currentUser, switchRole, setCurrentView, logoutUser, liveNotification, setLiveNotification, users } = useApp();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const getRoleBadge = (role, user) => {
    if (role === 'ADMIN') {
      return {
        label: user?.name === 'Banda Shashank' ? 'Admin (Shashank)' : 'Admin (Vivek)',
        icon: Shield,
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      };
    }
    if (role === 'TEACHER') {
      return {
        label: 'Faculty / Examiner',
        icon: BookOpen,
        color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      };
    }
    return {
      label: 'Candidate / Student',
      icon: GraduationCap,
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    };
  };

  const roleInfo = getRoleBadge(currentUser?.role || 'STUDENT', currentUser);
  const RoleIcon = roleInfo.icon;

  return (
    <>
      {/* Live Toast Notification (e.g. OTP Dispatched or Logout) */}
      {liveNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md p-4 rounded-2xl bg-slate-900/95 border border-brand-500/50 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-slate-100">{liveNotification.title}</div>
            <div className="text-slate-300 mt-0.5 leading-relaxed font-mono">{liveNotification.message}</div>
          </div>
          <button 
            onClick={() => setLiveNotification(null)}
            className="text-slate-400 hover:text-slate-200 text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-glow font-bold text-white">
              CG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-sans tracking-tight gradient-text">CredGen</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  CBCS Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Automated Exam & Academic Credit Engine</p>
            </div>
          </div>

          {/* Right: Quick Switcher, Profile, and Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {currentUser ? (
              <>
                {/* Role Switcher Pill */}
                <div className="relative">
                  <button
                    onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${roleInfo.color} hover:brightness-110`}
                  >
                    <RoleIcon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{roleInfo.label}</span>
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </button>

                  {showRoleDropdown && (
                    <div 
                      className="absolute right-0 mt-2 w-72 glass-panel rounded-xl shadow-2xl p-2 border border-slate-700/80 z-50 animate-in fade-in slide-in-from-top-2"
                      onClick={() => setShowRoleDropdown(false)}
                    >
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Switch Active Role
                      </div>
                      
                      <button
                        onClick={() => {
                          const vivek = users.find(u => u.name === 'Vivek Kumar');
                          if (vivek) switchRole('ADMIN');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left hover:bg-slate-800 text-slate-300"
                      >
                        <Shield className="w-4 h-4 text-rose-400" />
                        <div>
                          <div className="font-semibold">Vivek Kumar (Admin)</div>
                          <div className="text-[10px] text-slate-400">Chief Project Lead</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          const shashank = users.find(u => u.name === 'Banda Shashank');
                          if (shashank) switchRole('ADMIN');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left hover:bg-slate-800 text-slate-300"
                      >
                        <Shield className="w-4 h-4 text-rose-400" />
                        <div>
                          <div className="font-semibold">Banda Shashank (Admin)</div>
                          <div className="text-[10px] text-slate-400">Chief System Architect</div>
                        </div>
                      </button>

                      <button
                        onClick={() => switchRole('TEACHER')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left hover:bg-slate-800 text-slate-300"
                      >
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        <div>
                          <div className="font-semibold">Dr. Vinsha Sumra (Faculty)</div>
                          <div className="text-[10px] text-slate-400">Question Bank & Scoring</div>
                        </div>
                      </button>

                      <button
                        onClick={() => switchRole('STUDENT')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left hover:bg-slate-800 text-slate-300"
                      >
                        <GraduationCap className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="font-semibold">Student Candidate (Rahul)</div>
                          <div className="text-[10px] text-slate-400">Live Exam & Marksheets</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Pill */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                  <UserAvatar user={currentUser} className="w-8 h-8 text-xs font-bold" />
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-semibold text-slate-200 leading-tight">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-400">{currentUser.role === 'ADMIN' ? 'Super Admin' : currentUser.role}</div>
                  </div>
                </div>

                {/* Dedicated Sign Out Button */}
                <button
                  onClick={logoutUser}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
                  title="Sign Out of Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}

          </div>
        </div>
      </header>
    </>
  );
};
