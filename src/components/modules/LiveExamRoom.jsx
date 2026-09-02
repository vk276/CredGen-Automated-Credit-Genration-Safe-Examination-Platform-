import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import { 
  Clock, 
  CheckCircle2, 
  Flag, 
  RotateCcw, 
  Send, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft,
  GraduationCap,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export const LiveExamRoom = () => {
  const { exams, questionBank, selectedExamId, submitExamAttempt, setCurrentView, setSelectedStudentResult } = useApp();

  // Find active exam (or first live exam)
  const activeExam = exams.find(e => e.id === selectedExamId) || exams.find(e => e.status === 'LIVE') || exams[0];
  const examQuestions = questionBank.filter(q => activeExam?.questionIds?.includes(q.id));

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [reviewFlags, setReviewFlags] = useState({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState((activeExam?.durationMinutes || 45) * 60);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Countdown timer
  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(); // Auto-submit on time expiry
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  const currentQ = examQuestions[currentQIndex] || examQuestions[0];

  const handleSelectOption = (qId, optionId) => {
    setResponses(prev => ({
      ...prev,
      [qId]: optionId
    }));
  };

  const handleTextAnswer = (qId, text) => {
    setResponses(prev => ({
      ...prev,
      [qId]: text
    }));
  };

  const toggleReviewFlag = (qId) => {
    setReviewFlags(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const clearCurrentResponse = (qId) => {
    setResponses(prev => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  const handleFinalSubmit = () => {
    const result = submitExamAttempt(activeExam.id, responses);
    setSubmissionResult(result);
    setIsSubmitted(true);
    setIsSubmitModalOpen(false);

    // Trigger celebration confetti
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Attempt metrics
  const answeredCount = Object.keys(responses).length;
  const flaggedCount = Object.values(reviewFlags).filter(Boolean).length;
  const unansweredCount = examQuestions.length - answeredCount;

  if (isSubmitted && submissionResult) {
    return (
      <div className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl border border-emerald-500/30 text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-glow-emerald">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-100">Examination Submitted Successfully!</h2>
          <p className="text-xs text-slate-400 mt-1">
            Your responses for <span className="text-slate-200 font-semibold">{activeExam.title}</span> have been captured and verified.
          </p>
        </div>

        {/* Quick Result Summary */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left space-y-3">
          <div className="flex justify-between text-xs border-b border-slate-800 pb-2">
            <span className="text-slate-400">Student Roll No:</span>
            <span className="font-mono font-bold text-slate-200">{submissionResult.rollNo}</span>
          </div>
          <div className="flex justify-between text-xs border-b border-slate-800 pb-2">
            <span className="text-slate-400">Objective Score Calculated:</span>
            <span className="font-bold text-emerald-400">{submissionResult.rawMarksObtained} / {submissionResult.totalMaximumMarks} Marks</span>
          </div>
          <div className="flex justify-between text-xs border-b border-slate-800 pb-2">
            <span className="text-slate-400">Letter Grade:</span>
            <span className="font-bold text-amber-400 font-mono text-sm">{submissionResult.letterGrade}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Cryptographic Verification Hash:</span>
            <span className="font-mono text-[10px] text-brand-300">{submissionResult.verifiedHash}</span>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              setSelectedStudentResult(submissionResult);
              setCurrentView('student_results');
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-glow-emerald"
          >
            Open Official CBCS Marksheet
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Top Test Navigation Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-400">{activeExam.courseId}</span>
            <h1 className="text-sm sm:text-base font-bold text-slate-100">{activeExam.title}</h1>
          </div>
          <p className="text-[11px] text-slate-400">
            Total Marks: {activeExam.totalMarks} • Passing: {activeExam.passingMarks} • {activeExam.negativeMarking ? 'Negative Marking Active (-25%)' : 'No Negative'}
          </p>
        </div>

        {/* Live Timer Pill */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-sm font-bold ${
            timeLeftSeconds < 300 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-emerald transition-all flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Submit Exam
          </button>
        </div>
      </div>

      {/* Main Examination Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Left: Active Question Answering Pane (3 Cols) */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between min-h-[480px]">
          
          <div className="space-y-4">
            
            {/* Question Header & Controls */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
                  Question {currentQIndex + 1} of {examQuestions.length}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {currentQ?.type}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  +{currentQ?.marks} Marks
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleReviewFlag(currentQ?.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                    reviewFlags[currentQ?.id] 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                      : 'text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{reviewFlags[currentQ?.id] ? 'Flagged for Review' : 'Mark for Review'}</span>
                </button>

                <button
                  onClick={() => clearCurrentResponse(currentQ?.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Clear Answer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Question Problem Statement */}
            <div className="text-sm font-medium text-slate-100 leading-relaxed">
              {currentQ?.questionText}
            </div>

            {/* Answer Interface */}
            {currentQ?.type === 'MCQ' && currentQ?.options && (
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = responses[currentQ.id] === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQ.id, opt.id)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-brand-600/20 border-brand-500 text-white ring-1 ring-brand-500/30' 
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[10px] ${
                        isSelected ? 'bg-brand-600 border-brand-500 text-white' : 'border-slate-600 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="font-medium">{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {(currentQ?.type === 'LONG_SUBJECTIVE' || currentQ?.type === 'SHORT_ANSWER' || currentQ?.type === 'PRACTICAL') && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs text-slate-400">Enter your comprehensive written answer / code solution:</label>
                <textarea
                  rows={8}
                  value={responses[currentQ?.id] || ''}
                  onChange={(e) => handleTextAnswer(currentQ?.id, e.target.value)}
                  placeholder="Type your explanation, proofs, or code implementation here..."
                  className="w-full p-3.5 rounded-xl glass-input text-xs font-mono"
                />
              </div>
            )}

          </div>

          {/* Bottom Pagination Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800/80">
            <button
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex(currentQIndex - 1)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 disabled:opacity-30 flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Previous Question
            </button>

            <span className="text-[11px] text-slate-500">
              Auto-saved locally
            </span>

            {currentQIndex < examQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentQIndex(currentQIndex + 1)}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow flex items-center gap-2"
              >
                Next Question <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-emerald flex items-center gap-2"
              >
                Submit Paper <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Right: Question Navigation Palette (1 Col) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Question Palette
            </h3>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Answered ({answeredCount})
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Flagged ({flaggedCount})
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" /> Unanswered ({unansweredCount})
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-brand-500" /> Current
              </div>
            </div>

            {/* Grid Palette */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {examQuestions.map((q, idx) => {
                const isAnswered = !!responses[q.id];
                const isFlagged = !!reviewFlags[q.id];
                const isCurrent = currentQIndex === idx;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-9 rounded-lg font-mono font-bold text-xs transition-all flex items-center justify-center relative ${
                      isCurrent 
                        ? 'bg-brand-600 text-white ring-2 ring-brand-400'
                        : isFlagged
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Review Summary & Submit
          </button>

        </div>

      </div>

      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Ready to Submit Examination?</h3>
                <p className="text-xs text-slate-400">Once submitted, answers cannot be altered.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div>
                <div className="font-bold text-emerald-400 text-lg">{answeredCount}</div>
                <div className="text-[10px] text-slate-400">Answered</div>
              </div>
              <div>
                <div className="font-bold text-amber-400 text-lg">{flaggedCount}</div>
                <div className="text-[10px] text-slate-400">Flagged</div>
              </div>
              <div>
                <div className="font-bold text-slate-400 text-lg">{unansweredCount}</div>
                <div className="text-[10px] text-slate-400">Unanswered</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Return to Test
              </button>
              <button
                onClick={handleFinalSubmit}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-emerald"
              >
                Confirm & Submit
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
