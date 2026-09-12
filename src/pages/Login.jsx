import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, User, Globe2, Mail, ArrowRight, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { apiCall } from "../utils/api";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  
  const [formData, setFormData] = useState({
    role: "customer",
    identifier: "",
    password: "",
  });

  useEffect(() => {
    const cookiesAccepted = localStorage.getItem("cookiesAccepted");
    if (!cookiesAccepted) {
      const timer = setTimeout(() => setShowCookies(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookiesAccepted", "true");
    setShowCookies(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // 1. Prepare endpoint and payload safely
    let endpoint = "";
    let payload = {};

    if (formData.role === "admin") {
      endpoint = "/auth/admin/login";
      payload = { email: formData.identifier, password: formData.password };
    } else if (formData.role === "counter_staff") {
      endpoint = "/auth/counter/login";
      payload = { counterName: formData.identifier, password: formData.password };
    } else {
      endpoint = "/auth/user/login";
      payload = { email: formData.identifier, password: formData.password };
    }

    try {
      // 2. Initialize the API request promise
      const loginPromise = apiCall(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // 3. Attach the promise to the UI toast strictly for visual feedback
      toast.promise(loginPromise, {
        loading: 'Authenticating securely...',
        success: 'Login successful!',
        error: (err) => err.message === "Failed to fetch" ? "Server is offline. Please check your backend." : err.message,
      });

      // 4. Await the actual data to process side effects safely
      const data = await loginPromise;

      // 5. Securely store credentials using optional chaining to prevent silent crashes
      localStorage.setItem("authToken", data.token);
      
      if (formData.role === "counter_staff") {
        localStorage.setItem("userRole", "counter_staff");
        localStorage.setItem("userName", data.counter?.name || formData.identifier);
      } else {
        localStorage.setItem("userRole", data.user?.role || formData.role);
        localStorage.setItem("userName", data.user?.name || formData.identifier);
      }
      
      // 6. Determine exact redirect path
      const redirectPath = formData.role === 'admin' ? '/dashboard' : 
                           formData.role === 'counter_staff' ? '/counter/dashboard' : '/menu';
      
      // 7. Execute navigation (Brief timeout allows the success toast to be read)
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1000);

    } catch (error) {
      console.error("Authentication check failed:", error);
      // Note: No need to trigger another toast here, toast.promise already handled the UI error display
    } finally {
      setIsLoading(false);
    }
  };

  const isCounter = formData.role === "counter_staff";

  return (
    <div className="min-h-screen flex font-sans bg-[#F8FAFC] relative overflow-hidden">
      <Toaster position="top-right" />

      <div className="hidden lg:flex w-1/2 relative z-10 overflow-hidden shadow-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center transform hover:scale-105 transition-transform duration-1000"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
        <div className="absolute inset-0 bg-emerald-900/20 mix-blend-multiply"></div>

        <div className="relative z-20 flex flex-col justify-between p-12 w-full h-full text-white">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-xl">
              <Globe2 size={24} className="text-white" />
            </div>
            <h3 className="font-black tracking-tight text-2xl drop-shadow-lg">CanteenFlow</h3>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              System Online
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight drop-shadow-xl">
              Manage Your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">Operations</span>
            </h1>
            <p className="text-gray-300 font-medium leading-relaxed max-w-md text-lg drop-shadow-md">
              Securely access inventory, live orders, and daily analytics through your SQL-powered dashboard.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative" style={{ perspective: "1200px" }}>
        <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] right-[15%] w-64 h-64 bg-emerald-300 rounded-full blur-[80px] opacity-40 pointer-events-none" />
        <motion.div animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[10%] left-[15%] w-72 h-72 bg-blue-300 rounded-full blur-[90px] opacity-40 pointer-events-none" />

        <motion.div initial={{ opacity: 0, rotateX: 15, y: 40 }} animate={{ opacity: 1, rotateX: 0, y: 0 }} transition={{ duration: 0.8, type: "spring", bounce: 0.4 }} whileHover={{ rotateX: 2, rotateY: -2, scale: 1.01 }} className="w-full max-w-md bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-white relative z-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/30 transform rotate-3">
              <Lock className="text-white" size={28} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h2>
            <p className="text-gray-500 mt-2 text-sm font-medium">Please enter your details to sign in</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Access Level</label>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-600 z-10" />
                <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-white/50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 appearance-none font-bold cursor-pointer relative z-0">
                  <option value="customer">Customer</option>
                  <option value="counter_staff">Counter Staff</option>
                  <option value="admin">Super Admin</option>
                </select>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {isCounter ? "Counter Name" : "Email Address"}
              </label>
              <div className="relative group">
                {isCounter ? (
                  <Monitor size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-600" />
                ) : (
                  <Mail size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-600" />
                )}
                <input 
                  type={isCounter ? "text" : "email"} 
                  name="identifier" 
                  value={formData.identifier} 
                  onChange={handleChange} 
                  placeholder={isCounter ? "e.g. Counter 1" : "Enter your email"} 
                  className="w-full bg-white/50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium" 
                  required 
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-600" />
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full bg-white/50 border border-gray-200 rounded-2xl pl-11 pr-12 py-3.5 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-emerald-600 focus:outline-none">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-4">
              <button type="submit" disabled={isLoading} className="w-full bg-gray-900 text-white rounded-2xl py-4 font-bold hover:bg-emerald-600 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.3)] flex items-center justify-center gap-2 group transition-all duration-300 active:scale-95">
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </motion.div>

            {!isCounter && formData.role !== 'admin' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center pt-2">
                <p className="text-sm font-medium text-gray-500">
                  Don't have an account? <Link to="/signup" className="font-bold text-emerald-600 hover:text-emerald-700">Sign up now</Link>
                </p>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCookies && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 right-6 w-full max-w-sm z-50">
            <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] p-6 rounded-[2rem]">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <Globe2 size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-gray-900 mb-1">We use cookies</h4>
                  <p className="text-[13px] font-medium text-gray-500 leading-snug">Strictly necessary cookies to keep you securely logged in.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCookies(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-200 transition-colors">Decline</button>
                <button onClick={acceptCookies} className="flex-1 bg-gray-900 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-emerald-600 transition-colors">Allow</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;