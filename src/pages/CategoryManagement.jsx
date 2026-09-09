import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { apiCall } from "../utils/api";
import toast, { Toaster } from "react-hot-toast";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  FolderTree,
  Sunrise,
  Sun,
  Moon,
  Cookie,
  CupSoda,
  X,
  CheckCircle2,
  Loader2,
  AlertTriangle
} from "lucide-react";

export default function CategoryManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data & UI State
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Active"
  });

  // Fetch Categories on Mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall("/admin/categories", { method: "GET" });
      setCategories(response.data || []);
    } catch (error) {
      toast.error("Failed to load categories");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to dynamically render icons and colors based on category name
  const getCategoryMeta = (name) => {
    if (!name) return { icon: FolderTree, color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
    const lowerName = name.toLowerCase();
    if (lowerName.includes("breakfast")) return { icon: Sunrise, color: "text-orange-600 bg-orange-50 border-orange-100" };
    if (lowerName.includes("lunch")) return { icon: Sun, color: "text-amber-600 bg-amber-50 border-amber-100" };
    if (lowerName.includes("dinner")) return { icon: Moon, color: "text-indigo-600 bg-indigo-50 border-indigo-100" };
    if (lowerName.includes("snack")) return { icon: Cookie, color: "text-pink-600 bg-pink-50 border-pink-100" };
    if (lowerName.includes("beverage")) return { icon: CupSoda, color: "text-blue-600 bg-blue-50 border-blue-100" };
    return { icon: FolderTree, color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    
    // Optimistic UI Update
    setCategories(categories.map(cat => cat.id === id ? { ...cat, status: newStatus } : cat));

    try {
      await apiCall(`/admin/categories/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      toast.success(`Category marked as ${newStatus}`);
    } catch (error) {
      // Revert if API fails
      setCategories(categories.map(cat => cat.id === id ? { ...cat, status: currentStatus } : cat));
      toast.error(error.message || "Failed to update status");
    }
  };

  const executeDelete = async () => {
    if (!deleteItem) return;
    try {
      await apiCall(`/admin/categories/${deleteItem.id}`, { method: "DELETE" });
      setCategories(categories.filter(cat => cat.id !== deleteItem.id));
      toast.success(`${deleteItem.name} deleted successfully`);
      setDeleteItem(null);
    } catch (error) {
      toast.error(error.message || "Failed to delete category");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await apiCall("/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          desc: formData.description || "New category added",
          status: formData.status
        })
      });

      setCategories([response.data, ...categories]);
      toast.success("Category created successfully!");
      setIsModalOpen(false);
      setFormData({ name: "", description: "", status: "Active" });
    } catch (error) {
      toast.error(error.message || "Failed to add category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Toaster position="top-right" />
      
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
      `}</style>

      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in-up">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <FolderTree className="text-emerald-600" size={32} />
                Categories
              </h1>
              <p className="text-gray-500 font-medium text-sm mt-1">
                Organize and manage your menu groupings.
              </p>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-full flex items-center gap-2 font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <Plus size={18} />
              Add Category
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 mb-6 flex items-center animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <div className="relative w-full sm:w-96">
              <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Categories Table */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-[400px] animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 text-emerald-600">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Fetching categories...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="p-4 sm:px-6">Category Details</th>
                      <th className="p-4 text-center">Items Count</th>
                      <th className="p-4 text-center">Visibility</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-12 text-gray-400 font-medium">
                          No categories found.
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((cat, index) => {
                        const { icon: Icon, color } = getCategoryMeta(cat.name);
                        
                        return (
                          <tr 
                            key={cat.id} 
                            className="hover:bg-gray-50/60 transition-colors group"
                            style={{ animation: `fade-in-up 0.4s ease-out ${index * 0.1 + 0.3}s forwards`, opacity: 0 }}
                          >
                            <td className="p-4 sm:px-6 flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-105 ${color}`}>
                                <Icon size={24} />
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-base">{cat.name}</div>
                                <div className="text-xs text-gray-500 font-medium mt-0.5">{cat.desc}</div>
                              </div>
                            </td>

                            <td className="p-4 text-center">
                              <span className="inline-flex items-center justify-center bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-full text-xs border border-gray-200">
                                {cat.items || 0} Items
                              </span>
                            </td>

                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleToggleStatus(cat.id, cat.status)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                                  cat.status === "Active" ? "bg-emerald-600" : "bg-gray-300"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
                                    cat.status === "Active" ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                              <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${cat.status === 'Active' ? 'text-emerald-600' : 'text-gray-400'}`}>
                                {cat.status}
                              </div>
                            </td>

                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                  <Pencil size={18} />
                                </button>
                                <button 
                                  onClick={() => setDeleteItem(cat)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
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

      {/* ================= ADD CATEGORY MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 max-w-md w-full p-6 sm:p-8 relative overflow-hidden" style={{ animation: "fade-in-up 0.3s ease-out forwards" }}>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <FolderTree className="text-emerald-600" size={20} /> Add New Category
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Desserts"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Short Description</label>
                <textarea
                  required
                  placeholder="e.g. Sweet treats and cakes"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none h-24"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="Active">Active (Visible to Users)</option>
                  <option value="Inactive">Inactive (Hidden)</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} 
                  Create Category
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 max-w-sm w-full p-6 sm:p-8 text-center relative overflow-hidden" style={{ animation: "fade-in-up 0.3s ease-out forwards" }}>
            
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Delete Category?</h3>
            <p className="text-gray-500 font-medium text-sm mb-6">
              Are you sure you want to permanently remove <strong>{deleteItem.name}</strong>? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteItem(null)}
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