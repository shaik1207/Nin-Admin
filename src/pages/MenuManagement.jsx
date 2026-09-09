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
  X,
  Image as ImageIcon,
  Clock,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  CalendarDays,
  Filter
} from "lucide-react";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function MenuManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Detect current day
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  // Primary Tabs (Days) & Secondary Filters
  const [activeDayTab, setActiveDayTab] = useState(today); // Defaults to current day
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data State
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null); 
  
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Form State includes new 'day' field
  const [formData, setFormData] = useState({
    name: "",
    category: "", 
    price: "",
    time: getCurrentTime(),
    badge: "None",
    day: "Everyday", // New field
    imageFile: null,
    existingImage: null, 
    status: "Available"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [menuRes, categoryRes] = await Promise.all([
        apiCall("/admin/menu", { method: "GET" }),
        apiCall("/admin/categories", { method: "GET" })
      ]);
      
      setFoods(menuRes.data || []);
      
      const activeCategories = (categoryRes.data || []).filter(cat => cat.status === 'Active');
      setCategories(activeCategories);

    } catch (error) {
      toast.error("Failed to load menu data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Available" ? "Unavailable" : "Available";
    setFoods(foods.map(item => item.id === id ? { ...item, status: newStatus } : item));

    try {
      await apiCall(`/admin/menu/${id}/status`, { 
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      toast.success(`Item marked as ${newStatus}`);
    } catch (error) {
      setFoods(foods.map(item => item.id === id ? { ...item, status: currentStatus } : item));
      toast.error(error.message || "Failed to update status");
    }
  };

  const confirmDelete = (item) => {
    setDeleteItem(item);
  };

  const executeDelete = async () => {
    if (!deleteItem) return;
    try {
      await apiCall(`/admin/menu/${deleteItem.id}`, { method: "DELETE" });
      setFoods(foods.filter(item => item.id !== deleteItem.id));
      toast.success(`${deleteItem.name} deleted successfully`);
      setDeleteItem(null);
    } catch (error) {
      toast.error(error.message || "Failed to delete item");
    }
  };

  const handleOpenAddModal = () => {
    if (categories.length === 0) {
      toast.error("Please add a Category in Category Management first.");
      return;
    }

    setEditingId(null);
    setFormData({
      name: "",
      category: categories[0]?.name || "", 
      price: "",
      time: getCurrentTime(),
      badge: "None",
      day: activeDayTab === "All Items" ? "Everyday" : activeDayTab, // Default to the tab you are currently viewing
      imageFile: null,
      existingImage: null,
      status: "Available"
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      time: item.time,
      badge: item.badge || "None",
      day: item.day || "Everyday", // Pre-fill day
      imageFile: null, 
      existingImage: item.image, 
      status: item.status
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!editingId && !formData.imageFile) {
      toast.error("Please select a product image.");
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("category", formData.category);
    data.append("price", formData.price);
    data.append("time", formData.time); 
    data.append("badge", formData.badge === "None" ? "" : formData.badge);
    data.append("day", formData.day); // Sending day to backend
    data.append("status", formData.status);
    
    if (formData.imageFile) {
      data.append("image", formData.imageFile); 
    }

    try {
      const token = localStorage.getItem("authToken");
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const endpoint = editingId ? `/admin/menu/${editingId}` : `/admin/menu`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: method,
        headers: { "Authorization": `Bearer ${token}` },
        body: data,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to save item");

      const savedItem = {
        ...result.data,
        image: result.data.image.startsWith('http') ? result.data.image : `http://localhost:5000${result.data.image}`
      };

      if (editingId) {
        setFoods(foods.map(item => item.id === editingId ? savedItem : item));
        toast.success("Item updated successfully!");
      } else {
        setFoods([savedItem, ...foods]);
        toast.success("Item published to menu!");
      }
      
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to save menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced Filter logic for Weekly Menu
  const filteredFoods = foods.filter(item => {
    const itemDay = item.day || "Everyday"; // Fallback for old items
    
    // Day Matching
    const matchesDay = activeDayTab === "All Items" || itemDay === activeDayTab || itemDay === "Everyday";
    // Category Matching
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    // Search Matching
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesDay && matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Toaster position="top-right" />
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                Weekly Menu Planner
              </h1>
              <p className="text-gray-500 font-medium text-sm mt-1">
                Schedule items for specific days or set them to appear every day.
              </p>
            </div>

            <button 
              onClick={handleOpenAddModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-full flex items-center gap-2 font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>

          {/* Weekly Days Navigation */}
          <div className="bg-white rounded-[1.5rem] p-3 shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0">
              <button
                onClick={() => setActiveDayTab("All Items")}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeDayTab === "All Items" ? "bg-gray-900 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Filter size={16} /> All Items
              </button>
              
              <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block"></div>

              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  onClick={() => setActiveDayTab(day)}
                  className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex flex-col items-center justify-center min-w-[100px] ${
                    activeDayTab === day
                      ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-500 shadow-sm"
                      : "bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100"
                  }`}
                >
                  {day}
                  {today === day && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                      Today
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Filters: Category & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-sm appearance-none"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-3 pointer-events-none text-gray-400">▼</div>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 shadow-sm rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Products List Table */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 text-emerald-600">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Fetching menu from database...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="p-4 sm:px-6">Product Details</th>
                      <th className="p-4">Assigned Day</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4 text-center">Actions</th>
                      <th className="p-4 sm:px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {filteredFoods.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-20 text-gray-400 font-medium">
                          <CalendarDays size={48} className="mx-auto mb-4 opacity-20" />
                          No items scheduled for {activeDayTab !== "All Items" ? activeDayTab : "the menu"}.
                        </td>
                      </tr>
                    ) : (
                      filteredFoods.map((food) => (
                        <tr key={food.id} className="hover:bg-gray-50/60 transition-colors group">
                          
                          <td className="p-4 sm:px-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 shadow-inner">
                              <img 
                                src={food.image?.startsWith('http') ? food.image : `http://localhost:5000${food.image}`} 
                                alt={food.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                              />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 flex items-center gap-2">
                                {food.name}
                                {food.badge && (
                                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wide">
                                    {food.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                              food.day === 'Everyday' || !food.day
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'bg-orange-50 text-orange-600'
                            }`}>
                              {food.day || "Everyday"}
                            </span>
                          </td>

                          <td className="p-4 font-medium text-gray-600">
                            {food.category}
                          </td>

                          <td className="p-4 font-black text-emerald-700">
                            ₹{food.price}
                          </td>

                          <td className="p-4">
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => handleOpenEditModal(food)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Pencil size={16} />
                              </button>
                              <button 
                                onClick={() => confirmDelete(food)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>

                          <td className="p-4 sm:px-6 text-right">
                            <button
                              onClick={() => toggleStatus(food.id, food.status)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                                food.status === "Available" ? "bg-emerald-600" : "bg-gray-300"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
                                  food.status === "Available" ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ================= ADD/EDIT PRODUCT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 max-w-lg w-full p-6 sm:p-8 relative overflow-hidden">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Sparkles className="text-emerald-600" size={20} /> 
                {editingId ? "Edit Menu Item" : "Schedule New Item"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Food Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Fried Rice"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                    required
                  >
                    {categories.length === 0 && <option value="">No categories available</option>}
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Schedule Day</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({...formData, day: e.target.value})}
                    className="w-full bg-orange-50/50 border border-orange-200 rounded-xl px-4 py-3 text-sm font-bold text-orange-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                  >
                    <option value="Everyday">Everyday (Always show)</option>
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Badge Tag</label>
                  <select
                    value={formData.badge}
                    onChange={(e) => setFormData({...formData, badge: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="None">None</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Popular">Popular</option>
                    <option value="Hot">Hot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 90"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                  <span>Product Image</span>
                  {editingId && !formData.imageFile && <span className="text-emerald-600 text-[10px]">Current image retained</span>}
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({...formData, imageFile: e.target.files[0]})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )} 
                  {editingId ? "Save Changes" : "Publish to Schedule"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= CUSTOM DELETE CONFIRMATION MODAL ================= */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 max-w-sm w-full p-6 sm:p-8 text-center relative overflow-hidden">
            
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Delete Item?</h3>
            <p className="text-gray-500 font-medium text-sm mb-6">
              Are you sure you want to permanently remove this item from the menu? This action cannot be undone.
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-4 mb-8 text-left">
              <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden shrink-0 shadow-sm">
                <img 
                  src={deleteItem.image?.startsWith('http') ? deleteItem.image : `http://localhost:5000${deleteItem.image}`} 
                  alt={deleteItem.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{deleteItem.name}</h4>
                <p className="text-xs text-gray-500 font-medium">{deleteItem.category} • ₹{deleteItem.price}</p>
              </div>
            </div>

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