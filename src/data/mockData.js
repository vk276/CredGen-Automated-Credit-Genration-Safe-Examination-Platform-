// Initial Mock Data for CredGen Platform

export const INITIAL_USERS = [
  {
    id: 'usr_admin_vivek',
    name: 'Vivek Kumar',
    email: 'vivek.admin@credgen.mmdu.ac.in',
    phone: '+91 94160 12345',
    password: 'Vivek@Admin2026#',
    role: 'ADMIN',
    rollNo: '11242634',
    department: 'Examination Control Board & CSE',
    institution: 'Maharishi Markandeshwar (Deemed to be University), Mullana',
    designation: 'Chief Administrator & Project Lead',
    avatar: '',
    status: 'ACTIVE',
    verified: true
  },
  {
    id: 'usr_admin_shashank',
    name: 'Banda Shashank',
    email: 'shashank.admin@credgen.mmdu.ac.in',
    phone: '+91 94160 54321',
    password: 'Shashank@Admin2026#',
    role: 'ADMIN',
    rollNo: '11242656',
    department: 'Examination Control Board & CSE',
    institution: 'Maharishi Markandeshwar (Deemed to be University), Mullana',
    designation: 'Chief System Architect & Exam Controller',
    avatar: '',
    status: 'ACTIVE',
    verified: true
  },
  {
    id: 'usr_teacher_1',
    name: 'Dr. Vinsha Sumra',
    email: 'vinsha.sumra@mmdu.ac.in',
    phone: '+91 98765 43210',
    password: 'Teacher@2026#',
    role: 'TEACHER',
    department: 'Computer Science & Engineering',
    facultyId: 'MMEC-CSE-101',
    designation: 'Professor & Project Guide',
    avatar: '',
    assignedSubjects: ['CS-302', 'CS-304', 'CS-306'],
    status: 'ACTIVE',
    verified: true
  },
  {
    id: 'usr_teacher_2',
    name: 'Prof. Rajesh Sharma',
    email: 'rajesh.sharma@mmdu.ac.in',
    phone: '+91 98123 45678',
    password: 'Teacher@2026#',
    role: 'TEACHER',
    department: 'Computer Science & Engineering',
    facultyId: 'MMEC-CSE-204',
    designation: 'Associate Professor',
    avatar: '',
    assignedSubjects: ['CS-302', 'CS-304', 'CS-308'],
    status: 'ACTIVE',
    verified: true
  },
  {
    id: 'usr_student_rahul',
    name: 'Rahul Verma',
    email: 'rahul.verma@student.mmdu.ac.in',
    phone: '+91 98980 11223',
    password: 'Student@2026#',
    role: 'STUDENT',
    rollNo: '11242601',
    section: 'C',
    semester: '6th Semester',
    batch: '2023-2027',
    department: 'Computer Science & Engineering',
    avatar: '',
    status: 'ACTIVE',
    verified: true
  },
  {
    id: 'usr_student_priya',
    name: 'Priya Sharma',
    email: 'priya.sharma@student.mmdu.ac.in',
    phone: '+91 98980 44556',
    password: 'student@123',
    role: 'STUDENT',
    rollNo: '11242602',
    section: 'C',
    semester: '6th Semester',
    batch: '2023-2027',
    department: 'Computer Science & Engineering',
    avatar: '',
    status: 'ACTIVE',
    verified: true
  }
];

export const DEPARTMENTS = [
  { id: 'dept_cse', code: 'CSE', name: 'Computer Science & Engineering', totalStudents: 480, totalFaculty: 28 },
  { id: 'dept_ece', code: 'ECE', name: 'Electronics & Communication Engineering', totalStudents: 320, totalFaculty: 20 },
  { id: 'dept_me', code: 'ME', name: 'Mechanical Engineering', totalStudents: 240, totalFaculty: 18 },
  { id: 'dept_it', code: 'IT', name: 'Information Technology', totalStudents: 360, totalFaculty: 22 }
];

