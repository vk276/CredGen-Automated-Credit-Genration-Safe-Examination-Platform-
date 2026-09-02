import React from 'react';
import { useApp } from '../../context/AppContext';
import { Award, CheckCircle2, Sliders, Shield, BookOpen, Layers } from 'lucide-react';

export const CBCSRulesConfig = () => {
  const { gradeRules } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-sans">UGC CBCS Credit Policy Engine</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active Institutional Policy
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standard UGC 10-Point Choice Based Credit System grading bands for automated SGPA/CGPA evaluation.
          </p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Award className="w-4 h-4 text-brand-400" /> Letter Grade & Grade Point Conversion Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300 border-y border-slate-700 font-semibold">
                <th className="py-3 px-4">Letter Grade</th>
                <th className="py-3 px-4">Qualitative Description</th>
                <th className="py-3 px-4 text-center">Score Range (%)</th>
                <th className="py-3 px-4 text-center">Grade Point (G)</th>
                <th className="py-3 px-4 text-right">Credit Multiplication Formula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {gradeRules.map((rule, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-sm">{rule.letterGrade}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-200">{rule.description}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                    {rule.minPercentage}% — {rule.maxPercentage}%
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400 text-sm">
                    {rule.gradePoint}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                    Credits (C) × {rule.gradePoint}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SGPA & CGPA Academic Formula Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
            Semester Grade Point Average (SGPA) Formula
          </h4>
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-emerald-400 text-center">
            SGPA (Si) = ∑ (Ci × Gi) / ∑ Ci
          </div>
          <p className="text-[11px] text-slate-400">
            Where <strong>Ci</strong> is the number of course credits and <strong>Gi</strong> is the grade point secured in the i-th course.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider">
            Cumulative Grade Point Average (CGPA) Formula
          </h4>
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-amber-400 text-center">
            CGPA = ∑ (Cj × Sj) / ∑ Cj
          </div>
          <p className="text-[11px] text-slate-400">
            Where <strong>Sj</strong> is the SGPA of the j-th semester and <strong>Cj</strong> is the total credits in that semester.
          </p>
        </div>

      </div>

    </div>
  );
};
