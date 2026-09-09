import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { apiCall } from "../utils/api";
import toast, { Toaster } from "react-hot-toast";
import {
  Settings,
  Save,
  Building2,
  Clock3,
  Receipt,
  Percent,
  Image as ImageIcon,
  Phone,
  Mail,
  Store,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  BellRing,
  Database,
  Server,
  Code2,
  Loader2,
  Link as LinkIcon,
  UploadCloud
} from "lucide-react";

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("General");
  
  // Data States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Logo Upload States
  const [uploadMethod, setUploadMethod] = useState("device"); // "device" | "url"
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  // Settings State mapped directly to MySQL Schema
  const [settings, setSettings] = useState({
    canteenName: "",
    email: "",
    phone: "",
    workingHours: "",
    prepBuffer: "", 
    acceptingOrders: true,
    currency: "INR (₹)",
    gst: "",
    platformFee: "",
    receiptFooter: "",
    logoUrl: ""
  });

  // Fetch Live Settings on Mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall("/admin/settings", { method: "GET" });
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch system settings");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : (type === "number" ? Number(value) : value),
    }));
  };

  // Handle Local File Selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      // Clear out the URL setting if they switch to a local file
      setSettings(prev => ({ ...prev, logoUrl: "" })); 
    }
  };

  // Immediate Save to Database
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      let updatedData;

      // If there's a physical file, we MUST use multipart/form-data via native fetch
      if (logoFile) {
        const formData = new FormData();
        Object.keys(settings).forEach(key => formData.append(key, settings[key]));
        formData.append("logo", logoFile);

        const token = localStorage.getItem("authToken");
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        
        const response = await fetch(`${baseUrl}/admin/settings`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Failed to update configurations");
        updatedData = result.data;
      } else {
        // Standard JSON update if no physical file is attached
        const response = await apiCall("/admin/settings", {
          method: "PUT",
          body: JSON.stringify(settings)
        });
        updatedData = response.data;
      }
      
      setSettings(updatedData);
      setSaveSuccess(true);
      toast.success("Platform settings synchronized successfully!");
      setLogoFile(null); // Clear pending file so it doesn't re-upload
      
      // Reset success visual button after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      toast.error(error.message || "Failed to update configurations");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "General", icon: Building2, label: "General Profile" },
    { id: "Operations", icon: Store, label: "Store Operations" },
    { id: "Billing", icon: CreditCard, label: "Billing & Taxes" },
    { id: "System", icon: ShieldCheck, label: "System Info" },
  ];

  // Safely format the logo URL for preview
  const getLogoSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${url}`;
  };

  const displayLogo = getLogoSrc(logoPreview) || getLogoSrc(settings.logoUrl);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Toaster position="top-right" />
      
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>

      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full pb-24">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in-up">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <Settings className="text-emerald-600" size={32} />
                System Settings
              </h1>
              <p className="text-gray-500 font-medium text-sm mt-1">
                Configure your canteen management platform preferences.
              </p>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className={`px-6 py-3 rounded-full flex items-center gap-2 font-bold text-sm shadow-md transition-all active:scale-95 shrink-0 disabled:opacity-70 ${
                saveSuccess 
                  ? "bg-green-100 text-green-700 border border-green-200 shadow-none" 
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/10"
              }`}
            >
              {isSaving ? (
                <><Loader2 size={18} className="animate-spin" /> Saving...</>
              ) : saveSuccess ? (
                <><CheckCircle2 size={18} /> Saved Successfully</>
              ) : (
                <><Save size={18} /> Save Changes</>
              )}
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-emerald-600">
              <Loader2 size={40} className="animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Loading system configurations...</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
              
              {/* Left Sidebar Tabs */}
              <div className="w-full lg:w-64 shrink-0">
                <div className="bg-white rounded-[1.5rem] p-3 shadow-sm border border-gray-100 flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                          isActive 
                            ? "bg-emerald-50 text-emerald-700" 
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <Icon size={18} className={isActive ? "text-emerald-600" : "text-gray-400"} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-6 sm:p-8 min-h-[500px]">
                
                {/* ================= GENERAL PROFILE ================= */}
                {activeTab === "General" && (
                  <div className="animate-fade-in space-y-8">
                    <div className="border-b border-gray-100 pb-4 mb-6">
                      <h2 className="text-xl font-bold text-gray-900">General Profile</h2>
                      <p className="text-sm text-gray-500 mt-1">Basic information and branding for the canteen.</p>
                    </div>

                    {/* Custom Logo Upload Section */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h4 className="font-bold text-gray-900 mb-4">Brand Logo Configuration</h4>
                      
                      <div className="flex flex-col sm:flex-row gap-8 items-start">
                        {/* Logo Preview */}
                        <div className="w-32 h-32 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 shrink-0 overflow-hidden shadow-sm relative">
                          {displayLogo ? (
                            <img src={displayLogo} alt="Brand Preview" className="w-full h-full object-contain p-2" />
                          ) : (
                            <>
                              <ImageIcon size={32} className="mb-2 opacity-50" />
                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">No Logo</span>
                            </>
                          )}
                        </div>

                        {/* Upload Controls */}
                        <div className="flex-1 w-full space-y-4">
                          
                          {/* Upload Method Toggles */}
                          <div className="flex p-1 bg-white rounded-xl border border-gray-200 w-fit">
                            <button
                              onClick={() => setUploadMethod("device")}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${uploadMethod === "device" ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:text-gray-900"}`}
                            >
                              <UploadCloud size={14} /> Upload File
                            </button>
                            <button
                              onClick={() => setUploadMethod("url")}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${uploadMethod === "url" ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:text-gray-900"}`}
                            >
                              <LinkIcon size={14} /> Image URL
                            </button>
                          </div>

                          {/* Inputs based on selection */}
                          {uploadMethod === "device" ? (
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                              />
                              <p className="text-xs text-gray-500 mt-2 font-medium">Recommended size: 512x512px. Supported formats: JPG, PNG, SVG.</p>
                            </div>
                          ) : (
                            <div>
                              <input
                                type="url"
                                name="logoUrl"
                                value={settings.logoUrl || ""}
                                onChange={handleChange}
                                placeholder="https://example.com/logo.png"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                              />
                              <p className="text-xs text-gray-500 mt-2 font-medium">Provide a direct secure (HTTPS) link to your logo image.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Canteen Name</label>
                        <div className="relative group">
                          <Building2 size={16} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                          <input
                            type="text"
                            name="canteenName"
                            value={settings.canteenName || ""}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Support Email</label>
                        <div className="relative group">
                          <Mail size={16} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                          <input
                            type="email"
                            name="email"
                            value={settings.email || ""}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Support Phone</label>
                        <div className="relative group">
                          <Phone size={16} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                          <input
                            type="text"
                            name="phone"
                            value={settings.phone || ""}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= OPERATIONS ================= */}
                {activeTab === "Operations" && (
                  <div className="animate-fade-in space-y-8">
                    <div className="border-b border-gray-100 pb-4 mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Store Operations</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage timings and order flow controls.</p>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-emerald-900 flex items-center gap-2">
                          <BellRing size={18} className="text-emerald-600" /> Accept New Orders
                        </h4>
                        <p className="text-sm text-emerald-700 mt-1">Toggle off to immediately stop receiving incoming orders on the user app.</p>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, acceptingOrders: !settings.acceptingOrders})}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                          settings.acceptingOrders ? "bg-emerald-600" : "bg-gray-300"
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
                          settings.acceptingOrders ? "translate-x-5" : "translate-x-0"
                        }`}/>
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Standard Working Hours</label>
                        <div className="relative group">
                          <Clock3 size={16} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                          <input
                            type="text"
                            name="workingHours"
                            value={settings.workingHours || ""}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Order Prep Buffer (Mins)</label>
                        <div className="relative group">
                          <Clock3 size={16} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                          <input
                            type="number"
                            name="prepBuffer"
                            value={settings.prepBuffer || ""}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-medium">Default time added to estimated delivery.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= BILLING & TAXES ================= */}
                {activeTab === "Billing" && (
                  <div className="animate-fade-in space-y-8">
                    <div className="border-b border-gray-100 pb-4 mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Billing & Taxes</h2>
                      <p className="text-sm text-gray-500 mt-1">Configure taxes, fees, and receipt details.</p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Base Currency</label>
                        <select
                          name="currency"
                          value={settings.currency || "INR (₹)"}
                          onChange={handleChange}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                        >
                          <option value="INR (₹)">INR (₹)</option>
                          <option value="USD ($)">USD ($)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">GST Rate (%)</label>
                        <div className="relative group">
                          <Percent size={16} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                          <input
                            type="number"
                            step="0.1"
                            name="gst"
                            value={settings.gst === undefined ? "" : settings.gst}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Platform Fee (₹)</label>
                        <div className="relative group">
                          <Receipt size={16} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                          <input
                            type="number"
                            step="0.01"
                            name="platformFee"
                            value={settings.platformFee === undefined ? "" : settings.platformFee}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Receipt Footer Message</label>
                      <textarea
                        rows="3"
                        name="receiptFooter"
                        value={settings.receiptFooter || ""}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                      />
                      <p className="text-xs text-gray-400 mt-2 font-medium">This message appears at the bottom of digital and printed receipts.</p>
                    </div>
                  </div>
                )}

                {/* ================= SYSTEM INFO ================= */}
                {activeTab === "System" && (
                  <div className="animate-fade-in space-y-8">
                    <div className="border-b border-gray-100 pb-4 mb-6">
                      <h2 className="text-xl font-bold text-gray-900">System Information</h2>
                      <p className="text-sm text-gray-500 mt-1">Read-only technical specs of the current deployment.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-500">
                          <Code2 size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">System Version</p>
                          <p className="font-bold text-gray-900">v2.4.0 (Stable)</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-green-500">
                          <Server size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Environment</p>
                          <p className="font-bold text-gray-900">Production Node</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500">
                          <Database size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Database Status</p>
                          <p className="font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> SQL Connected
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-purple-500">
                          <Clock3 size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last DB Sync</p>
                          <p className="font-bold text-gray-900">{new Date(settings.updatedAt || new Date()).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}