import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Mail, 
  Phone, 
  Lock, 
  User, 
  GraduationCap, 
  BookOpen, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Building,
  KeyRound,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

export const AuthModal = ({ isOpen, onClose }) => {
  const { loginUser, registerUser, switchRole } = useApp();
  
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register' | 'verify'
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration specific fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('Computer Science & Engineering');
  const [regRollOrId, setRegRollOrId] = useState('');
  
  // Verification OTP state
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [phoneOtp, setPhoneOtp] = useState(['', '', '', '']);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(45);
  
  const [statusMsg, setStatusMsg] = useState({ type: null, text: '' });

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    setStatusMsg({ type: null, text: '' });

    if (!identifier || !password) {
      setStatusMsg({ type: 'error', text: 'Please enter your Gmail / Phone and Password.' });
      return;
    }

    const res = loginUser(identifier, password, selectedRole);
    if (res.success) {
      setStatusMsg({ type: 'success', text: `Welcome back, ${res.user.name} (${res.user.role})!` });
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handleRegisterStep1 = (e) => {
    e.preventDefault();
    setStatusMsg({ type: null, text: '' });

    if (!regName || !regEmail || !regPhone || !regPassword) {
      setStatusMsg({ type: 'error', text: 'Please fill in all mandatory fields.' });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setStatusMsg({ type: 'error', text: 'Passwords do not match. Please verify.' });
      return;
    }

    // Move to Step 2: Verification
    setActiveTab('verify');
    setStatusMsg({ type: 'info', text: `Verification codes sent to ${regEmail} and ${regPhone}.` });
  };

  const handleOtpChange = (type, index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (type === 'email') {
      const newOtp = [...emailOtp];
      newOtp[index] = value;
      setEmailOtp(newOtp);
      if (newOtp.join('').length === 6) {
        setIsEmailVerified(true);
      }
    } else {
      const newOtp = [...phoneOtp];
      newOtp[index] = value;
      setPhoneOtp(newOtp);
      if (newOtp.join('').length === 4) {
        setIsPhoneVerified(true);
      }
    }
  };

  const handleCompleteVerification = () => {
    // Complete registration
    const userData = {
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      role: selectedRole,
      department: regDepartment,
      verified: true,
      ...(selectedRole === 'STUDENT' ? { rollNo: regRollOrId || '11242699', semester: '6th Semester', section: 'C' } : {}),
      ...(selectedRole === 'TEACHER' ? { facultyId: regRollOrId || 'MMEC-FAC-205', designation: 'Assistant Professor' } : {}),
      ...(selectedRole === 'ADMIN' ? { designation: 'Administrator' } : {})
    };

    const res = registerUser(userData);
    if (res.success) {
      setStatusMsg({ type: 'success', text: `Account verified & registered! Welcome ${res.user.name}` });
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  // Quick One-Click Demo Logins
  const quickDemoLogin = (role, customId = null) => {
    if (role === 'ADMIN' && customId === 'shashank') {
      switchRole('ADMIN'); // will select admin
    } else {
      switchRole(role);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-700/80 overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 mb-2 shadow-glow">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight font-sans">
            {activeTab === 'login' ? 'Sign in to CredGen' : activeTab === 'register' ? 'Register New Account' : 'Verify Email & Mobile'}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Official Examination & Credit Generation System • MMDU
          </p>
        </div>

        {/* Tab Switcher */}
        {activeTab !== 'verify' && (
          <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-5">
            <button
              onClick={() => { setActiveTab('login'); setStatusMsg({ type: null, text: '' }); }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'login' 
                  ? 'bg-brand-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); setStatusMsg({ type: null, text: '' }); }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'register' 
                  ? 'bg-brand-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register with Email
            </button>
          </div>
        )}

        {/* Status Message */}
        {statusMsg.text && (
          <div className={`p-2.5 rounded-xl mb-4 text-xs flex items-center gap-2 ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : statusMsg.type === 'info'
              ? 'bg-brand-500/10 text-brand-300 border border-brand-500/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Role Selector Buttons */}
        {activeTab !== 'verify' && (
          <div className="mb-4">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Account Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('STUDENT')}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'STUDENT'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span className="text-[11px] font-semibold">Student</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('TEACHER')}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'TEACHER'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-[11px] font-semibold">Faculty</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('ADMIN')}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'ADMIN'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-[11px] font-semibold">Super Admin</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Gmail / Email ID or Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. vivek.admin@credgen.mmdu.ac.in"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input pl-10 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input pl-10 pr-10 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow transition-all active:scale-[0.98]"
            >
              Sign In to CredGen
            </button>

            {/* Quick 1-Click Demo Login Shortcuts */}
            <div className="pt-3 border-t border-slate-800">
              <p className="text-[10px] text-center text-slate-400 mb-2 uppercase tracking-wider font-semibold">
                Quick 1-Click Fast Logins
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickDemoLogin('ADMIN', 'vivek')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-[11px] font-medium text-rose-300 transition-colors text-left"
                >
                  Admin: Vivek Kumar
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin('ADMIN', 'shashank')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-[11px] font-medium text-rose-300 transition-colors text-left"
                >
                  Admin: Banda Shashank
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin('TEACHER')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-[11px] font-medium text-indigo-300 transition-colors text-left"
                >
                  Faculty: Dr. Vinsha Sumra
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin('STUDENT')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-[11px] font-medium text-emerald-300 transition-colors text-left"
                >
                  Student: Rahul Verma
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: REGISTRATION FORM (Step 1) */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterStep1} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Vivek Kumar"
                  className="w-full px-3.5 py-2 rounded-xl glass-input pl-9 text-xs focus:ring-2 focus:ring-brand-500"
                />
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Gmail / Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+91 94160..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Create Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {selectedRole === 'STUDENT' ? 'University Roll Number' : selectedRole === 'TEACHER' ? 'Faculty ID' : 'Institutional Admin Security Passcode'}
              </label>
              <input
                type="text"
                value={regRollOrId}
                onChange={(e) => setRegRollOrId(e.target.value)}
                placeholder={selectedRole === 'STUDENT' ? 'e.g. 11242634' : selectedRole === 'TEACHER' ? 'e.g. MMEC-CSE-101' : 'Admin Security Key'}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-glow-emerald transition-all mt-2 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Continue to Email & Mobile Verification</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 3: VERIFICATION STEP (Step 2 OTP Verification) */}
        {activeTab === 'verify' && (
          <div className="space-y-4">
            
            {/* Email OTP Box */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Mail className="w-4 h-4 text-brand-400" />
                  <span>Email Verification Code</span>
                </div>
                {isEmailVerified ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-mono">OTP: 749210 (Demo)</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Enter 6-digit code sent to <strong className="text-slate-300">{regEmail}</strong></p>
              
              <div className="flex justify-between gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={emailOtp[idx]}
                    onChange={(e) => handleOtpChange('email', idx, e.target.value)}
                    className="w-10 h-10 text-center text-sm font-bold rounded-lg glass-input border border-slate-700 focus:border-brand-500 font-mono"
                  />
                ))}
              </div>
            </div>

            {/* Mobile Phone OTP Box */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Mobile SMS OTP Code</span>
                </div>
                {isPhoneVerified ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-mono">OTP: 5824 (Demo)</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Enter 4-digit SMS OTP sent to <strong className="text-slate-300">{regPhone}</strong></p>
              
              <div className="flex justify-center gap-3 pt-1">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={phoneOtp[idx]}
                    onChange={(e) => handleOtpChange('phone', idx, e.target.value)}
                    className="w-11 h-10 text-center text-sm font-bold rounded-lg glass-input border border-slate-700 focus:border-emerald-500 font-mono"
                  />
                ))}
              </div>
            </div>

            {/* Complete Button */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleCompleteVerification}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-glow-emerald transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Verification & Register</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
