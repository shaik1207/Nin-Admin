import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup"; // Added Signup Import
import Dashboard from "./pages/Dashboard";
import MenuManagement from "./pages/MenuManagement";
import CategoryManagement from "./pages/CategoryManagement";
import UserManagement from "./pages/UserManagement";
import CounterManagement from "./pages/CounterManagement";
import Reports from "./pages/Reports";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";

// -----------------------------
// Protected Layout (Gatekeeper)
// -----------------------------
function ProtectedLayout() {
  // Check for the new token/auth system defined in the updated Login/Signup components
  const isAuthenticated = localStorage.getItem("authToken") !== null || localStorage.getItem("adminAuth") === "true";
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}

// -----------------------------
// App
// -----------------------------
export default function App() {
  // Check auth status for the root routes
  const isAuthenticated = localStorage.getItem("authToken") !== null || localStorage.getItem("adminAuth") === "true";

  return (
    <BrowserRouter>
      <Routes>
        
        {/* Public Routes - Redirect to dashboard if already logged in */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        
        {/* Added Signup Route */}
        <Route 
          path="/signup" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} 
        />

        {/* Protected Routes Group */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/menu" element={<MenuManagement />} />
          <Route path="/categories" element={<CategoryManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/counters" element={<CounterManagement />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Redirect Unknown Routes */}
        <Route
          path="*"
          element={
            <Navigate
              to={isAuthenticated ? "/dashboard" : "/"}
              replace
            />
          }
        />
        
      </Routes>
    </BrowserRouter>
  );
}