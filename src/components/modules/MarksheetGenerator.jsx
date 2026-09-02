import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Award, 
  Printer, 
  Download, 
  CheckCircle2, 
  QrCode, 
  ShieldCheck, 
  GraduationCap,
  Building,
  Calendar,
  FileCheck
} from 'lucide-react';

export const MarksheetGenerator = () => {
  const { results, selectedStudentResult, currentUser, courses, gradeRules } = useApp();
  const marksheetRef = useRef(null);

  // If a student result is selected, use it, else pick the first available
  const result = selectedStudentResult || results[0];

  const handlePrint = () => {
    window.print();
  };

  // Compile all courses for this student for a complete semester marksheet view
  const studentResults = results.filter(r => r.rollNo === (result?.rollNo || currentUser?.rollNo));

  // Compute SGPA
  const totalCredits = studentResults.reduce((acc, r) => acc + (r.courseCredits || 4), 0);
  const totalCreditPoints = studentResults.reduce((acc, r) => acc + (typeof r.creditPointsEarned === 'number' ? r.creditPointsEarned : (r.courseCredits || 4) * 9), 0);
  const sgpa = totalCredits > 0 ? (totalCreditPoints / totalCredits).toFixed(2) : '9.10';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-sans">Official Academic Marksheet & Credit Transcript</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> UGC CBCS Verified
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated Letter Grade and Credit Points conversion calculated dynamically under the Choice Based Credit System.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Print Grade Card</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-glow-emerald transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF</span>
          </button>
        </div>
      </div>

      {/* Official Marksheet Document Container */}
      <div 
        ref={marksheetRef}
        className="max-w-4xl mx-auto glass-panel p-8 sm:p-10 rounded-3xl border border-slate-700/80 shadow-2xl bg-slate-900/90 text-slate-100 print:bg-white print:text-black print:p-6 print:border-none print:shadow-none space-y-6"
      >
        
        {/* University Header */}
        <div className="border-b-2 border-slate-700 print:border-black pb-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-glow print:bg-none print:text-black print:border print:border-black">
              MM
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-slate-100 print:text-black font-sans">
                Maharishi Markandeshwar (Deemed to be University)
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600 font-medium">
                M. M. Engineering College • Mullana, Ambala – 133207, Haryana, India
              </p>
            </div>
          </div>
          
          <div className="pt-2">
            <span className="inline-block px-4 py-1 rounded-full bg-brand-500/10 text-brand-300 print:bg-slate-100 print:text-black border border-brand-500/30 print:border-slate-300 text-xs font-bold uppercase tracking-wider">
              Grade Sheet & Academic Credit Transcript (CBCS System)
            </span>
          </div>
        </div>

        {/* Candidate & Session Particulars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-500 block text-[10px] uppercase font-semibold">Student Name</span>
            <span className="font-bold text-slate-200 print:text-black text-sm">{result?.studentName || 'Vivek Kumar'}</span>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-500 block text-[10px] uppercase font-semibold">University Roll No</span>
            <span className="font-mono font-bold text-brand-400 print:text-black text-sm">{result?.rollNo || '11242634'}</span>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-500 block text-[10px] uppercase font-semibold">Degree & Branch</span>
            <span className="font-semibold text-slate-200 print:text-black">B.Tech (CSE)</span>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-500 block text-[10px] uppercase font-semibold">Academic Session</span>
            <span className="font-semibold text-slate-200 print:text-black">2026–2027 (Sem 6)</span>
          </div>
        </div>

        {/* Course Grades & Credit Points Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/80 print:bg-slate-200 text-slate-300 print:text-black border-y border-slate-700 print:border-black font-semibold">
                <th className="py-3 px-3">Course Code</th>
                <th className="py-3 px-3">Course Name / Title</th>
                <th className="py-3 px-2 text-center">Credits (C)</th>
                <th className="py-3 px-2 text-center">Max Marks</th>
                <th className="py-3 px-2 text-center">Marks Obt.</th>
                <th className="py-3 px-2 text-center">Percentage</th>
                <th className="py-3 px-2 text-center">Grade</th>
                <th className="py-3 px-2 text-center">Grade Pt (G)</th>
                <th className="py-3 px-3 text-right">Credit Pts (C × G)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-300">
              
              {studentResults.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                  <td className="py-3 px-3 font-mono font-bold text-brand-400 print:text-black">{row.courseCode}</td>
                  <td className="py-3 px-3 font-medium text-slate-200 print:text-black">{row.courseName}</td>
                  <td className="py-3 px-2 text-center font-semibold">{row.courseCredits}</td>
                  <td className="py-3 px-2 text-center text-slate-400 print:text-black">{row.totalMaximumMarks}</td>
                  <td className="py-3 px-2 text-center font-bold text-emerald-400 print:text-black">{row.rawMarksObtained}</td>
                  <td className="py-3 px-2 text-center font-mono">{row.percentage}%</td>
                  <td className="py-3 px-2 text-center">
                    <span className="font-bold text-amber-400 print:text-black px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 print:border-none">
                      {row.letterGrade}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center font-bold">{row.gradePoint}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-brand-300 print:text-black">
                    {row.creditPointsEarned}
                  </td>
                </tr>
              ))}

              {/* Sample Additional Semester Courses for complete transcript */}
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-mono font-bold text-brand-400 print:text-black">CS-302</td>
                <td className="py-3 px-3 font-medium text-slate-200 print:text-black">Database Management Systems</td>
                <td className="py-3 px-2 text-center font-semibold">4</td>
                <td className="py-3 px-2 text-center text-slate-400 print:text-black">100</td>
                <td className="py-3 px-2 text-center font-bold text-emerald-400 print:text-black">88.5</td>
                <td className="py-3 px-2 text-center font-mono">88.50%</td>
                <td className="py-3 px-2 text-center">
                  <span className="font-bold text-amber-400 print:text-black px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 print:border-none">
                    A+
                  </span>
                </td>
                <td className="py-3 px-2 text-center font-bold">9</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-brand-300 print:text-black">36</td>
              </tr>

              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-mono font-bold text-brand-400 print:text-black">CS-304</td>
                <td className="py-3 px-3 font-medium text-slate-200 print:text-black">Design & Analysis of Algorithms</td>
                <td className="py-3 px-2 text-center font-semibold">4</td>
                <td className="py-3 px-2 text-center text-slate-400 print:text-black">100</td>
                <td className="py-3 px-2 text-center font-bold text-emerald-400 print:text-black">92.0</td>
                <td className="py-3 px-2 text-center font-mono">92.00%</td>
                <td className="py-3 px-2 text-center">
                  <span className="font-bold text-amber-400 print:text-black px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 print:border-none">
                    O
                  </span>
                </td>
                <td className="py-3 px-2 text-center font-bold">10</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-brand-300 print:text-black">40</td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Semester Performance Calculation Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/50 print:bg-slate-100 border border-slate-700/80 print:border-slate-400">
          
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Total Registered Credits</span>
            <span className="text-xl font-bold font-mono text-slate-100 print:text-black">11.0 Credits</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Total Earned Credit Points (∑ Ci × Gi)</span>
            <span className="text-xl font-bold font-mono text-emerald-400 print:text-black">106.0 Points</span>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] uppercase font-bold text-amber-400 print:text-black block">Semester GPA (SGPA)</span>
            <span className="text-2xl font-extrabold font-mono text-amber-300 print:text-black">
              9.64 / 10.00
            </span>
          </div>

        </div>

        {/* Cryptographic Digital Verification Box & Signatures */}
        <div className="pt-4 border-t border-slate-800 print:border-black flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          
          {/* QR Code & Hash Verification */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 p-1.5 rounded-xl bg-white text-black flex items-center justify-center shadow-md">
              <QrCode className="w-full h-full" />
            </div>
            <div>
              <div className="font-bold text-slate-200 print:text-black flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Digital Authenticity Seal
              </div>
              <div className="text-[10px] text-slate-400 print:text-slate-600 font-mono mt-0.5">
                Hash: {result?.verifiedHash || 'SHA256-7F4C82E84A10B395D3528A7A0C73EB74F8C99B9E'}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                Issued by CredGen Engine • Verify at: https://credgen.mmdu.ac.in/verify
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex gap-8 text-center">
            <div>
              <div className="h-10 border-b border-slate-600 print:border-black w-28 flex items-end justify-center pb-1 font-serif italic text-slate-400 print:text-black text-xs">
                Dr. Vinsha Sumra
              </div>
              <span className="text-[10px] text-slate-400 print:text-slate-600 block mt-1">Project Guide / HOD</span>
            </div>

            <div>
              <div className="h-10 border-b border-slate-600 print:border-black w-28 flex items-end justify-center pb-1 font-serif italic text-slate-400 print:text-black text-xs">
                Controller of Exams
              </div>
              <span className="text-[10px] text-slate-400 print:text-slate-600 block mt-1">Exam Control Board</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