export const COURSES = [
  { id: 'CS-302', code: 'CS-302', name: 'Database Management Systems', credits: 4, type: 'Core Theory + Lab', semester: 6 },
  { id: 'CS-304', code: 'CS-304', name: 'Design & Analysis of Algorithms', credits: 4, type: 'Core Theory', semester: 6 },
  { id: 'CS-306', code: 'CS-306', name: 'Computer Networks & Security', credits: 3, type: 'Core Theory', semester: 6 },
  { id: 'CS-308', code: 'CS-308', name: 'Software Engineering & Agile Methodologies', credits: 3, type: 'Program Elective', semester: 6 },
  { id: 'CS-310', code: 'CS-310', name: 'Full Stack Web Development Lab', credits: 2, type: 'Practical Laboratory', semester: 6 }
];

// Standard UGC CBCS 10-Point Grading System
export const CBCS_GRADE_RULES = [
  { minPercentage: 90, maxPercentage: 100, letterGrade: 'O', gradePoint: 10, description: 'Outstanding' },
  { minPercentage: 80, maxPercentage: 89.99, letterGrade: 'A+', gradePoint: 9, description: 'Excellent' },
  { minPercentage: 70, maxPercentage: 79.99, letterGrade: 'A', gradePoint: 8, description: 'Very Good' },
  { minPercentage: 60, maxPercentage: 69.99, letterGrade: 'B+', gradePoint: 7, description: 'Good' },
  { minPercentage: 50, maxPercentage: 59.99, letterGrade: 'B', gradePoint: 6, description: 'Above Average' },
  { minPercentage: 45, maxPercentage: 49.99, letterGrade: 'C', gradePoint: 5, description: 'Average' },
  { minPercentage: 40, maxPercentage: 44.99, letterGrade: 'P', gradePoint: 4, description: 'Pass' },
  { minPercentage: 0, maxPercentage: 39.99, letterGrade: 'F', gradePoint: 0, description: 'Fail' }
];

