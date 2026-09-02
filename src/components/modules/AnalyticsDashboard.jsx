import React from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, TrendingUp, Award, Users, CheckCircle2, AlertCircle, PieChart } from 'lucide-react';

export const AnalyticsDashboard = () => {
  const { results, exams, questionBank } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-sans">Institutional Examination Analytics</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Live Metrics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Performance histograms, CBCS grade distribution, and Item Discrimination indices.
          </p>
        </div>
      </div>

      {/* Top Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Overall Passing Percentage</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">94.2%</div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94.2%' }} />
          </div>
          <p className="text-[11px] text-slate-500">Above target benchmark of 85.0%</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Average Class SGPA</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono">8.72 / 10</div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '87.2%' }} />
          </div>
          <p className="text-[11px] text-slate-500">Normalized across 4 semester courses</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Evaluated Submissions</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100 font-mono">{results.length} Papers</div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
          <p className="text-[11px] text-slate-500">100% automated & manual reconciled</p>
        </div>

      </div>

      {/* Grade Distribution Histogram */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-400" /> CBCS Letter Grade Bell Curve Distribution
        </h3>

        <div className="grid grid-cols-8 gap-2 items-end h-48 pt-6 pb-2 px-2 bg-slate-950/60 rounded-xl border border-slate-800">
          
          {[
            { grade: 'O', count: 18, height: '75%', color: 'from-amber-400 to-amber-600' },
            { grade: 'A+', count: 24, height: '95%', color: 'from-emerald-400 to-teal-600' },
            { grade: 'A', count: 20, height: '80%', color: 'from-indigo-400 to-brand-600' },
            { grade: 'B+', count: 14, height: '55%', color: 'from-blue-400 to-blue-600' },
            { grade: 'B', count: 8, height: '35%', color: 'from-cyan-400 to-cyan-600' },
            { grade: 'C', count: 4, height: '20%', color: 'from-yellow-400 to-yellow-600' },
            { grade: 'P', count: 2, height: '12%', color: 'from-orange-400 to-orange-600' },
            { grade: 'F', count: 1, height: '6%', color: 'from-rose-500 to-rose-700' }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-[10px] font-bold text-slate-300 font-mono">{item.count}</span>
              <div
                className={`w-full max-w-[36px] rounded-t-lg bg-gradient-to-t ${item.color} shadow-glow transition-all hover:brightness-125`}
                style={{ height: item.height }}
              />
              <span className="text-xs font-bold text-slate-400 font-mono">{item.grade}</span>
            </div>
          ))}

        </div>
      </div>

    </div>
  );
};
