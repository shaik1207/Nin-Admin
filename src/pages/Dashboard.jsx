import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { apiCall } from "../utils/api";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Users,
  Utensils,
  ShoppingCart,
  TrendingUp,
  PlusCircle,
  FileText,
  UserPlus,
  Loader2,
  ArrowRight,
  Clock,
  Package,
  Check,
  BarChart3,
  CalendarDays
} from "lucide-react";

// --- SMART IMAGE HANDLER ---
const MenuImage = ({ item }) => {
  const [imgError, setImgError] = useState(false);
  const src = item.image || item.imageUrl;
  
  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
  };

  if (!src || imgError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold text-sm">
        {item.name ? item.name.charAt(0).toUpperCase() : 'M'}
      </div>
    );
  }

  return (
    <img 
      src={getFullUrl(src)} 
      alt={item.name} 
      onError={() => setImgError(true)} 
      className="w-full h-full object-cover" 
    />
  );
};

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [groupedMenu, setGroupedMenu] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // --- REAL-TIME CHART STATE ---
  const [weeklyData, setWeeklyData] = useState([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(6); // Default to today (index 6 in a 7-day array)

  const userName = localStorage.getItem("userName") || "Admin";

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Helper to dynamically calculate the last 7 days of sales from real backend orders
  const generateWeeklyData = (orders) => {
    const week = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create an array representing the last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      week.push({
        dateObj: d, 
        day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        revenue: 0,
        items: { Rice: 0, Tea: 0, Snacks: 0 }
      });
    }

    // Populate the array with real order data
    orders.forEach(order => {
      if (order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'completed') {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);

        // Find which day this order belongs to
        const dayIndex = week.findIndex(w => w.dateObj.getTime() === orderDate.getTime());
        
        if (dayIndex !== -1) {
          week[dayIndex].revenue += Number(order.totalAmount || 0);
          
          // Categorize and count items sold
          (order.items || []).forEach(item => {
            const name = (item.name || "").toLowerCase();
            const cat = (item.category || "").toLowerCase();
            const qty = Number(item.quantity || 1);

            if (name.includes('rice') || name.includes('meal') || name.includes('thali') || cat.includes('meal')) {
              week[dayIndex].items.Rice += qty;
            } else if (name.includes('tea') || name.includes('coffee') || name.includes('beverage') || cat.includes('beverage')) {
              week[dayIndex].items.Tea += qty;
            } else {
              week[dayIndex].items.Snacks += qty;
            }
          });
        }
      }
    });

    return week;
  };

  // 1. Fetch Data
  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      
      const [statsRes, ordersRes, menuRes] = await Promise.all([
        apiCall("/admin/reports/dashboard", { method: "GET" }).catch(() => ({ data: {} })),
        apiCall("/admin/orders", { method: "GET" }).catch(() => ({ data: [] })),
        apiCall("/menu", { method: "GET" }).catch(() => ({ data: [] }))
      ]);

      const allOrders = ordersRes.data || [];
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      
      const todaysOrders = allOrders.filter(o => new Date(o.createdAt) >= startOfToday);
      const activeOrders = todaysOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Completed' && o.status !== 'Cancelled');
      const deliveredOrders = todaysOrders.filter(o => o.status === 'Delivered' || o.status === 'Completed');
      const realTimeRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      setStats({
        totalUsers: statsRes.data?.totalUsers || 0,
        totalMenuItems: menuRes.data?.length || 0,
        activeOrders: statsRes.data?.activeOrders || activeOrders.length,
        revenueToday: statsRes.data?.revenueToday || realTimeRevenue
      });

      setRecentOrders(statsRes.data?.recentOrders || todaysOrders.slice(0, 5));

      // Generate dynamic real-time chart data
      const dynamicWeeklyData = generateWeeklyData(allOrders);
      setWeeklyData(dynamicWeeklyData);

      const menuItems = menuRes.data || [];
      const grouped = menuItems.reduce((acc, item) => {
        if (item.isAvailable === false) return acc; 
        const cat = item.category || "General";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {});
      setGroupedMenu(grouped);

    } catch (error) {
      console.error("Dashboard Error:", error);
      if (!silent) toast.error("Failed to load dashboard metrics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(); 
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateOrderStatus = async (orderIdToUpdate, newStatus = "Delivered") => {
    if (!orderIdToUpdate) return;
    try {
      await apiCall(`/admin/orders/${orderIdToUpdate}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      
      toast.success(`Order ${orderIdToUpdate} marked as ${newStatus}!`, {
        icon: '✅',
        style: { borderRadius: '10px', background: '#ecfdf5', color: '#065f46', fontWeight: 'bold' },
      });
      fetchDashboardData(true); 
    } catch (error) {
      toast.error(error.message || `Failed to update order ${orderIdToUpdate}`);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'preparing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ready': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'delivered': 
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // --- DYNAMIC CHART SCALING ---
  // Calculates the highest revenue and highest item count to scale the charts correctly
  const maxRevenue = Math.max(...weeklyData.map(d => d.revenue), 1000); 
  const maxRiceItems = Math.max(...weeklyData.map(d => d.items.Rice), 10); 

  // --- SVG Path Generation for Line Chart ---
  const generateLinePath = () => {
    if (weeklyData.length === 0) return "";
    return weeklyData.map((d, i) => {
      const x = i * (100 / 6);
      const y = 100 - (d.items.Rice / maxRiceItems) * 100;
      return `${x},${y}`;
    }).join(" ");
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Toaster position="top-right" />
      
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); }
      `}</style>

      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full pb-24">
          
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              {getGreeting()}, {userName.split(" ")[0]}
            </h1>
            <p className="text-gray-500 font-medium mt-1.5 flex items-center gap-2">
              <Clock size={16} className="text-emerald-600" />
              {currentDate} • ICMR-NIN Canteen Operations
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-emerald-600">
              <Loader2 size={48} className="animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Syncing with secure SQL database...</p>
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.1s" }}>
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-out blur-2xl"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                      <Users size={24} />
                    </div>
                  </div>
                  <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Registered Staff</h3>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{stats?.totalUsers || 0}</h1>
                </div>

                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.2s" }}>
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-orange-500 to-yellow-400 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-out blur-2xl"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                      <ShoppingCart size={24} />
                    </div>
                  </div>
                  <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Active Orders</h3>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{stats?.activeOrders || 0}</h1>
                </div>

                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.3s" }}>
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-400 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-out blur-2xl"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                      <Utensils size={24} />
                    </div>
                  </div>
                  <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Available Menu Items</h3>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{stats?.totalMenuItems || 0}</h1>
                </div>

                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.4s" }}>
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-400 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-out blur-2xl"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <TrendingUp size={24} />
                    </div>
                  </div>
                  <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Today's Revenue</h3>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">₹{stats?.revenueToday?.toLocaleString('en-IN') || 0}</h1>
                </div>
              </div>

              {/* Middle Section: Recent Orders & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                
                {/* Recent Orders (2 Columns) */}
                <div className="lg:col-span-2 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.5s" }}>
                  <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <Package className="text-emerald-500" size={20} />
                        Live Orders
                      </h2>
                      <Link to="/orders" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                        Manage Orders <ArrowRight size={16} />
                      </Link>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <th className="pb-3 px-2">Order ID</th>
                            <th className="pb-3 px-2">Customer</th>
                            <th className="pb-3 px-2">Status</th>
                            <th className="pb-3 px-2 text-center">Amount</th>
                            <th className="pb-3 px-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {recentOrders.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="py-12 text-center">
                                <div className="inline-flex w-12 h-12 bg-gray-50 rounded-full items-center justify-center mb-2">
                                  <Package className="text-gray-400" size={24} />
                                </div>
                                <p className="text-sm font-bold text-gray-900">No active orders today.</p>
                                <p className="text-xs text-gray-500 mt-1">Waiting for users to place new orders...</p>
                              </td>
                            </tr>
                          ) : (
                            recentOrders.map((order) => (
                              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-3 px-2 text-sm font-bold text-gray-900">
                                  #{String(order.orderId || order.id).substring(0, 8).toUpperCase()}
                                </td>
                                <td className="py-3 px-2 text-sm font-medium text-gray-600">
                                  {order.user?.name || "Counter Order"}
                                </td>
                                <td className="py-3 px-2">
                                  <span className={`px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold border ${getStatusColor(order.status)}`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-sm font-black text-emerald-700 text-center">
                                  ₹{order.totalAmount}
                                </td>
                                <td className="py-3 px-2 text-right">
                                  {order.status?.toLowerCase() !== 'delivered' && order.status?.toLowerCase() !== 'completed' ? (
                                    <button 
                                      onClick={() => handleUpdateOrderStatus(order.id, "Delivered")}
                                      className="inline-flex items-center gap-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                                    >
                                      <Check size={14} /> Serve
                                    </button>
                                  ) : (
                                    <span className="text-xs font-bold text-gray-400 italic">Done</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Quick Actions (1 Column) */}
                <div className="lg:col-span-1 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.6s" }}>
                  <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm h-full">
                    <h2 className="text-lg font-black text-gray-900 mb-6">Quick Actions</h2>
                    <div className="space-y-3">
                      <Link to="/menu" className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <PlusCircle size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Add Menu Item</h4>
                          <p className="text-xs text-gray-500 font-medium">Update today's canteen food</p>
                        </div>
                      </Link>
                      
                      <Link to="/users" className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <UserPlus size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Manage Staff</h4>
                          <p className="text-xs text-gray-500 font-medium">Assign roles and permissions</p>
                        </div>
                      </Link>

                      <Link to="/reports" className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Generate Reports</h4>
                          <p className="text-xs text-gray-500 font-medium">Download EOD sales data</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Section: Analytics & Menu Widget */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                
                {/* 📊 REVENUE & ITEM ANALYTICS (2 Columns) */}
                <div className="lg:col-span-2 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.7s" }}>
                  <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col h-full min-h-[420px]">
                    
                    {/* Header & Legend */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                      <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <BarChart3 className="text-emerald-500" size={20} />
                        Revenue & Items Analytics
                      </h2>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Revenue</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rice Sold</span>
                        </div>
                      </div>
                    </div>

                    {/* COMBO CHART AREA */}
                    <div className="relative h-56 w-full px-4 sm:px-8 mt-4 mb-4">
                      
                      {/* Line Chart Overlay (Absolute) */}
                      <div className="absolute inset-0 z-20 pointer-events-none px-6 sm:px-10">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="#F59E0B" // Amber-500
                            strokeWidth="3"
                            vectorEffect="non-scaling-stroke"
                            points={generateLinePath()}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {weeklyData.map((d, i) => (
                            <circle
                              key={i}
                              cx={i * (100 / 6)}
                              cy={100 - (d.items.Rice / maxRiceItems) * 100}
                              r="4"
                              fill="#FFF"
                              stroke="#F59E0B"
                              strokeWidth="2"
                              vectorEffect="non-scaling-stroke"
                              className={`transition-all duration-300 ${selectedDayIndex === i ? 'r-6 stroke-[3px]' : ''}`}
                            />
                          ))}
                        </svg>
                      </div>

                      {/* 3D Bar Chart Flex Container */}
                      <div className="absolute inset-0 px-6 sm:px-10 flex justify-between items-end z-10 h-full pb-6">
                        {weeklyData.map((d, index) => {
                          const isSelected = selectedDayIndex === index;
                          const barHeight = (d.revenue / maxRevenue) * 100;
                          
                          return (
                            <div
                              key={index}
                              onClick={() => setSelectedDayIndex(index)}
                              className="relative group w-8 sm:w-10 h-full flex flex-col justify-end cursor-pointer"
                            >
                              {/* 3D Bar Element */}
                              <div 
                                className={`w-full relative transition-all duration-500 ${isSelected ? 'bg-emerald-500 z-10' : 'bg-emerald-400 opacity-70 group-hover:opacity-100 z-0'}`} 
                                style={{ height: `${barHeight}%` }}
                              >
                                {/* Top Face */}
                                <div 
                                  className={`absolute h-[10px] w-full left-0 top-[1px] origin-bottom transition-colors duration-500 ${isSelected ? 'bg-emerald-300' : 'bg-emerald-200'}`} 
                                  style={{ transform: 'translateY(-100%) skewX(-45deg)' }}
                                ></div>
                                {/* Right Face */}
                                <div 
                                  className={`absolute h-full w-[10px] right-[1px] top-0 origin-left transition-colors duration-500 ${isSelected ? 'bg-emerald-700' : 'bg-emerald-600'}`} 
                                  style={{ transform: 'translateX(100%) skewY(-45deg)' }}
                                ></div>
                              </div>
                              
                              {/* X-Axis Label */}
                              <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold transition-colors duration-300 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                                {d.day}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* DYNAMIC DETAILS PANEL */}
                    <div className="mt-auto pt-6 border-t border-gray-100 bg-gray-50/50 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 px-6 sm:px-8 py-6 rounded-b-[1.5rem]">
                      {weeklyData.length > 0 && (
                        <>
                          <div className="flex items-center gap-2 mb-4">
                            <CalendarDays size={16} className="text-gray-400" />
                            <h3 className="text-sm font-bold text-gray-900">
                              Data for {weeklyData[selectedDayIndex]?.day}, {weeklyData[selectedDayIndex]?.date}
                            </h3>
                          </div>
                          
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Total Revenue</p>
                              <h4 className="text-lg sm:text-2xl font-black text-emerald-600">₹{weeklyData[selectedDayIndex]?.revenue}</h4>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Rice / Meals</p>
                              <h4 className="text-lg sm:text-2xl font-black text-amber-500">{weeklyData[selectedDayIndex]?.items.Rice}</h4>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Beverages</p>
                              <h4 className="text-lg sm:text-2xl font-black text-blue-500">{weeklyData[selectedDayIndex]?.items.Tea}</h4>
                            </div>
                            <div className="hidden sm:block">
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Snacks</p>
                              <h4 className="text-lg sm:text-2xl font-black text-purple-500">{weeklyData[selectedDayIndex]?.items.Snacks}</h4>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                  </div>
                </div>

                {/* Today's Menu Widget (1 Column) */}
                <div className="lg:col-span-1 animate-fade-in-up" style={{ opacity: 0, animationDelay: "0.8s" }}>
                  <div className="bg-white rounded-[1.5rem] p-0 border border-gray-100 shadow-sm h-full min-h-[420px] flex flex-col relative overflow-hidden">
                    
                    <div className="p-6 border-b border-gray-100 shrink-0 bg-white z-10">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                          <Utensils className="text-emerald-500" size={20} />
                          Today's Live Menu
                        </h2>
                        <Link to="/menu" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">View All</Link>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50/30 custom-scrollbar">
                      {Object.keys(groupedMenu).length === 0 ? (
                        <p className="text-gray-500 text-sm py-4 font-medium text-center">No menu items active today.</p>
                      ) : (
                        Object.entries(groupedMenu).map(([category, items]) => (
                          <div key={category} className="space-y-3">
                            <div className="flex items-center gap-3">
                              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{category}</h3>
                              <div className="flex-1 h-px bg-gray-200"></div>
                            </div>
                            
                            <div className="space-y-2">
                              {items.map(item => (
                                <div key={item.id} className="bg-white hover:bg-gray-50 border border-gray-100 p-2 rounded-xl flex items-center gap-3 transition-colors shadow-sm">
                                  
                                  <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100">
                                    <MenuImage item={item} />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                                    <p className="text-[10px] font-semibold text-gray-500 truncate">
                                      {item.description || "Fresh & Delicious"}
                                    </p>
                                  </div>

                                  <div className="text-right pr-2">
                                    <span className="text-xs font-black text-emerald-700">₹{item.price}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
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