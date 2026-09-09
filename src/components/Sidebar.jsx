import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UtensilsCrossed,
  FolderTree,
  Users,
  Monitor,
  FileText,
  History,
  Settings,
  LogOut,
  Menu
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const menus = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Menu Management",
      path: "/menu",
      icon: UtensilsCrossed,
    },
    {
      name: "Category",
      path: "/categories",
      icon: FolderTree,
    },
    {
      name: "Users",
      path: "/users",
      icon: Users,
    },
    {
      name: "Counters",
      path: "/counters",
      icon: Monitor,
    },
    {
      name: "Reports",
      path: "/reports",
      icon: FileText,
    },
    {
      name: "Logs",
      path: "/logs",
      icon: History,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2.5 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-700 focus:outline-none"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-50 h-screen bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] shadow-[4px_0_24px_rgba(0,0,0,0.02)]
          ${isExpanded ? "w-64" : "w-20"} 
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header / Logo Section */}
        <div className="flex items-center px-4 h-20 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden w-full">
            
            {/* Clickable ICMR Logo to Toggle Sidebar */}
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="min-w-[40px] h-10 flex items-center justify-center shrink-0 focus:outline-none hover:scale-105 transition-transform"
              title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <img 
                src="https://irise.icmr.org.in/dist/img/icmr_logo_verti.png" 
                alt="ICMR Logo" 
                className="w-10 h-10 object-contain drop-shadow-sm"
              />
            </button>
            
            {/* Clickable Brand Text */}
            <div 
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex flex-col whitespace-nowrap transition-all duration-300 cursor-pointer ${isExpanded ? "opacity-100 w-full" : "opacity-0 w-0"}`}
            >
              <h1 className="text-lg font-black text-gray-900 leading-tight">
                ICMR-NIN
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mt-0.5">
                Admin Panel
              </p>
            </div>
            
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1.5 scrollbar-hide">
          
          <div className={`px-3 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${isExpanded ? "opacity-100" : "opacity-0"}`}>
            Menu
          </div>

          {menus.map((menu) => {
            const Icon = menu.icon;
            const active = location.pathname === menu.path;

            return (
              <Link
                key={menu.name}
                to={menu.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                  ${active 
                    ? "bg-gray-100 text-gray-900 font-semibold" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
                title={!isExpanded ? menu.name : ""}
              >
                <Icon size={20} className={`min-w-[20px] shrink-0 transition-colors ${active ? "text-gray-900" : "group-hover:text-gray-700"}`} />
                
                <span className={`whitespace-nowrap text-sm transition-all duration-300 overflow-hidden
                  ${isExpanded ? "opacity-100 w-48" : "opacity-0 w-0"}
                `}>
                  {menu.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <Link
            to="/"
            onClick={() => localStorage.removeItem("adminAuth")} 
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
            title={!isExpanded ? "Logout" : ""}
          >
            <LogOut size={20} className="min-w-[20px] shrink-0 group-hover:text-red-500 transition-colors" />
            
            <span className={`whitespace-nowrap text-sm font-semibold transition-all duration-300 overflow-hidden
              ${isExpanded ? "opacity-100 w-48" : "opacity-0 w-0"}
            `}>
              Logout
            </span>
          </Link>
        </div>
      </aside>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}