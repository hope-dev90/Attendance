import { useEffect, useState } from 'react';
import { ChevronDown, GraduationCap, KeyRound, Lock, LogIn, ShieldCheck, User, UserPlus } from 'lucide-react';
import LogoImg from '../assets/logo.jpg'; 
import { api } from '../api';

const Auth = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState('login');
  const [classes, setClasses] = useState([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [classId, setClassId] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [devOtp, setDevOtp] = useState('');

useEffect(() => {
  api.getClasses()
    .then((items) => {
      setClasses(items);
      setClassId((current) => current || String(items[0]?.id || ''));
    })
    .catch((err) => {
      setClasses([]);
      setError(err.message || 'Could not load classes. Make sure the backend is running.');
    });
}, []);


const handleLogin = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');
  try {
    const loginData = await api.login(email, password);
    onLoginSuccess(loginData);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

const handleSignup = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');
  setNotice('');
  setDevOtp('');
  try {
    const data = await api.signup({
      full_name: fullName,
      email,
      password,
      class_id: Number(classId),
    });
    setNotice(data.message || 'Account created. Check your email for the OTP code.');
    setDevOtp(data.devOtp || '');
    setMode('verify');
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

const handleVerifyOtp = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');
  try {
    const loginData = await api.verifyOtp(email, otp);
    onLoginSuccess(loginData);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

const handleResendOtp = async () => {
  setIsLoading(true);
  setError('');
  setNotice('');
  setDevOtp('');
  try {
    const data = await api.resendOtp(email);
    setNotice(data.message || 'New OTP sent.');
    setDevOtp(data.devOtp || '');
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

const switchMode = (nextMode) => {
  setMode(nextMode);
  setError('');
  setNotice('');
  setDevOtp('');
};

const title = mode === 'login' ? 'Welcome Back.' : mode === 'signup' ? 'Create Account.' : 'Verify Email.';

  return (
    <div className="min-h-screen flex font-sans bg-white">
      <div className="hidden lg:flex lg:w-1/2 bg-[#000042] items-center justify-center text-white p-12">
      <div className="relative z-10 text-center">
          <div className="bg-white rounded-2xl shadow-xl mb-4 inline-block p-4">
            <img 
              src={LogoImg} 
              alt="StaffNet Logo" 
              className="w-16 h-16 object-contain" 
            />
          </div>
          <h1  className="text-6xl font-extrabold tracking-tight">StaffNet.</h1>
          <p className="mt-4 text-blue-200 text-lg font-light italic">Attendance Tracking Portal for representatives.</p>
          </div>
      </div>
      <div className="w-full lg:w-1/2 bg-[#f8fafc] flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          
          <div className="lg:hidden text-center mb-10">
             <div className="inline-block bg-white p-4 rounded-2xl shadow-xl mb-4">
                <img src={LogoImg} alt="Logo" className="w-12 h-12" />
             </div>
             <h1 className="text-3xl font-black text-[#2e5a88]">StaffNet</h1>
          </div>

          <div className="bg-white p-10 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100">
            <div className="mb-10">
              <h2 className="text-3xl font-black text-[#000053] tracking-tight text-center">{title}</h2>
            </div>

            {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#000042] uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#000042] transition-colors" size={20} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#001f3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#000042] uppercase tracking-widest ml-1">Secret Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#000042] transition-colors" size={20} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#001f3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#000052] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#2e5a88] transition-all shadow-xl shadow-blue-900/10 active:scale-[0.98] mt-4"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Login <LogIn size={18} /></>
                )}
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="w-full text-[#000052] py-2 font-black text-xs uppercase tracking-widest hover:text-[#2e5a88] transition-all"
              >
                Create New Account
              </button>
            </form>
            )}

            {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#000042] uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#000042] transition-colors" size={20} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#001f3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#000042] uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#000042] transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#001f3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#000042] uppercase tracking-widest ml-1">Class</label>
                <div className="relative group">
                  <GraduationCap
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#94a8c4] transition-colors group-focus-within:text-[#000042]"
                    size={20}
                  />
                  <select
                    required
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    disabled={classes.length === 0}
                    className="auth-select w-full min-h-[52px] cursor-pointer rounded-2xl border border-transparent bg-gray-50 py-3.5 pl-12 pr-11 text-base font-bold text-[#001f3f] outline-none transition-all focus:border-[#2e5a88]/30 focus:bg-white focus:ring-2 focus:ring-[#2e5a88]/20 disabled:cursor-wait disabled:opacity-60 sm:py-4 sm:text-sm"
                  >
                    <option value="" disabled>
                      {classes.length === 0 ? 'Loading classes…' : 'Select your class'}
                    </option>
                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#2e5a88] transition-colors group-focus-within:text-[#000042]"
                    size={18}
                    aria-hidden
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#000042] uppercase tracking-widest ml-1">Secret Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#000042] transition-colors" size={20} />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#001f3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !classId}
                className="w-full bg-[#000052] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#2e5a88] transition-all shadow-xl shadow-blue-900/10 active:scale-[0.98] mt-4"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Signup <UserPlus size={18} /></>
                )}
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full text-[#000052] py-2 font-black text-xs uppercase tracking-widest hover:text-[#2e5a88] transition-all"
              >
                Back To Login
              </button>
            </form>
            )}

            {mode === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {notice && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-2xl text-sm font-bold">
                  {notice}
                </div>
              )}
              {devOtp && (
                <div className="bg-blue-50 border border-blue-100 text-[#000052] px-4 py-3 rounded-2xl text-sm font-black tracking-widest text-center">
                  OTP: {devOtp}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#000042] uppercase tracking-widest ml-1">OTP Code</label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#000042] transition-colors" size={20} />
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#001f3f] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="123456"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#000052] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#2e5a88] transition-all shadow-xl shadow-blue-900/10 active:scale-[0.98] mt-4"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Verify <ShieldCheck size={18} /></>
                )}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="w-full text-[#000052] py-2 font-black text-xs uppercase tracking-widest hover:text-[#2e5a88] transition-all"
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full text-slate-400 py-1 font-black text-xs uppercase tracking-widest hover:text-[#2e5a88] transition-all"
              >
                Back To Login
              </button>
            </form>
            )}
          </div>

          <div className="mt-12 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-300 mb-2">
              <ShieldCheck size={16} />
              <p className="text-[9px] font-black uppercase tracking-[0.2em]">Authorized Access Only</p>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">© 2026 StaffNet Infrastructure. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
