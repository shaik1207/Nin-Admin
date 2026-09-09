import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Globe2,
  Mail,
  Phone,
  ArrowRight,
  UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { apiCall } from "../utils/api";

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  
  const [formData, setFormData] = useState({
    role: "convener",
    firstName: "",
    lastName: "",
    mobileNumber: "",
    email: "", 
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

    const signupRequest = async () => {
      try {
        // Format payload to match backend expectations (combining first/last name)
        const payload = {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          password: formData.password,
          role: formData.role,
          mobileNumber: formData.mobileNumber
        };

        // Uses the custom apiCall utility to handle headers and base URL
        const data = await apiCall("/auth/admin/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        return data;
      } catch (error) {
        if (error.message === "Failed to fetch") {
          throw new Error("Server is offline. Please check your backend.");
        }
        throw error;
      }
    };

    toast.promise(signupRequest(), {
      loading: 'Creating your account securely...',
      success: (data) => {
        if (data.token) {
          // Store token and role from backend
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("userRole", data.user?.role || formData.role);
          localStorage.setItem("userName", data.user?.name || `${formData.firstName} ${formData.lastName}`);
          
          setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
          return "Account created & logged in successfully!";
        } else {
          setTimeout(() => navigate('/login'), 1500);
          return "Account created! Please log in.";
        }
      },
      error: (err) => err.message,
    }).finally(() => {
      setIsLoading(false);
    });
  };

  return (
    <div className="min-h-screen flex font-sans bg-[#F8FAFC] relative overflow-hidden">
      <Toaster position="top-right" reverseOrder={false} />

      {/* ================= LEFT PANE (FULL IMAGE) ================= */}
      <div className="hidden lg:flex w-1/2 relative z-10 overflow-hidden shadow-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center transform hover:scale-105 transition-transform duration-1000 ease-in-out"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop')",
          }}
        ></div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
        <div className="absolute inset-0 bg-emerald-900/20 mix-blend-multiply"></div>

        <div className="relative z-20 flex flex-col justify-between p-12 w-full h-full text-white">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-xl">
              <Globe2 size={24} className="text-white" />
            </div>
            <h3 className="font-black tracking-tight text-2xl drop-shadow-lg">CanteenFlow</h3>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Join the Platform
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight drop-shadow-xl">
              Start Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">Journey Here</span>
            </h1>
            <p className="text-gray-300 font-medium leading-relaxed max-w-md text-lg drop-shadow-md">
              Create an account to securely access menus, place live orders, and manage your profile.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ================= RIGHT PANE (3D FORM) ================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative" style={{ perspective: "1200px" }}>
        
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} 
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] right-[15%] w-64 h-64 bg-emerald-300 rounded-full blur-[80px] opacity-40 pointer-events-none"
        />
        <motion.div 
          animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] left-[15%] w-72 h-72 bg-blue-300 rounded-full blur-[90px] opacity-40 pointer-events-none"
        />

        <motion.div 
          initial={{ opacity: 0, rotateX: 15, y: 40 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          whileHover={{ rotateX: 2, rotateY: -2, scale: 1.01 }}
          className="w-full max-w-md bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.5)_inset] border border-white relative z-10"
        >
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 transform rotate-3">
              <UserPlus className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create Account</h2>
            <p className="text-gray-500 mt-1 text-sm font-medium">Fill in the details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Admin Role Selection */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-600 transition-colors z-10" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-white/50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 appearance-none transition-all text-gray-900 font-bold cursor-pointer hover:border-gray-300 shadow-sm relative z-0"
                >
                  <option value="convener">Convener</option>
                  <option value="co_convener">Co-Convener</option>
                  <option value="member_secretary">Member Secretary</option>
                  <option value="member">Member</option>
                  <option value="inventory_supervisor">Inventory Supervisor</option>
                  <option value="inventory_staff">Inventory Staff</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 z-10">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
            </motion.div>

            {/* First Name & Last Name Row */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="flex gap-3">
              <div className="relative group flex-1">
                <User size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="w-full bg-white/50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-gray-900 font-medium hover:border-gray-300 shadow-sm text-sm"
                  required
                />
              </div>
              <div className="relative group flex-1">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="w-full bg-white/50 border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-gray-900 font-medium hover:border-gray-300 shadow-sm text-sm"
                  required
                />
              </div>
            </motion.div>

            {/* Mobile Number */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="relative group">
                <Phone size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="Mobile Number"
                  className="w-full bg-white/50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-gray-900 font-medium hover:border-gray-300 shadow-sm text-sm"
                  required
                />
              </div>
            </motion.div>

            {/* Email Field */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className="w-full bg-white/50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-gray-900 font-medium hover:border-gray-300 shadow-sm text-sm"
                  required
                />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create Password (Min. 8 chars)"
                  className="w-full bg-white/50 border border-gray-200 rounded-2xl pl-11 pr-12 py-3 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-gray-900 font-medium hover:border-gray-300 shadow-sm text-sm"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            {/* Sign Up Button */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-900 text-white rounded-2xl py-3.5 font-bold hover:bg-emerald-600 transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign Up
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.div>

            {/* Login Link */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center pt-2">
              <p className="text-sm font-medium text-gray-500">
                Already have an account?{" "}
                <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Sign in here
                </Link>
              </p>
            </motion.div>

          </form>
        </motion.div>
      </div>

      {/* ================= iOS STYLE COOKIE POPUP ================= */}
      <AnimatePresence>
        {showCookies && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-full max-w-sm z-50"
          >
            <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] p-6 rounded-[2rem]">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <Globe2 size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-gray-900 mb-1">We use cookies</h4>
                  <p className="text-[13px] font-medium text-gray-500 leading-snug">
                    This app uses strictly necessary cookies to keep you securely logged in.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowCookies(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-200 transition-colors active:scale-95"
                >
                  Decline
                </button>
                <button 
                  onClick={acceptCookies}
                  className="flex-1 bg-gray-900 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-emerald-600 transition-colors active:scale-95"
                >
                  Allow
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Signup;