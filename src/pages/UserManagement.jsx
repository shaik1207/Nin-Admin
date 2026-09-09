import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { apiCall } from "../utils/api";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Filter,
  X,
  Shield,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Users,
  Briefcase,
  MonitorSmartphone,
  Mail,
  Phone
} from "lucide-react";

export default function UserManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  
  // Category Tab State: "customers", "management", "counters"
  const [activeCategory, setActiveCategory] = useState("customers");
  
  // Data State
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    password: "",
    role: "customer"
  });

  // Categorized Roles for Filters
  const roles = {
    management: ["admin", "convener", "co_convener", "member_secretary", "member", "inventory_supervisor", "inventory_staff"],
    customers: ["customer"],
    counters: ["counter_staff"]
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall("/admin/users", { method: "GET" });
      setUsers(response.data || []);
    } catch (error) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Add New User
  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await apiCall("/admin/users", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      
      setUsers([response.data, ...users]);
      toast.success("Account created successfully!");
      setIsModalOpen(false);
      setFormData({ name: "", email: "", mobileNumber: "", password: "", role: "customer" });
    } catch (error) {
      toast.error(error.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Block / Unblock (Active status)
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    
    // Optimistic UI Update
    setUsers(users.map(user => user.id === id ? { ...user, isActive: newStatus } : user));

    try {
      await apiCall(`/admin/users/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ isActive: newStatus })
      });
      toast.success(`Account ${newStatus ? 'activated' : 'suspended'}`);
    } catch (error) {
      // Revert on failure
      setUsers(users.map(user => user.id === id ? { ...user, isActive: currentStatus } : user));
      toast.error(error.message || "Failed to update status");
    }
  };

  // Handle Delete User
  const executeDelete = async () => {
    if (!deleteUser) return;
    try {
      await apiCall(`/admin/users/${deleteUser.id}`, { method: "DELETE" });
      setUsers(users.filter(user => user.id !== deleteUser.id));
      toast.success(`${deleteUser.name} deleted successfully`);
      setDeleteUser(null);
    } catch (error) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  // Complex Filtering Logic
  const filteredUsers = users.filter((user) => {
    // 1. Search Filter
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(user.id).toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Category Tab Filter
    let matchesCategory = false;
    if (activeCategory === "customers") matchesCategory = user.role === "customer";
    else if (activeCategory === "counters") matchesCategory = user.role === "counter_staff";
    else matchesCategory = roles.management.includes(user.role);

    // 3. Dropdown Role Filter
    const matchesRole = roleFilter === "All" || user.role === roleFilter;

    return matchesSearch && matchesCategory && matchesRole;
  });

  // Determine which roles to show in the dropdown based on active tab
  const currentDropdownRoles = roles[activeCategory] || [];

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-900">
      <Toaster position="top-right" />
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
      
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Navbar />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in-up">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                <Shield className="text-emerald-600" size={28} />
                Access Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage system users, login credentials, and department roles.
              </p>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-sm shadow-emerald-600/20 active:scale-95 shrink-0"
            >
              <Plus size={18} />
              Add Account
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex p-1 bg-white border border-gray-200 rounded-xl w-fit mb-6 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.05s", opacity: 0 }}>
            <button
              onClick={() => { setActiveCategory("customers"); setRoleFilter("All"); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeCategory === "customers" ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:text-gray-900"}`}
            >
              <Users size={16} /> Customers
            </button>
            <button
              onClick={() => { setActiveCategory("management"); setRoleFilter("All"); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeCategory === "management" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:text-gray-900"}`}
            >
              <Briefcase size={16} /> Management & Staff
            </button>
            <button
              onClick={() => { setActiveCategory("counters"); setRoleFilter("All"); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeCategory === "counters" ? "bg-purple-50 text-purple-700" : "text-gray-500 hover:text-gray-900"}`}
            >
              <MonitorSmartphone size={16} /> Counters
            </button>
          </div>

          {/* Advanced Toolbar (Search & Filter) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
            
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or login email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
              />
            </div>

            <div className="relative w-full sm:w-64">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all cursor-pointer appearance-none"
              >
                <option value="All">All Roles in View</option>
                {currentDropdownRoles.map(role => (
                  <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Premium Data Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 text-emerald-600">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Fetching accounts...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                      <th className="py-4 px-6 rounded-tl-2xl">Profile Info</th>
                      <th className="py-4 px-6">Login Details</th>
                      <th className="py-4 px-6">Assigned Role</th>
                      <th className="py-4 px-6 text-center">Access Status</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-50 text-sm">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                        
                        {/* 1. Profile Info */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                              user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 
                              user.role === 'counter_staff' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{user.name}</p>
                              <p className="text-xs font-medium text-gray-400 mt-0.5">ID: #{String(user.id).substring(0, 8)}</p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Login Details (Email & Phone) */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail size={14} className="text-gray-400" />
                            <p className="text-gray-900 font-semibold">{user.email || 'N/A'}</p>
                          </div>
                          {user.mobileNumber && (
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-gray-400" />
                              <p className="text-xs text-gray-500 font-medium">{user.mobileNumber}</p>
                            </div>
                          )}
                        </td>

                        {/* 3. Role Badge */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="text-gray-700 font-bold bg-gray-100 px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider">
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>

                        {/* 4. Status Badge */}
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold border ${
                            user.isActive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {user.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>

                        {/* 5. Actions */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {user.isActive ? (
                              <button 
                                onClick={() => toggleStatus(user.id, user.isActive)}
                                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Suspend Account Access"
                              >
                                <UserX size={18} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => toggleStatus(user.id, user.isActive)}
                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Restore Account Access"
                              >
                                <UserCheck size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => setDeleteUser(user)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Permanently Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                    
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-16 text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
                            <Search className="text-gray-400" size={24} />
                          </div>
                          <p className="text-gray-900 font-bold text-lg">No accounts found</p>
                          <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search term.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  
                </table>
              </div>
            )}
            
            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Showing <span className="font-bold text-gray-900">{filteredUsers.length}</span> {activeCategory}
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* ================= ADD USER MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 max-w-lg w-full p-6 sm:p-8 relative overflow-hidden" style={{ animation: "fade-in-up 0.3s ease-out forwards" }}>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Shield className="text-emerald-600" size={20} /> Provision New Account
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assign Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer appearance-none uppercase tracking-wide"
                  >
                    <optgroup label="Management">
                      {roles.management.map(role => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}
                    </optgroup>
                    <optgroup label="Counters">
                      <option value="counter_staff">Counter Staff</option>
                    </optgroup>
                    <optgroup label="Public">
                      <option value="customer">Customer</option>
                    </optgroup>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Display Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Login Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@nin.in"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Initial Password</label>
                  <input
                    type="text"
                    required
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} 
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 max-w-sm w-full p-6 sm:p-8 text-center relative overflow-hidden" style={{ animation: "fade-in-up 0.3s ease-out forwards" }}>
            
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Delete Account?</h3>
            <p className="text-gray-500 font-medium text-sm mb-6">
              Are you sure you want to permanently delete the account for <strong>{deleteUser.name}</strong> ({deleteUser.email})? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteUser(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-red-900/20 active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}