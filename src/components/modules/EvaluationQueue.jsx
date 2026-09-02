import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileCheck2, 
  CheckCircle2, 
  BookOpen, 
  FileText, 
  Award, 
  Send, 
  AlertCircle,
  Eye,
  Check
} from 'lucide-react';

export const EvaluationQueue = () => {
  const { results, questionBank, submitSubjectiveEvaluation, calculateCBCSGrade, setCurrentView, setSelectedStudentResult } = useApp();

  const [activeResultId, setActiveResultId] = useState(results[0]?.id || null);
  const [rubricScores, setRubricScores] = useState({ criterion_0: 3, criterion_1: 2, criterion_2: 2.5 });
  const [evaluatorRemarks, setEvaluatorRemarks] = useState('Well-structured explanation with clear architectural concepts.');
  const [isGradedSuccess, setIsGradedSuccess] = useState(false);

  const selectedResult = results.find(r => r.id === activeResultId) || results[0];

  const handleScoreChange = (key, val) => {
    setRubricScores(prev => ({
      ...prev,
      [key]: parseFloat(val) || 0
    }));
  };

  const handlePublishGrade = () => {
    if (!selectedResult) return;
    const totalSubjectiveAwarded = Object.values(rubricScores).reduce((a, b) => a + b, 0);
    submitSubjectiveEvaluation(selectedResult.id, totalSubjectiveAwarded, evaluatorRemarks);
    setIsGradedSuccess(true);
    setTimeout(() => {
      setIsGradedSuccess(false);
      setSelectedStudentResult(selectedResult);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-sans">Subjective & Practical Evaluation Portal</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Rubric-Guided Assessment
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate descriptive answers against stored model answers and rubric criteria with automated CBCS grade reconciliation.
          </p>
        </div>
      </div>

      {/* Main Layout: Submissions List (Left) + Grading Interface (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Submissions Queue */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Student Submissions Queue ({results.length})
          </h3>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {results.map((res) => {
              const isSelected = res.id === activeResultId;
              return (
                <div
                  key={res.id}
                  onClick={() => setActiveResultId(res.id)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-slate-200 shadow-glow' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{res.studentName}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      res.evaluationStatus === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {res.evaluationStatus === 'COMPLETED' ? 'Graded' : 'Pending'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Roll No: {res.rollNo}</div>
                  <div className="text-[11px] text-indigo-300 font-medium mt-1">{res.examTitle}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Rubric Assessment Workspace */}
        {selectedResult && (
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            
            {/* Student & Exam Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400">Blinded Evaluation Workspace</span>
                <h2 className="text-base font-bold text-slate-100">{selectedResult.studentName} ({selectedResult.rollNo})</h2>
                <p className="text-xs text-slate-400">{selectedResult.examTitle} • {selectedResult.courseCode}</p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Current Objective Marks:</span>
                <div className="text-sm font-bold text-emerald-400">{selectedResult.rawMarksObtained} / {selectedResult.totalMaximumMarks}</div>
              </div>
            </div>

            {/* Subjective Answer vs Model Answer */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" /> Student's Submitted Answer
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Q3: B+ Tree Architecture</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  "A B+ Tree stores actual key data exclusively in leaf nodes while internal index nodes only route search paths. Leaf nodes are chained sequentially with pointers, allowing fast range queries compared to standard B-Trees which require hierarchical backtracking."
                </p>
              </div>

              {/* Rubric Evaluation Form */}
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Rubric Criteria Scoring Breakdown
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                    <span className="text-slate-300">1. Architecture & structural concepts (Max 3 M)</span>
                    <input
                      type="number"
                      step="0.5"
                      max="3"
                      min="0"
                      value={rubricScores.criterion_0}
                      onChange={(e) => handleScoreChange('criterion_0', e.target.value)}
                      className="w-20 p-1.5 rounded-lg glass-input text-xs text-right font-bold text-emerald-400"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                    <span className="text-slate-300">2. Leaf node chaining & pointers (Max 2 M)</span>
                    <input
                      type="number"
                      step="0.5"
                      max="2"
                      min="0"
                      value={rubricScores.criterion_1}
                      onChange={(e) => handleScoreChange('criterion_1', e.target.value)}
                      className="w-20 p-1.5 rounded-lg glass-input text-xs text-right font-bold text-emerald-400"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                    <span className="text-slate-300">3. Range-query comparative analysis (Max 3 M)</span>
                    <input
                      type="number"
                      step="0.5"
                      max="3"
                      min="0"
                      value={rubricScores.criterion_2}
                      onChange={(e) => handleScoreChange('criterion_2', e.target.value)}
                      className="w-20 p-1.5 rounded-lg glass-input text-xs text-right font-bold text-emerald-400"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Examiner Feedback / Qualitative Remarks</label>
                  <input
                    type="text"
                    value={evaluatorRemarks}
                    onChange={(e) => setEvaluatorRemarks(e.target.value)}
                    className="w-full p-2.5 rounded-lg glass-input text-xs"
                    placeholder="Enter academic feedback for the student..."
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                Total Subjective Awarded: <span className="font-bold text-emerald-400 text-sm">
                  {Object.values(rubricScores).reduce((a, b) => a + b, 0)} / 8 Marks
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedStudentResult(selectedResult);
                    setCurrentView('student_results');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> View Grade Card
                </button>

                <button
                  onClick={handlePublishGrade}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-glow-emerald transition-all flex items-center gap-1.5"
                >
                  {isGradedSuccess ? <Check className="w-4 h-4 text-white" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{isGradedSuccess ? 'Grade Published!' : 'Publish Final CBCS Score'}</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
