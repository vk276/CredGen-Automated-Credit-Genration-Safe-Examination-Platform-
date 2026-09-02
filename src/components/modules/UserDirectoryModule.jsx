import { UserAvatar } from '../common/UserAvatar';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Shield, BookOpen, GraduationCap, Search, CheckCircle2, UserCheck, Phone, Mail } from 'lucide-react';

export const UserDirectoryModule = () => {
  const { users, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filtered = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          (u.rollNo && u.rollNo.includes(search));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-sans">User Directory & Role Governance</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            RBAC Access Controls: Super Admins, Faculty Examiners, and Student Candidates.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or roll number..."
            className="w-full pl-9 pr-4 py-2 rounded-lg glass-input text-xs"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-lg glass-input text-xs bg-slate-900"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Super Admins</option>
          <option value="TEACHER">Faculty Members</option>
          <option value="STUDENT">Students</option>
        </select>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((user) => (
          <div key={user.id} className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-4">
            <UserAvatar user={user} className="w-10 h-10 text-xs font-bold" />
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-200">{user.name}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  user.role === 'ADMIN' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                  user.role === 'TEACHER' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {user.role}
                </span>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-500" />
                <span>{user.email}</span>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-500" />
                <span>{user.phone}</span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">
                  {user.rollNo ? `Roll: ${user.rollNo}` : user.facultyId ? `Faculty ID: ${user.facultyId}` : 'Institutional Key'}
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
