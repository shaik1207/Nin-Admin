import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { apiCall } from "../utils/api";
import toast, { Toaster } from "react-hot-toast";
import {
  Search,
  Download,
  ShieldCheck,
  User,
  Clock3,
  Activity,
  FileSpreadsheet,
  FileText,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  XCircle,
  CheckCircle2
} from "lucide-react";

export default function Logs() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  
  // Real-time Data State
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, today: 0, activeStaff: 0 });

  // Export Dropdown State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef(null);

  // Download Animation States
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadType, setDownloadType] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Logs from Backend
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall("/admin/logs", { method: "GET" });
      const logsData = response.data || [];
      
      const todayStr = new Date().toDateString();
      const todayLogs = logsData.filter(log => new Date(log.createdAt).toDateString() === todayStr);
      const uniqueUsersToday = new Set(todayLogs.map(log => log.userId).filter(Boolean)).size;

      setStats({
        total: logsData.length,
        today: todayLogs.length,
        activeStaff: uniqueUsersToday
      });

      setLogs(logsData);
    } catch (error) {
      toast.error("Failed to load activity logs");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getModuleStyle = (moduleName) => {
    const module = (moduleName || "").toLowerCase();
    if (module.includes("auth")) return "bg-purple-50 text-purple-700 border-purple-100";
    if (module.includes("menu") || module.includes("food")) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (module.includes("category")) return "bg-blue-50 text-blue-700 border-blue-100";
    if (module.includes("counter") || module.includes("order")) return "bg-orange-50 text-orange-700 border-orange-100";
    if (module.includes("report")) return "bg-indigo-50 text-indigo-700 border-indigo-100";
    if (module.includes("user")) return "bg-pink-50 text-pink-700 border-pink-100";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  // Active Filtering Logic
  const filteredLogs = logs.filter(log => {
    const userName = log.user?.name || "System";
    const role = log.user?.role?.replace('_', ' ') || "";
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = 
      userName.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.module.toLowerCase().includes(searchLower) ||
      role.toLowerCase().includes(searchLower) ||
      String(log.id).toLowerCase().includes(searchLower);

    let matchesDate = true;
    if (filterDate) {
      const logDateObj = new Date(log.createdAt);
      const logDateString = `${logDateObj.getFullYear()}-${String(logDateObj.getMonth() + 1).padStart(2, '0')}-${String(logDateObj.getDate()).padStart(2, '0')}`;
      matchesDate = logDateString === filterDate;
    }

    return matchesSearch && matchesDate;
  });

  // ACTUAL DEVICE DOWNLOAD LOGIC (CSV GENERATION)
  const downloadActualCSV = () => {
    // 1. Create CSV Headers
    const headers = ["Log ID", "User", "Role", "Module", "Action", "Date", "Time"];
    
    // 2. Map data to rows (wrapped in quotes to prevent commas from breaking the layout)
    const rows = filteredLogs.map(log => {
      const dateObj = new Date(log.createdAt);
      return [
        `#${String(log.id).substring(0, 8).toUpperCase()}`,
        `"${log.user?.name || 'System'}"`,
        `"${log.user?.role?.replace('_', ' ') || 'Automated Process'}"`,
        `"${log.module}"`,
        `"${log.action}"`,
        dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      ].join(",");
    });

    // 3. Combine headers and rows
    const csvContent = [headers.join(","), ...rows].join("\n");
    
    // 4. Create a Blob and physically trigger a hidden download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ICMR_Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Handler (Animation + Execution)
  const handleDownload = (type) => {
    if (filteredLogs.length === 0) {
      toast.error("No logs to download based on current filters.");
      return;
    }

    setIsExportOpen(false);
    setDownloadType(type);
    setIsDownloading(true);
    setDownloadProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 10; 
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Wait 800ms at 100% so user sees completion, then trigger real download
        setTimeout(() => {
          setIsDownloading(false);
          if (type === "CSV") {
            downloadActualCSV();
            toast.success("CSV file downloaded to your device!");
          } else if (type === "PDF") {
            // Natively triggers the browser's PDF Print saving interface
            window.print(); 
          }
        }, 800);
      }
      setDownloadProgress(progress);
    }, 300);
  };

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
        .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pop-in { animation: pop-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        /* Hide UI elements when printing for PDF export */
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        {/* Added pt-4 to give extra breathing room under the Navbar */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full pb-24 pt-4 sm:pt-8" id="print-area">
          
          {/* Header Section - REMOVED z-50 to stop it overlapping the sticky Navbar */}
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in-up">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <Activity className="text-emerald-600" size={32} />
                Activity Logs
              </h1>
              <p className="text-sm font-medium text-gray-500 mt-1">
                Track all administrative and staff actions across the system.
              </p>
            </div>

            <div className="relative" ref={exportRef}>
              <button 
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-full flex items-center gap-2 font-bold text-sm shadow-md shadow-emerald-900/10 transition-all active:scale-95 shrink-0"
              >
                <Download size={18} />
                Export Logs
              </button>

              {isExportOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 p-2 z-[60] animate-pop-in origin-top-right text-left overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-50 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Export Format</span>
                  </div>
                  <button 
                    onClick={() => handleDownload("CSV")}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-emerald-50 flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors group"
                  >
                    <FileSpreadsheet size={16} className="text-emerald-500 group-hover:text-emerald-600 transition-colors" /> 
                    CSV Document
                  </button>
                  <button 
                    onClick={() => handleDownload("PDF")}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-50 flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-red-700 transition-colors group"
                  >
                    <FileText size={16} className="text-red-500 group-hover:text-red-600 transition-colors" /> 
                    PDF Document
                  </button>
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-emerald-600">
              <Loader2 size={48} className="animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Fetching system logs...</p>
            </div>
          ) : (
            <>
              <div className="relative z-0 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 mb-8">
                
                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.1s" }}>
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-400 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-out blur-2xl"></div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-4">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Total Activities</h3>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{stats.total.toLocaleString()}</h1>
                </div>

                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.2s" }}>
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-out blur-2xl"></div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-4">
                    <User size={24} />
                  </div>
                  <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Active Staff Today</h3>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{stats.activeStaff}</h1>
                </div>

                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.3s" }}>
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-orange-500 to-yellow-400 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-out blur-2xl"></div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 mb-4">
                    <Clock3 size={24} />
                  </div>
                  <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Today's Logs</h3>
                  <div className="flex items-end gap-3">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{stats.today}</h1>
                  </div>
                </div>

              </div>

              <div className="relative z-0 bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-4 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.4s" }}>
                
                <div className="relative w-full lg:flex-1 max-w-md">
                  <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search logs by user, action, or module..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto">
                  <div className="relative flex items-center min-w-[200px]">
                    <Calendar className="absolute left-4 text-gray-400 pointer-events-none" size={18} />
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-10 text-sm font-medium text-gray-600 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                    />
                    {filterDate && (
                      <button 
                        onClick={() => setFilterDate("")}
                        className="absolute right-3 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 pl-2"
                        title="Clear Date"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>

                  {(searchTerm || filterDate) && (
                    <button 
                      onClick={() => { setSearchTerm(""); setFilterDate(""); }}
                      className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2.5 rounded-full text-sm font-bold transition-colors whitespace-nowrap border border-red-100"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              <div className="relative z-0 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up min-h-[400px]" style={{ opacity: 0, animationDelay: "0.5s" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Log Info</th>
                        <th className="py-4 px-6">User / Staff</th>
                        <th className="py-4 px-6">System Module</th>
                        <th className="py-4 px-6">Action Performed</th>
                        <th className="py-4 px-6 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-16">
                            <Filter size={40} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium text-base">No logs match your current filters.</p>
                            <button 
                              onClick={() => { setSearchTerm(""); setFilterDate(""); }}
                              className="mt-4 text-emerald-600 font-bold hover:underline"
                            >
                              Clear filters and try again
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log, index) => {
                          const userName = log.user?.name || "System";
                          const userRole = log.user?.role?.replace('_', ' ') || "Automated Process";
                          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff`;
                          
                          const dateObj = new Date(log.createdAt);
                          const formattedDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                          const formattedTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

                          return (
                            <tr 
                              key={log.id} 
                              className="hover:bg-gray-50/60 transition-colors group"
                              style={{ animation: `fade-in-up 0.4s ease-out ${index * 0.1 + 0.6}s forwards`, opacity: 0 }}
                            >
                              <td className="py-4 px-6">
                                <span className="font-bold text-gray-900">#{String(log.id).substring(0, 8).toUpperCase()}</span>
                              </td>

                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={avatarUrl} 
                                    alt={userName} 
                                    className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm"
                                  />
                                  <div>
                                    <div className="font-bold text-gray-900">{userName}</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{userRole}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${getModuleStyle(log.module)}`}>
                                  {log.module}
                                </span>
                              </td>

                              <td className="py-4 px-6">
                                <span className="font-medium text-gray-700">{log.action}</span>
                              </td>

                              <td className="py-4 px-6 text-right">
                                <div className="font-bold text-gray-900">{formattedTime}</div>
                                <div className="text-xs font-medium text-gray-400 mt-0.5">{formattedDate}</div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="bg-gray-50/30 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-sm font-medium text-gray-500">
                    Showing <span className="font-bold text-gray-900">{filteredLogs.length > 0 ? 1 : 0}</span> to <span className="font-bold text-gray-900">{filteredLogs.length}</span> of <span className="font-bold text-gray-900">{logs.length}</span> logs
                  </span>
                  <div className="flex gap-2">
                    <button className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all shadow-sm">
                      <ChevronLeft size={18} />
                    </button>
                    <button className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all shadow-sm">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

        </main>
      </div>

      {/* ================= DOWNLOADING PROGRESS MODAL ================= */}
      {isDownloading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 max-w-sm w-full p-8 text-center animate-pop-in flex flex-col items-center">
            
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
              downloadProgress === 100 ? "bg-emerald-100" : 
              downloadType === "CSV" ? "bg-blue-50" : "bg-red-50"
            }`}>
              {downloadProgress === 100 ? (
                <CheckCircle2 className="text-emerald-500 w-10 h-10" />
              ) : downloadType === "CSV" ? (
                <FileSpreadsheet className="text-blue-500 w-10 h-10 animate-pulse" />
              ) : (
                <FileText className="text-red-500 w-10 h-10 animate-pulse" />
              )}
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
              {downloadProgress === 100 ? "Download Complete!" : `Generating ${downloadType}...`}
            </h3>
            
            <p className="text-sm text-gray-500 font-medium mb-8">
              {downloadProgress === 100 
                ? "Your file has been saved to your device." 
                : "Please wait while we compile the requested logs and finalize the file formatting."}
            </p>

            <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-300 ease-out relative ${
                  downloadProgress === 100 ? "bg-emerald-500" : 
                  downloadType === "CSV" ? "bg-blue-500" : "bg-red-500"
                }`}
                style={{ width: `${downloadProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex justify-between w-full text-xs font-bold text-gray-400 mt-2 uppercase tracking-wider">
              <span>Progress</span>
              <span className={downloadProgress === 100 ? "text-emerald-500" : "text-gray-900"}>{downloadProgress}%</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}