export const INITIAL_QUESTION_BANK = [
  {
    id: 'qb_101',
    courseId: 'CS-302',
    courseName: 'Database Management Systems',
    unit: 'Unit 2: Relational Model & SQL',
    topic: 'ACID Properties & Transactions',
    type: 'MCQ', // MCQ, MULTI_SELECT, TRUE_FALSE, SHORT_ANSWER, LONG_SUBJECTIVE, PRACTICAL
    difficulty: 'Medium',
    bloomLevel: 'Understanding',
    marks: 2,
    negativeMarks: 0.5,
    questionText: 'Which transaction property ensures that all operations in a transaction are completed successfully or none of them are applied at all?',
    options: [
      { id: 'opt_1', text: 'Atomicity' },
      { id: 'opt_2', text: 'Consistency' },
      { id: 'opt_3', text: 'Isolation' },
      { id: 'opt_4', text: 'Durability' }
    ],
    correctOptionId: 'opt_1',
    explanation: 'Atomicity ensures that a transaction is treated as a single, indivisible unit of work (all or nothing).'
  },
  {
    id: 'qb_102',
    courseId: 'CS-302',
    courseName: 'Database Management Systems',
    unit: 'Unit 3: Normalization',
    topic: 'Boyce-Codd Normal Form (BCNF)',
    type: 'MCQ',
    difficulty: 'Hard',
    bloomLevel: 'Analyzing',
    marks: 2,
    negativeMarks: 0.66,
    questionText: 'A relation R is in Boyce-Codd Normal Form (BCNF) if and only if for every non-trivial functional dependency X -> Y:',
    options: [
      { id: 'opt_1', text: 'Y is a subset of X' },
      { id: 'opt_2', text: 'X is a Superkey' },
      { id: 'opt_3', text: 'Y is a prime attribute' },
      { id: 'opt_4', text: 'R has no composite primary key' }
    ],
    correctOptionId: 'opt_2',
    explanation: 'BCNF requires that for every non-trivial functional dependency X -> Y, the determinant X must be a superkey.'
  },
  {
    id: 'qb_103',
    courseId: 'CS-302',
    courseName: 'Database Management Systems',
    unit: 'Unit 4: Indexing & Storage',
    topic: 'B+ Tree Indexing',
    type: 'LONG_SUBJECTIVE',
    difficulty: 'Hard',
    bloomLevel: 'Evaluating',
    marks: 8,
    negativeMarks: 0,
    questionText: 'Explain the internal architecture and leaf-level linking of a B+ Tree index structure. Compare its performance with a B-Tree for range-query evaluations in large-scale relational storage engines.',
    modelAnswer: 'A B+ Tree stores all actual key-data record pointers only at the leaf nodes, while internal nodes store only search keys and child pointers. The leaf nodes are linked sequentially via a doubly-linked list, providing O(log N) point lookups and linear O(K) range scans without traversing internal nodes multiple times.',
    rubric: [
      { criterion: 'B+ Tree Architecture & Structure Diagram', maxMarks: 3 },
      { criterion: 'Leaf-node sequential chaining explanation', maxMarks: 2 },
      { criterion: 'Comparative analysis with standard B-Tree for range queries', maxMarks: 3 }
    ]
  },
  {
    id: 'qb_104',
    courseId: 'CS-304',
    courseName: 'Design & Analysis of Algorithms',
    unit: 'Unit 1: Asymptotic Analysis',
    topic: 'Master Theorem',
    type: 'MCQ',
    difficulty: 'Easy',
    bloomLevel: 'Applying',
    marks: 2,
    negativeMarks: 0.5,
    questionText: 'What is the tight asymptotic time complexity of the recurrence relation T(n) = 2T(n/2) + O(n)?',
    options: [
      { id: 'opt_1', text: 'O(n)' },
      { id: 'opt_2', text: 'O(n log n)' },
      { id: 'opt_3', text: 'O(n^2)' },
      { id: 'opt_4', text: 'O(log n)' }
    ],
    correctOptionId: 'opt_2',
    explanation: 'By Master Theorem Case 2, where a=2, b=2, d=1 -> log_b(a) = 1 = d, the complexity is Theta(n log n).'
  },
  {
    id: 'qb_105',
    courseId: 'CS-304',
    courseName: 'Design & Analysis of Algorithms',
    unit: 'Unit 3: Dynamic Programming',
    topic: '0/1 Knapsack Problem',
    type: 'SHORT_ANSWER',
    difficulty: 'Medium',
    bloomLevel: 'Applying',
    marks: 4,
    negativeMarks: 0,
    questionText: 'State the recurrence relation for the 0/1 Knapsack problem with n items and capacity W, and explain why greedy approach fails.',
    modelAnswer: 'Recurrence: DP[i][w] = max(DP[i-1][w], value[i-1] + DP[i-1][w - weight[i-1]]) if weight[i-1] <= w, else DP[i-1][w]. Greedy fails because items cannot be divided.',
    rubric: [
      { criterion: 'Correct mathematical DP recurrence equation', maxMarks: 2 },
      { criterion: 'Valid counter-example/reason why greedy heuristic fails', maxMarks: 2 }
    ]
  }
];

