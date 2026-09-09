import React, { useState, useEffect } from "react";
import { Search, Bell, User, LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { apiCall } from "../utils/api";

export default function Navbar() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Admin");
  const [userRole, setUserRole] = useState("Super Admin");
  const [canteenLogo, setCanteenLogo] = useState(null);

  useEffect(() => {
    // 1. Fetch user details from local storage
    const storedName = localStorage.getItem("userName") || "Administrator";
    const storedRole = localStorage.getItem("userRole") || "admin";

    // 2. Format the role for display
    const formattedRole = storedRole
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    setUserName(storedName);
    setUserRole(formattedRole);

    // 3. Fetch System Settings to get the Logo
    const fetchLogo = async () => {
      try {
        const response = await apiCall("/admin/settings", { method: "GET" });
        if (response.data && response.data.logoUrl) {
          setCanteenLogo(response.data.logoUrl);
        }
      } catch (error) {
        console.error("Failed to fetch brand logo for navbar", error);
      }
    };
    fetchLogo();

    // 4. Real-time Welcome Notification (Fires only once per session)
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      toast.success(`Active session started for ${storedName}`, {
        icon: '👋',
        style: {
          borderRadius: '16px',
          background: '#10B981', // Emerald 500
          color: '#fff',
          fontWeight: 'bold'
        },
      });
      sessionStorage.setItem("hasSeenWelcome", "true");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("adminAuth"); 
    sessionStorage.removeItem("hasSeenWelcome");
    navigate("/");
  };

  // Safely format the logo URL so it doesn't break relative paths from backend
  const getLogoSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${url}`;
  };

  const displayLogo = getLogoSrc(canteenLogo);

  return (
    <div className="sticky top-0 z-[40] p-4 md:p-6 pb-0">
      <Toaster position="top-right" reverseOrder={false} />

      <nav className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 rounded-[2rem] px-6 py-3 flex items-center justify-between transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        
        <div className="flex items-center gap-3">
          {displayLogo ? (
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-gray-100 bg-white">
              <img src={displayLogo} alt="Canteen Logo" className="w-full h-full object-contain p-1" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-full flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <ShieldCheck size={20} />
            </div>
          )}
          
          <div className="hidden sm:flex flex-col">
            <h1 className="text-sm font-extrabold text-gray-900 leading-none tracking-tight flex items-center gap-1.5">
              Welcome, {userName.split(' ')[0]} <span className="animate-[wave_2s_ease-in-out_infinite] origin-[70%_70%] inline-block">👋</span>
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Smart Canteen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          
          <div className="relative hidden md:block group">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-300"
            />
            <input
              type="text"
              placeholder="Search..."
              className="bg-gray-50/50 border border-gray-100 rounded-full pl-10 pr-4 py-2 w-48 focus:w-64 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-500 text-sm font-medium text-gray-700 placeholder:text-gray-400"
            />
          </div>

          <div className="hidden md:block w-px h-6 bg-gray-200 mx-1"></div>

          <button className="relative p-2.5 rounded-full text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300 active:scale-95">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          </button>

          <div className="hidden lg:flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-200 shrink-0">
              <User size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-900 leading-none truncate max-w-[120px]">
                {userName}
              </span>
              <span className="text-[10px] font-medium text-gray-500 mt-0.5 truncate max-w-[120px]">
                {userRole}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 active:scale-95 ml-1 sm:ml-2"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>

        </div>
      </nav>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave {
          0% { transform: rotate(0.0deg) }
          10% { transform: rotate(14.0deg) }
          20% { transform: rotate(-8.0deg) }
          30% { transform: rotate(14.0deg) }
          40% { transform: rotate(-4.0deg) }
          50% { transform: rotate(10.0deg) }
          60% { transform: rotate(0.0deg) }
          100% { transform: rotate(0.0deg) }
        }
      `}} />
    </div>
  );
}