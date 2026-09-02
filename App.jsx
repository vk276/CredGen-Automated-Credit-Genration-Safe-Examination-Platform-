import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { AuthModal } from './components/auth/AuthModal';
import { DashboardWrapper } from './components/dashboard/DashboardWrapper';
import { QuestionBankModule } from './components/modules/QuestionBankModule';
import { ExamCreatorWizard } from './components/modules/ExamCreatorWizard';
import { LiveExamRoom } from './components/modules/LiveExamRoom';
import { EvaluationQueue } from './components/modules/EvaluationQueue';
import { MarksheetGenerator } from './components/modules/MarksheetGenerator';
import { CBCSRulesConfig } from './components/modules/CBCSRulesConfig';
import { UserDirectoryModule } from './components/modules/UserDirectoryModule';
import { AnalyticsDashboard } from './components/modules/AnalyticsDashboard';

export function App() {
  const { currentView } = useApp();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardWrapper />;
      case 'question_bank':
        return <QuestionBankModule />;
      case 'exam_creator':
        return <ExamCreatorWizard />;
      case 'student_live_exam':
        return <LiveExamRoom />;
      case 'eval_queue':
        return <EvaluationQueue />;
      case 'student_results':
      case 'marksheets':
        return <MarksheetGenerator />;
      case 'cbcs_rules':
        return <CBCSRulesConfig />;
      case 'users_mgmt':
        return <UserDirectoryModule />;
      case 'analytics':
      case 'student_analytics':
        return <AnalyticsDashboard />;
      case 'student_exams':
      case 'exams_all':
      case 'dept_mgmt':
      default:
        return <DashboardWrapper />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500/30 selection:text-brand-200">
      
      {/* Top Navbar */}
      <Navbar onOpenAuth={() => setIsAuthOpen(true)} />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Left Role-Based Sidebar */}
        <Sidebar />

        {/* Center Main Stage Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-5xl">
          {renderActiveView()}
        </main>

      </div>

      {/* Authentication / Registration Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

    </div>
  );
}

export default App;