export const INITIAL_EXAMS = [
  {
    id: 'exam_2026_dbms_mid',
    title: 'Mid-Semester Assessment — DBMS (CS-302)',
    courseId: 'CS-302',
    courseName: 'Database Management Systems',
    examType: 'Hybrid (Objective + Subjective)',
    totalMarks: 20,
    passingMarks: 8,
    durationMinutes: 45,
    negativeMarking: true,
    negativeMarkValue: 0.25, // 25% deduction
    shuffleQuestions: true,
    shuffleOptions: true,
    autoSubmitOnExpiry: true,
    creditWeight: 4,
    status: 'LIVE', // DRAFT, SCHEDULED, LIVE, EVALUATING, PUBLISHED
    startTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    endTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(),   // 30 mins left
    departmentId: 'dept_cse',
    assignedBatches: ['B.Tech CSE Sec C 2026'],
    createdBy: 'Prof. Rajesh Sharma',
    questionIds: ['qb_101', 'qb_102', 'qb_103', 'qb_104']
  },
  {
    id: 'exam_2026_daa_final',
    title: 'Comprehensive Examination — Algorithms (CS-304)',
    courseId: 'CS-304',
    courseName: 'Design & Analysis of Algorithms',
    examType: 'End-Term CBCS Major',
    totalMarks: 50,
    passingMarks: 20,
    durationMinutes: 90,
    negativeMarking: true,
    negativeMarkValue: 0.33,
    shuffleQuestions: true,
    shuffleOptions: true,
    autoSubmitOnExpiry: true,
    creditWeight: 4,
    status: 'SCHEDULED',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    departmentId: 'dept_cse',
    assignedBatches: ['B.Tech CSE Sec A, B, C 2026'],
    createdBy: 'Prof. Rajesh Sharma',
    questionIds: ['qb_104', 'qb_105']
  },
  {
    id: 'exam_2026_cn_pub',
    title: 'Computer Networks & Protocols — Test 1',
    courseId: 'CS-306',
    courseName: 'Computer Networks & Security',
    examType: 'Objective Online Test',
    totalMarks: 30,
    passingMarks: 12,
    durationMinutes: 40,
    negativeMarking: false,
    negativeMarkValue: 0,
    shuffleQuestions: true,
    shuffleOptions: true,
    autoSubmitOnExpiry: true,
    creditWeight: 3,
    status: 'PUBLISHED',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString(),
    departmentId: 'dept_cse',
    assignedBatches: ['B.Tech CSE Sec C 2026'],
    createdBy: 'Prof. Rajesh Sharma',
    questionIds: ['qb_101', 'qb_102']
  }
];

export const INITIAL_STUDENT_RESULTS = [
  {
    id: 'res_11242634_cn',
    studentId: 'usr_student_1',
    studentName: 'Vivek Kumar',
    rollNo: '11242634',
    examId: 'exam_2026_cn_pub',
    examTitle: 'Computer Networks & Protocols — Test 1',
    courseCode: 'CS-306',
    courseName: 'Computer Networks & Security',
    courseCredits: 3,
    rawMarksObtained: 27.5,
    totalMaximumMarks: 30,
    percentage: 91.67,
    letterGrade: 'O',
    gradePoint: 10,
    creditPointsEarned: 30, // 3 credits * 10 GP
    evaluationStatus: 'COMPLETED',
    verifiedHash: 'SHA256-7F4C82E84A10B395D3528A7A0C73EB74F8C99B9E',
    publishedDate: '2026-08-25'
  },
  {
    id: 'res_11242656_cn',
    studentId: 'usr_student_2',
    studentName: 'Banda Shashank',
    rollNo: '11242656',
    examId: 'exam_2026_cn_pub',
    examTitle: 'Computer Networks & Protocols — Test 1',
    courseCode: 'CS-306',
    courseName: 'Computer Networks & Security',
    courseCredits: 3,
    rawMarksObtained: 25.0,
    totalMaximumMarks: 30,
    percentage: 83.33,
    letterGrade: 'A+',
    gradePoint: 9,
    creditPointsEarned: 27, // 3 credits * 9 GP
    evaluationStatus: 'COMPLETED',
    verifiedHash: 'SHA256-1B9038FD2500CE5F821415DA4892BB83B0EFA987',
    publishedDate: '2026-08-25'
  },
  {
    id: 'res_11242601_dbms',
    studentId: 'usr_student_rahul',
    studentName: 'Rahul Verma',
    rollNo: '11242601',
    examId: 'exam_2026_dbms_mid',
    examTitle: 'Mid-Semester Assessment — DBMS (CS-302)',
    courseCode: 'CS-302',
    courseName: 'Database Management Systems',
    courseCredits: 4,
    rawMarksObtained: 88.5,
    totalMaximumMarks: 100,
    percentage: 88.5,
    letterGrade: 'A+',
    gradePoint: 9,
    creditPointsEarned: 36, // 4 credits * 9 GP
    evaluationStatus: 'COMPLETED',
    verifiedHash: 'SHA256-4D88C22E84A10B395D3528A7A0C73EB74F8C99B9E',
    publishedDate: '2026-09-01'
  }
];

