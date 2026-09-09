import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { apiCall } from "../utils/api";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Monitor,
  MapPin,
  X,
  CheckCircle2,
  Store,
  MoreVertical,
  Key,
  Lock,
  Ban,
  BarChart3,
  Eye,
  EyeOff,
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  Clock,
  Loader2,
  User,
  Fingerprint
} from "lucide-react";

export default function CounterManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data State
  const [counters, setCounters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordModal, setPasswordModal] = useState({ isOpen: false, counterId: null, counterName: "" });
  
  // Real-time Report State
  const [reportModal, setReportModal] = useState({ isOpen: false, counterId: null, counterName: "" });
  const [reportData, setReportData] = useState(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  
  // Dropdown State
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchCounters();
  }, []);

  const fetchCounters = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall("/admin/counters", { method: "GET" });
      setCounters(response.data || []);
    } catch (error) {
      toast.error("Failed to load counters");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    counterName: "",
    loginId: "",
    staffName: "",
    empNumber: "",
    location: "",
    status: "Active"
  });

  const [passwords, setPasswords] = useState({
    newPass: "",
    confirmPass: "",
    showNew: false,
    showConfirm: false
  });

  const handleAddCounter = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await apiCall("/admin/counters", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      
      setCounters([response.data, ...counters]);
      toast.success("Counter registered successfully!");
      setIsModalOpen(false);
      setFormData({ counterName: "", loginId: "", staffName: "", empNumber: "", location: "", status: "Active" });
    } catch (error) {
      toast.error(error.message || "Failed to register counter");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (currentStatus === "Blocked" || currentStatus === "Locked") return;
    
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    setCounters(counters.map(c => c.id === id ? { ...c, status: newStatus } : c));

    try {
      await apiCall(`/admin/counters/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      toast.success(`Counter status updated`);
    } catch (error) {
      setCounters(counters.map(c => c.id === id ? { ...c, status: currentStatus } : c));
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const currentCounter = counters.find(c => c.id === id);
    const prevStatus = currentCounter.status;
    
    setCounters(counters.map(c => c.id === id ? { ...c, status: newStatus } : c));
    setActiveDropdown(null);

    try {
      await apiCall(`/admin/counters/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      toast.success(`Counter is now ${newStatus}`);
    } catch (error) {
      setCounters(counters.map(c => c.id === id ? { ...c, status: prevStatus } : c));
      toast.error(error.message || "Failed to update security status");
    }
  };

  const handleDelete = async (id) => {
    setActiveDropdown(null);
    if (!window.confirm("Are you sure you want to permanently delete this counter?")) return;
    
    try {
      await apiCall(`/admin/counters/${id}`, { method: "DELETE" });
      setCounters(counters.filter(c => c.id !== id));
      toast.success("Counter removed successfully");
    } catch (error) {
      toast.error(error.message || "Failed to delete counter");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirmPass) {
      toast.error("Passwords do not match.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await apiCall(`/admin/counters/${passwordModal.counterId}/password`, {
        method: "PUT",
        body: JSON.stringify({ newPass: passwords.newPass })
      });
      
      toast.success("Counter credentials updated securely!");
      setPasswordModal({ isOpen: false, counterId: null, counterName: "" });
      setPasswords({ newPass: "", confirmPass: "", showNew: false, showConfirm: false });
    } catch (error) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch real-time report for specific counter
  const openReportModal = async (counter) => {
    setActiveDropdown(null);
    setReportModal({ isOpen: true, counterId: counter.id, counterName: counter.counterName });
    setIsReportLoading(true);
    
    try {
      const response = await apiCall(`/admin/counters/${counter.id}/report`, { method: "GET" });
      setReportData(response.data);
    } catch (error) {
      toast.error("Failed to load counter analytics");
      setReportModal({ isOpen: false, counterId: null, counterName: "" });
    } finally {
      setIsReportLoading(false);
    }
  };

  const filteredCounters = counters.filter(counter => 
    counter.counterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    counter.staffName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    counter.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    counter.loginId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    counter.empNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Toaster position="top-right" />
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop-in {
          0% { opacity: 0; transform: scale(0.95) translateY(-10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes grow-up {
          0% { height: 0%; opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
        .animate-pop-in { animation: pop-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-grow-up { animation: grow-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full pb-32">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in-up">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Indian_Council_of_Medical_Research_Logo.svg/1200px-Indian_Council_of_Medical_Research_Logo.svg.png" 
                  alt="ICMR Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                  Counter Management
                </h1>
                <p className="text-gray-500 font-medium text-sm mt-1">
                  Manage counters, assign staff, and configure security protocols.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-full flex items-center gap-2 font-bold text-sm shadow-md transition-all active:scale-95 shrink-0"
            >
              <Plus size={18} />
              Add Counter
            </button>
          </div>

          <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 mb-6 flex items-center animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <div className="relative w-full sm:w-96">
              <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by counter, staff, ID, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 animate-fade-in-up relative" style={{ animationDelay: "0.2s", opacity: 0 }}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 text-emerald-600">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Fetching counters...</p>
              </div>
            ) : (
              <div className="overflow-visible pb-32">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="p-4 sm:px-6">Counter Details</th>
                      <th className="p-4">Assigned Panel Member</th>
                      <th className="p-4">Location</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {filteredCounters.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-12 text-gray-400 font-medium">
                          No counters found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredCounters.map((counter, index) => {
                        const isBlocked = counter.status === "Blocked";
                        const isLocked = counter.status === "Locked";
                        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(counter.staffName || "C")}&background=random&color=fff&size=150`;

                        return (
                          <tr 
                            key={counter.id} 
                            className={`transition-colors group
                              ${activeDropdown === counter.id ? 'relative z-40' : 'relative z-0'}
                              ${isBlocked ? 'bg-red-50/40 hover:bg-red-50/60' : isLocked ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-gray-50/60'}
                            `}
                            style={{ animation: `fade-in-up 0.4s ease-out ${index * 0.1 + 0.3}s forwards`, opacity: 0 }}
                          >
                            <td className="p-4 sm:px-6 flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner shrink-0 transition-transform ${
                                isBlocked ? 'bg-red-100 text-red-600 border-red-200' : isLocked ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:scale-105'
                              }`}>
                                {isBlocked ? <Ban size={20} /> : isLocked ? <Lock size={20} /> : <Monitor size={20} />}
                              </div>
                              <div>
                                <div className={`font-bold text-base ${isBlocked ? 'text-red-900' : 'text-gray-900'}`}>
                                  {counter.counterName}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                                    ID: {String(counter.id).substring(0, 8)}
                                  </span>
                                  <span className="text-[10px] text-emerald-700 font-bold tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                                    <Monitor size={10} /> {counter.loginId || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              <div className={`flex items-center gap-3 ${isBlocked ? 'opacity-50 grayscale' : ''}`}>
                                <div className="relative shrink-0">
                                  <img 
                                    src={avatarUrl} 
                                    alt={counter.staffName} 
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                  />
                                  <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                    counter.status === "Active" ? "bg-emerald-500" : 
                                    counter.status === "Blocked" ? "bg-red-500" :
                                    "bg-gray-400"
                                  }`}></div>
                                </div>
                                <div>
                                  <div className={`font-bold ${isBlocked ? 'text-red-800 line-through' : 'text-gray-800'}`}>
                                    {counter.staffName || "Unassigned"}
                                  </div>
                                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                                    <Fingerprint size={10} className="text-gray-400"/> EMP: {counter.empNumber || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className={`p-4 font-medium ${isBlocked ? 'text-red-700/60' : 'text-gray-600'}`}>
                              <div className="flex items-center gap-1.5">
                                <MapPin size={16} className={isBlocked ? "text-red-400" : "text-gray-400"} />
                                {counter.location}
                              </div>
                            </td>

                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleToggleStatus(counter.id, counter.status)}
                                disabled={isBlocked || isLocked}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                                  isBlocked || isLocked ? "bg-gray-300 cursor-not-allowed opacity-50" :
                                  counter.status === "Active" ? "bg-emerald-600" : "bg-gray-300"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
                                    counter.status === "Active" ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                              <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
                                counter.status === 'Active' ? 'text-emerald-600' : 
                                counter.status === 'Blocked' ? 'text-red-600' : 
                                counter.status === 'Locked' ? 'text-amber-600' :
                                'text-gray-400'
                              }`}>
                                {counter.status}
                              </div>
                            </td>

                            <td className="p-4 text-center">
                              <div className="relative inline-block" ref={activeDropdown === counter.id ? dropdownRef : null}>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(activeDropdown === counter.id ? null : counter.id);
                                  }}
                                  className={`p-2 rounded-lg transition-colors focus:outline-none ${
                                    activeDropdown === counter.id ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                                  }`}
                                >
                                  <MoreVertical size={20} />
                                </button>

                                {activeDropdown === counter.id && (
                                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 p-2 z-[60] animate-pop-in origin-top-right text-left">
                                    <div className="px-3 py-2 border-b border-gray-50 mb-1">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Settings for {counter.counterName}</span>
                                    </div>
                                    
                                    <button 
                                      onClick={() => {
                                        setActiveDropdown(null);
                                        setPasswordModal({ isOpen: true, counterId: counter.id, counterName: counter.counterName });
                                      }}
                                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 text-sm font-semibold text-gray-700 transition-colors group"
                                    >
                                      <Key size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors" /> 
                                      Change Password
                                    </button>
                                    
                                    <button 
                                      onClick={() => handleUpdateStatus(counter.id, isLocked ? "Active" : "Locked")}
                                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-amber-50 flex items-center gap-3 text-sm font-semibold text-amber-700 transition-colors group"
                                    >
                                      {isLocked ? <Monitor size={16} className="text-amber-500" /> : <Lock size={16} className="text-gray-400 group-hover:text-amber-600 transition-colors" />}
                                      {isLocked ? "Wake System" : "Sleep / Lock Counter"}
                                    </button>

                                    <button 
                                      onClick={() => openReportModal(counter)}
                                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 text-sm font-semibold text-gray-700 transition-colors group"
                                    >
                                      <BarChart3 size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" /> 
                                      View Reports
                                    </button>

                                    <div className="my-1 border-t border-gray-50"></div>

                                    <button 
                                      onClick={() => handleUpdateStatus(counter.id, isBlocked ? "Active" : "Blocked")}
                                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-50 flex items-center gap-3 text-sm font-semibold text-red-600 transition-colors group"
                                    >
                                      <Ban size={16} className={isBlocked ? "text-red-500" : "text-red-400 group-hover:text-red-600 transition-colors"} /> 
                                      {isBlocked ? "Unblock Counter" : "Block Counter"}
                                    </button>

                                    <button 
                                      onClick={() => handleDelete(counter.id)}
                                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-50 flex items-center gap-3 text-sm font-semibold text-red-600 transition-colors group"
                                    >
                                      <Trash2 size={16} className="text-red-400 group-hover:text-red-600 transition-colors" /> 
                                      Remove System
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ================= REAL-TIME REPORTS MODAL ================= */}
      {reportModal.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 max-w-2xl w-full p-6 sm:p-8 relative overflow-hidden animate-pop-in">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <BarChart3 className="text-blue-600" size={24} /> Performance Report
                </h3>
                <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-wider">
                  {reportModal.counterName} • ID: {String(reportModal.counterId).substring(0,8)}
                </p>
              </div>
              <button 
                onClick={() => setReportModal({ isOpen: false, counterId: null, counterName: "" })}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {isReportLoading || !reportData ? (
              <div className="flex flex-col items-center justify-center py-16 text-blue-600">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Gathering real-time analytics...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                      <IndianRupee size={18} />
                    </div>
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Today's Revenue</p>
                    <h4 className="text-3xl font-black text-blue-900">₹{reportData.revenueToday}</h4>
                  </div>
                  
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                      <ShoppingBag size={18} />
                    </div>
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Orders Processed Today</p>
                    <h4 className="text-3xl font-black text-emerald-900">{reportData.ordersToday}</h4>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-2xl p-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Weekly Order Trend</p>
                  <div className="h-32 flex items-end justify-between gap-2 px-2">
                    {reportData.weeklyTrend.map((trend, i) => {
                      const maxTrend = Math.max(...reportData.weeklyTrend.map(t => t.count), 1);
                      const heightPercentage = Math.max((trend.count / maxTrend) * 100, 2); 
                      
                      return (
                        <div key={i} className="w-8 flex flex-col justify-end items-center gap-2 group h-full">
                          <div 
                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg hover:opacity-80 transition-all relative animate-grow-up mt-auto"
                            style={{ height: `${heightPercentage}%`, animationDelay: `${i * 0.1}s` }}
                          >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">
                              {trend.count}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
                    {reportData.weeklyTrend.map((trend, i) => (
                      <span key={i}>{trend.day}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= ADD COUNTER MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 max-w-xl w-full p-6 sm:p-8 relative overflow-hidden animate-pop-in">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Store className="text-emerald-600" size={20} /> Add New Counter
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCounter} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Counter Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Counter 5"
                    value={formData.counterName}
                    onChange={(e) => setFormData({...formData, counterName: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Login ID / Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. term05_login"
                    value={formData.loginId}
                    onChange={(e) => setFormData({...formData, loginId: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Panel Member (Staff)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amit Kumar"
                    value={formData.staffName}
                    onChange={(e) => setFormData({...formData, staffName: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Staff Emp ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NIN-E1045"
                    value={formData.empNumber}
                    onChange={(e) => setFormData({...formData, empNumber: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location Block</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Location</option>
                    <option value="Main Block">Main Block</option>
                    <option value="Hostel Block">Hostel Block</option>
                    <option value="Research Block">Research Block</option>
                    <option value="Guest House">Guest House</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="Active">Active (Open for Orders)</option>
                    <option value="Inactive">Inactive (Closed)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} 
                  Register Counter
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= CHANGE PASSWORD MODAL ================= */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 max-w-sm w-full p-6 sm:p-8 relative overflow-hidden animate-pop-in">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Key className="text-emerald-600" size={20} /> Change Password
              </h3>
              <button 
                onClick={() => {
                  setPasswordModal({ isOpen: false, counterId: null, counterName: "" });
                  setPasswords({ newPass: "", confirmPass: "", showNew: false, showConfirm: false });
                }}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Updating credentials for</p>
              <p className="text-emerald-800 font-black">{passwordModal.counterName}</p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type={passwords.showNew ? "text" : "password"}
                    required
                    placeholder="Enter new password"
                    value={passwords.newPass}
                    onChange={(e) => setPasswords({...passwords, newPass: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-12 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswords({...passwords, showNew: !passwords.showNew})}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
                  >
                    {passwords.showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm Password</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type={passwords.showConfirm ? "text" : "password"}
                    required
                    placeholder="Confirm new password"
                    value={passwords.confirmPass}
                    onChange={(e) => setPasswords({...passwords, confirmPass: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-12 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswords({...passwords, showConfirm: !passwords.showConfirm})}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
                  >
                    {passwords.showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} 
                  Update Credentials
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}