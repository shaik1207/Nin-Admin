import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { apiCall } from "../utils/api";
import toast, { Toaster } from "react-hot-toast";
import {
  Calendar,
  Download,
  IndianRupee,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  Search,
  Filter,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Loader2
} from "lucide-react";

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Real-time Data State
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({ revenue: 0, orders: 0, users: 0, foods: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Export Dropdown State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef(null);

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

  // Fetch Reports Data from Backend
  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall("/admin/reports/overview", { method: "GET" });
      setSummary(response.data.summary);
      setReports(response.data.reports);
    } catch (error) {
      toast.error("Failed to load report data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter Logic
  const filteredReports = reports.filter(report => 
    report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatDate(report.date).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Toaster position="top-right" />
      
      {/* Custom Animations */}
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
      `}</style>

      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full pb-24">
          
          {/* Header Section */}
          <div className="relative z-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in-up">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <FileSpreadsheet className="text-emerald-600" size={32} />
                Reports Overview
              </h1>
              <p className="text-sm font-medium text-gray-500 mt-1">
                Track your daily revenue, orders, and user engagement metrics.
              </p>
            </div>

            {/* Export Dropdown Button */}
            <div className="relative" ref={exportRef}>
              <button 
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-full flex items-center gap-2 font-bold text-sm shadow-md shadow-emerald-900/10 transition-all active:scale-95 shrink-0"
              >
                <Download size={18} />
                Export
              </button>

              {/* Dropdown Menu */}
              {isExportOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 p-2 z-[60] animate-pop-in origin-top-right text-left">
                  <div className="px-3 py-2 border-b border-gray-50 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Export Format</span>
                  </div>
                  
                  <button 
                    onClick={() => { setIsExportOpen(false); toast.success("Downloading Excel file..."); }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-emerald-50 flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors group"
                  >
                    <FileSpreadsheet size={16} className="text-emerald-500 group-hover:text-emerald-600 transition-colors" /> 
                    Microsoft Excel
                  </button>
                  
                  <button 
                    onClick={() => { setIsExportOpen(false); toast.success("Generating PDF..."); }}
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
              <p className="text-gray-500 font-medium">Compiling reporting data...</p>
            </div>
          ) : (
            <>
              {/* Premium Summary Cards */}
              <div className="relative z-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-8">
                
                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.1s" }}>
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-400 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-out blur-2xl"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <IndianRupee size={24} />
                    </div>
                  </div>
                  <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Total Revenue</h3>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{formatCurrency(summary.revenue)}</h1>
                </div>

                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.2s" }}>
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-out blur-2xl"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                      <ShoppingBag size={24} />
                    </div>
                  </div>
                  <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Total Orders</h3>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{summary.orders}</h1>
                </div>

                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.3s" }}>
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-orange-500 to-yellow-400 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-out blur-2xl"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                      <Users size={24} />
                    </div>
                  </div>
                  <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Active Users</h3>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{summary.users}</h1>
                </div>

                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.4s" }}>
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-400 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-out blur-2xl"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                      <UtensilsCrossed size={24} />
                    </div>
                  </div>
                  <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Available Menu Items</h3>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{summary.foods}</h1>
                </div>

              </div>

              {/* Advanced Toolbar (Search & Filter) */}
              <div className="relative z-0 bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.5s" }}>
                
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by Report ID or Date..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Calendar className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    <input
                      type="date"
                      className="w-full sm:w-auto bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-4 text-sm font-medium text-gray-600 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                    />
                  </div>
                  <button className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:text-gray-900 text-gray-600 px-5 py-2.5 rounded-full text-sm font-bold transition-colors w-full sm:w-auto">
                    <Filter size={18} />
                    Filters
                  </button>
                </div>
              </div>

              {/* Premium Data Table */}
              <div className="relative z-0 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.6s" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Report ID</th>
                        <th className="py-4 px-6">Date</th>
                        <th className="py-4 px-6 text-right">Orders Processed</th>
                        <th className="py-4 px-6 text-right">Revenue Generated</th>
                        <th className="py-4 px-6 text-center">Unique Users</th>
                        <th className="py-4 px-6 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {filteredReports.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-gray-500 font-medium">
                            No report records found.
                          </td>
                        </tr>
                      ) : (
                        filteredReports.map((report, index) => (
                          <tr 
                            key={report.id} 
                            className="hover:bg-gray-50/60 transition-colors group"
                            style={{ animation: `fade-in-up 0.4s ease-out ${index * 0.1 + 0.7}s forwards`, opacity: 0 }}
                          >
                            <td className="py-4 px-6 font-bold text-gray-900 whitespace-nowrap">
                              {report.id}
                            </td>
                            <td className="py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                              {formatDate(report.date)}
                            </td>
                            <td className="py-4 px-6 text-right font-bold text-gray-700">
                              {report.orders}
                            </td>
                            <td className="py-4 px-6 text-right font-black text-emerald-700">
                              {formatCurrency(report.revenue)}
                            </td>
                            <td className="py-4 px-6 text-center font-medium text-gray-600">
                              {report.users}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                report.status === 'Completed' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {report.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Footer */}
                <div className="bg-gray-50/30 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-sm font-medium text-gray-500">
                    Showing <span className="font-bold text-gray-900">{filteredReports.length > 0 ? 1 : 0}</span> to <span className="font-bold text-gray-900">{filteredReports.length}</span> of <span className="font-bold text-gray-900">{reports.length}</span> results
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
    </div>
  );
}