export const INITIAL_SUPPORT_QUERIES = [
  {
    id: 'sup_101',
    user_id: 'usr_student_rahul',
    name: 'Rahul Verma',
    email: 'rahul.verma@mmdu.ac.in',
    phone: '+91 98765 43210',
    role: 'STUDENT',
    type: 'RE_EVALUATION',
    category: 'MARKSHEET',
    subject: 'Re-evaluation Request for CS-302 Mid-Term Assessment',
    message: 'Respected Controller, I request re-evaluation of Question 3 in DBMS Mid-Term Examination. The B+ tree balance explanation was accurate according to Silberschatz textbook references.',
    priority: 'HIGH',
    status: 'OPEN',
    admin_notes: null,
    resolved_by: null,
    resolved_at: null,
    created_at: '2026-09-02 11:30:00'
  },
  {
    id: 'sup_102',
    user_id: 'usr_teacher_1',
    name: 'Dr. Vinsha Sumra',
    email: 'vinsha.sumra@mmdu.ac.in',
    phone: '+91 98123 45678',
    role: 'TEACHER',
    type: 'FEEDBACK',
    category: 'EXAMINATION',
    subject: 'Commendation & Preset Timer Suggestion for Lab Exams',
    message: 'The new negative marking calculation engine and proctoring audit log have performed exceptionally during our 4th-semester practical evaluations. I recommend adding a 90-minute preset timer button in the Exam Wizard.',
    priority: 'NORMAL',
    status: 'RESOLVED',
    admin_notes: 'Suggestion reviewed and scheduled for implementation in Examination Wizard v2.',
    resolved_by: 'Vivek Kumar (Lead Administrator)',
    resolved_at: '2026-09-02 14:15:00',
    created_at: '2026-09-02 09:45:00'
  },
  {
    id: 'sup_103',
    user_id: 'usr_student_3',
    name: 'Amanpreet Singh',
    email: 'aman.singh@mmdu.ac.in',
    phone: '+91 97234 56789',
    role: 'STUDENT',
    type: 'EXAM_ISSUE',
    category: 'PROCTORING',
    subject: 'Proctoring Camera False Positive Explanation',
    message: 'During test session CS-304, my webcam briefly disconnected due to a loose USB cable for 12 seconds. Please verify the AI snapshot audit log to confirm there was no malpractice.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    admin_notes: 'Under review with Examination Auditor Shashank. Webcam log timestamps correlated with proctoring audit frame #412.',
    resolved_by: 'Banda Shashank (Exam Controller)',
    resolved_at: null,
    created_at: '2026-09-02 16:00:00'
  },
  {
    id: 'sup_104',
    user_id: null,
    name: 'Prof. Rajesh Sharma',
    email: 'r.sharma@nitkkr.ac.in',
    phone: '+91 94160 12345',
    role: 'GUEST',
    type: 'QUERY',
    category: 'GENERAL',
    subject: 'SHA-256 Transcript Verification Protocol',
    message: 'We are evaluating the CBCS grade cards generated by CredGen for MMDU candidates applying to our M.Tech programme. Could you confirm the public ledger verification endpoint for SHA-256 digital hashes?',
    priority: 'NORMAL',
    status: 'OPEN',
    admin_notes: null,
    resolved_by: null,
    resolved_at: null,
    created_at: '2026-09-02 18:20:00'
  }
];

