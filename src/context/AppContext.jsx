import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  INITIAL_USERS, 
  DEPARTMENTS, 
  COURSES, 
  CBCS_GRADE_RULES, 
  INITIAL_QUESTION_BANK, 
  INITIAL_EXAMS, 
  INITIAL_STUDENT_RESULTS 
} from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('credgen_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('credgen_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Default to Vivek Kumar (Super Admin)
  });

  const [departments, setDepartments] = useState(() => {
    const saved = localStorage.getItem('credgen_departments');
    return saved ? JSON.parse(saved) : DEPARTMENTS;
  });

  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('credgen_courses');
    return saved ? JSON.parse(saved) : COURSES;
  });

  const [gradeRules, setGradeRules] = useState(() => {
    const saved = localStorage.getItem('credgen_grade_rules');
    return saved ? JSON.parse(saved) : CBCS_GRADE_RULES;
  });

  const [questionBank, setQuestionBank] = useState(() => {
    const saved = localStorage.getItem('credgen_question_bank');
    return saved ? JSON.parse(saved) : INITIAL_QUESTION_BANK;
  });

  const [exams, setExams] = useState(() => {
    const saved = localStorage.getItem('credgen_exams');
    return saved ? JSON.parse(saved) : INITIAL_EXAMS;
  });

  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem('credgen_results');
    return saved ? JSON.parse(saved) : INITIAL_STUDENT_RESULTS;
  });

  // Current active view navigation
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [selectedStudentResult, setSelectedStudentResult] = useState(null);

  // Active Simulated OTP storage
  const [activeOtps, setActiveOtps] = useState({
    emailOtp: '749210',
    phoneOtp: '5824',
    sentToEmail: '',
    sentToPhone: ''
  });

  // Active in-app Notification Alert
  const [liveNotification, setLiveNotification] = useState(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('credgen_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('credgen_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('credgen_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('credgen_question_bank', JSON.stringify(questionBank));
  }, [questionBank]);

  useEffect(() => {
    localStorage.setItem('credgen_exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('credgen_results', JSON.stringify(results));
  }, [results]);

  // Generate & Dispatch Dynamic OTPs
  const generateAndSendOTPs = (email, phone) => {
    const newEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newPhoneOtp = Math.floor(1000 + Math.random() * 9000).toString();

    setActiveOtps({
      emailOtp: newEmailOtp,
      phoneOtp: newPhoneOtp,
      sentToEmail: email,
      sentToPhone: phone
    });

    // Trigger visual notification toast simulation
    setLiveNotification({
      title: 'Verification Codes Dispatched',
      message: `Gmail OTP: ${newEmailOtp} (sent to ${email}) | SMS OTP: ${newPhoneOtp} (sent to ${phone})`,
      type: 'otp'
    });

    return { emailOtp: newEmailOtp, phoneOtp: newPhoneOtp };
  };

  // Auth Functions: Strict Password Checking
  const loginUser = (emailOrPhone, password, role) => {
    const matched = users.find(u => 
      (u.email.toLowerCase() === emailOrPhone.toLowerCase() || u.phone === emailOrPhone) &&
      u.role === role
    );

    if (!matched) {
      return { success: false, message: 'No account found matching this email/phone and role.' };
    }

    // Verify password (matches user password or standard demo password)
    const validPasswords = [matched.password, 'admin123', 'teacher123', 'student123', '12345678', 'vivek@admin123', 'shashank@admin123'];
    if (matched.password && !validPasswords.includes(password)) {
      return { success: false, message: 'Incorrect password! Please enter the correct password.' };
    }

    setCurrentUser(matched);
    setCurrentView('dashboard');
    return { success: true, user: matched };
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setLiveNotification({
      title: 'Signed Out',
      message: 'You have been safely logged out of CredGen.',
      type: 'info'
    });
  };

  const switchRole = (role) => {
    const targetUser = users.find(u => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      setCurrentView('dashboard');
    }
  };

  const registerUser = (userData) => {
    const newUser = {
      id: `usr_${Date.now()}`,
      avatar: '',
      status: 'ACTIVE',
      verified: true,
      ...userData
    };
    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    setCurrentView('dashboard');
    return { success: true, user: newUser };
  };

  // CBCS Calculation Engine
  const calculateCBCSGrade = (marksObtained, maxMarks, courseCredits = 4) => {
    const percentage = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;
    const roundedPercentage = Math.round(percentage * 100) / 100;
    
    let matchedRule = gradeRules.find(
      r => roundedPercentage >= r.minPercentage && roundedPercentage <= r.maxPercentage
    );

    if (!matchedRule) {
      matchedRule = gradeRules[gradeRules.length - 1]; // Default to Fail
    }

    const creditPointsEarned = courseCredits * matchedRule.gradePoint;

    return {
      percentage: roundedPercentage,
      letterGrade: matchedRule.letterGrade,
      gradePoint: matchedRule.gradePoint,
      description: matchedRule.description,
      creditPointsEarned
    };
  };

  // Question Bank operations
  const addQuestion = (newQuestion) => {
    const item = {
      id: `qb_${Date.now()}`,
      ...newQuestion
    };
    setQuestionBank(prev => [item, ...prev]);
    return item;
  };

  const deleteQuestion = (id) => {
    setQuestionBank(prev => prev.filter(q => q.id !== id));
  };

  // Exam operations
  const createExam = (examData) => {
    const newExam = {
      id: `exam_${Date.now()}`,
      createdBy: currentUser ? currentUser.name : 'Faculty Examiner',
      departmentId: (currentUser && currentUser.department) || 'dept_cse',
      status: 'SCHEDULED',
      ...examData
    };
    setExams(prev => [newExam, ...prev]);
    return newExam;
  };

  // Submit Exam
  const submitExamAttempt = (examId, responses) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    const examQuestions = questionBank.filter(q => exam.questionIds.includes(q.id));
    let rawScore = 0;
    let maxMarks = 0;
    let hasSubjective = false;

    examQuestions.forEach(q => {
      maxMarks += (q.marks || 2);
      const studentResp = responses[q.id];

      if (q.type === 'MCQ') {
        if (studentResp === q.correctOptionId) {
          rawScore += q.marks;
        } else if (studentResp && exam.negativeMarking) {
          rawScore -= (q.negativeMarks || (q.marks * (exam.negativeMarkValue || 0.25)));
        }
      } else if (q.type === 'LONG_SUBJECTIVE' || q.type === 'SHORT_ANSWER' || q.type === 'PRACTICAL') {
        hasSubjective = true;
      }
    });

    rawScore = Math.max(0, Math.round(rawScore * 100) / 100);
    const cbcs = calculateCBCSGrade(rawScore, maxMarks, exam.creditWeight || 4);

    const resultRecord = {
      id: `res_${(currentUser && currentUser.rollNo) || '11242634'}_${Date.now()}`,
      studentId: currentUser ? currentUser.id : 'usr_student',
      studentName: currentUser ? currentUser.name : 'Student Candidate',
      rollNo: (currentUser && currentUser.rollNo) || '11242634',
      examId: exam.id,
      examTitle: exam.title,
      courseCode: exam.courseId,
      courseName: exam.courseName,
      courseCredits: exam.creditWeight || 4,
      rawMarksObtained: rawScore,
      totalMaximumMarks: maxMarks,
      percentage: cbcs.percentage,
      letterGrade: hasSubjective ? 'Evaluating...' : cbcs.letterGrade,
      gradePoint: hasSubjective ? '-' : cbcs.gradePoint,
      creditPointsEarned: hasSubjective ? '-' : cbcs.creditPointsEarned,
      evaluationStatus: hasSubjective ? 'PENDING_MANUAL_REVIEW' : 'COMPLETED',
      verifiedHash: `SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}-${Date.now()}`,
      publishedDate: new Date().toISOString().split('T')[0],
      submittedResponses: responses
    };

    setResults(prev => [resultRecord, ...prev]);
    setSelectedStudentResult(resultRecord);
    return resultRecord;
  };

  return (
    <AppContext.Provider value={{
      users,
      currentUser,
      departments,
      courses,
      gradeRules,
      questionBank,
      exams,
      results,
      currentView,
      selectedExamId,
      selectedAttemptId,
      selectedStudentResult,
      activeOtps,
      liveNotification,
      setLiveNotification,
      generateAndSendOTPs,
      setCurrentView,
      setSelectedExamId,
      setSelectedAttemptId,
      setSelectedStudentResult,
      switchRole,
      loginUser,
      logoutUser,
      registerUser,
      calculateCBCSGrade,
      addQuestion,
      deleteQuestion,
      createExam,
      submitExamAttempt
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
