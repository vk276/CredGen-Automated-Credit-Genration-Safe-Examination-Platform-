import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Database, 
  BookOpen, 
  Layers, 
  Tag, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  HelpCircle,
  X,
  FileText,
  Sliders
} from 'lucide-react';

export const QuestionBankModule = () => {
  const { questionBank, addQuestion, deleteQuestion, courses, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Question Form State
  const [formData, setFormData] = useState({
    courseId: 'CS-302',
    courseName: 'Database Management Systems',
    unit: 'Unit 1: Fundamentals',
    topic: 'Relational Model',
    type: 'MCQ',
    difficulty: 'Medium',
    bloomLevel: 'Understanding',
    marks: 2,
    negativeMarks: 0.5,
    questionText: '',
    options: [
      { id: 'opt_1', text: '' },
      { id: 'opt_2', text: '' },
      { id: 'opt_3', text: '' },
      { id: 'opt_4', text: '' }
    ],
    correctOptionId: 'opt_1',
    explanation: '',
    modelAnswer: '',
    rubric: [
      { criterion: 'Theoretical Definition & Concept', maxMarks: 2 },
      { criterion: 'Examples / Diagrammatic Representation', maxMarks: 2 }
    ]
  });

  const filteredQuestions = questionBank.filter(q => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse === 'ALL' || q.courseId === selectedCourse;
    const matchesType = selectedType === 'ALL' || q.type === selectedType;
    const matchesDiff = selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesCourse && matchesType && matchesDiff;
  });

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index].text = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleRubricChange = (index, field, value) => {
    const newRubric = [...formData.rubric];
    newRubric[index][field] = field === 'maxMarks' ? parseFloat(value) || 0 : value;
    setFormData({ ...formData, rubric: newRubric });
  };

  const addRubricCriterion = () => {
    setFormData({
      ...formData,
      rubric: [...formData.rubric, { criterion: '', maxMarks: 2 }]
    });
  };

  const removeRubricCriterion = (index) => {
    setFormData({
      ...formData,
      rubric: formData.rubric.filter((_, idx) => idx !== index)
    });
  };

  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    if (!formData.questionText) return;

    const courseObj = courses.find(c => c.id === formData.courseId);

    addQuestion({
      ...formData,
      courseName: courseObj ? courseObj.name : formData.courseName,
      marks: parseFloat(formData.marks) || 2,
      negativeMarks: parseFloat(formData.negativeMarks) || 0
    });

    setIsModalOpen(false);
    // Reset form
    setFormData({
      courseId: 'CS-302',
      courseName: 'Database Management Systems',
      unit: 'Unit 1: Fundamentals',
      topic: 'Relational Model',
      type: 'MCQ',
      difficulty: 'Medium',
      bloomLevel: 'Understanding',
      marks: 2,
      negativeMarks: 0.5,
      questionText: '',
      options: [
        { id: 'opt_1', text: '' },
        { id: 'opt_2', text: '' },
        { id: 'opt_3', text: '' },
        { id: 'opt_4', text: '' }
      ],
      correctOptionId: 'opt_1',
      explanation: '',
      modelAnswer: '',
      rubric: [{ criterion: 'Core Concept', maxMarks: 2 }]
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-sans">Centralized Question Bank</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {questionBank.length} Questions
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Categorize and author reusable objective & subjective assessment items with multi-level taxonomies.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keyword, topic, or concept..."
            className="w-full pl-9 pr-4 py-2 rounded-lg glass-input text-xs"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 rounded-lg glass-input text-xs bg-slate-900"
          >
            <option value="ALL">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-lg glass-input text-xs bg-slate-900"
          >
            <option value="ALL">All Question Types</option>
            <option value="MCQ">MCQ (Single Choice)</option>
            <option value="LONG_SUBJECTIVE">Long Subjective (Rubric)</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="PRACTICAL">Practical / Code</option>
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-lg glass-input text-xs bg-slate-900"
          >
            <option value="ALL">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

        </div>
      </div>

      {/* Questions Listing */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-panel border border-dashed border-slate-800">
            <Database className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No questions found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or add a new question.</p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div key={q.id} className="p-4 rounded-xl glass-card border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              
              {/* Question Meta Tags */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {q.courseId}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {q.unit} • {q.topic}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    q.difficulty === 'Hard' ? 'bg-rose-500/20 text-rose-300' :
                    q.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {q.difficulty}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {q.bloomLevel}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-emerald-400">+{q.marks} Marks</span>
                  {q.negativeMarks > 0 && (
                    <span className="text-xs font-semibold text-rose-400">-{q.negativeMarks} Neg.</span>
                  )}
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-sm font-medium text-slate-200">
                <span className="text-brand-400 font-mono mr-2">Q{idx + 1}.</span>
                {q.questionText}
              </div>

              {/* MCQ Options Rendering */}
              {q.type === 'MCQ' && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt) => (
                    <div 
                      key={opt.id}
                      className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                        opt.id === q.correctOptionId 
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40 font-medium'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800'
                      }`}
                    >
                      {opt.id === q.correctOptionId ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0 inline-block" />
                      )}
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Subjective Rubric Display */}
              {(q.type === 'LONG_SUBJECTIVE' || q.type === 'SHORT_ANSWER') && q.rubric && (
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                  <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" /> Evaluation Rubric Breakdown
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.rubric.map((rub, rIdx) => (
                      <div key={rIdx} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px]">
                        <span className="text-slate-400">{rub.criterion}</span>
                        <span className="font-semibold text-brand-400">{rub.maxMarks} M</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* Add Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] glass-panel rounded-2xl p-6 shadow-2xl border border-slate-700/80 overflow-y-auto">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-100">Add Question to Central Bank</h2>
              <p className="text-xs text-slate-400">Configure question details, taxonomic metadata, and scoring rules</p>
            </div>

            <form onSubmit={handleSubmitQuestion} className="space-y-4">
              
              {/* Course & Taxonomies */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Course</label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full p-2 rounded-lg glass-input text-xs bg-slate-900"
                  >
                    {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-2 rounded-lg glass-input text-xs"
                    placeholder="Unit 1: Fundamentals"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Topic</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full p-2 rounded-lg glass-input text-xs"
                    placeholder="e.g. B+ Tree"
                  />
                </div>
              </div>

              {/* Question Type & Marks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2 rounded-lg glass-input text-xs bg-slate-900"
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="LONG_SUBJECTIVE">Long Subjective</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="PRACTICAL">Practical Test</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full p-2 rounded-lg glass-input text-xs bg-slate-900"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Marks (+)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                    className="w-full p-2 rounded-lg glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Negative (-)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.negativeMarks}
                    onChange={(e) => setFormData({ ...formData, negativeMarks: e.target.value })}
                    className="w-full p-2 rounded-lg glass-input text-xs"
                  />
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Question Content / Problem Statement</label>
                <textarea
                  required
                  rows={3}
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  placeholder="Enter the full question text here..."
                  className="w-full p-3 rounded-xl glass-input text-xs"
                />
              </div>

              {/* If MCQ: Options Builder */}
              {formData.type === 'MCQ' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">Answer Options & Correct Key</label>
                  {formData.options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={formData.correctOptionId === opt.id}
                        onChange={() => setFormData({ ...formData, correctOptionId: opt.id })}
                        className="text-brand-600 focus:ring-brand-500"
                        title="Mark as correct answer"
                      />
                      <input
                        type="text"
                        required
                        placeholder={`Option ${idx + 1}`}
                        value={opt.text}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        className="flex-1 p-2 rounded-lg glass-input text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* If Subjective: Rubric Builder */}
              {(formData.type === 'LONG_SUBJECTIVE' || formData.type === 'SHORT_ANSWER') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">Rubric Scoring Criteria</label>
                    <button
                      type="button"
                      onClick={addRubricCriterion}
                      className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
                    >
                      + Add Criterion
                    </button>
                  </div>
                  {formData.rubric.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Evaluation criterion (e.g. Algorithm flow)"
                        value={r.criterion}
                        onChange={(e) => handleRubricChange(idx, 'criterion', e.target.value)}
                        className="flex-1 p-2 rounded-lg glass-input text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Marks"
                        value={r.maxMarks}
                        onChange={(e) => handleRubricChange(idx, 'maxMarks', e.target.value)}
                        className="w-20 p-2 rounded-lg glass-input text-xs"
                      />
                      {formData.rubric.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRubricCriterion(idx)}
                          className="p-2 text-rose-400 hover:bg-slate-800 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-bold shadow-glow"
                >
                  Save Question
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
