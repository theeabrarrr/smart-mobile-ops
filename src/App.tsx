import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import AIAssistant from "./pages/AIAssistant";
import Profile from "./pages/Profile";
import DashboardLayout from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";
import { AdminRoute } from "./components/AdminRoute";
import { RoleBasedRoute } from "./components/RoleBasedRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import RoleManagement from "./pages/admin/RoleManagement";
import SubscriptionManager from "./pages/admin/SubscriptionManager";
import InvoiceManagement from "./pages/admin/InvoiceManagement";
import SystemLogs from "./pages/admin/SystemLogs";
import MyInvoices from "./pages/MyInvoices";
import InvoiceDetail from "./pages/InvoiceDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="lovable-ui-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            } />
            <Route path="/customers" element={
              <DashboardLayout>
                <Customers />
              </DashboardLayout>
            } />
            <Route path="/inventory" element={
              <DashboardLayout>
                <Inventory />
              </DashboardLayout>
            } />
            <Route path="/sales" element={
              <DashboardLayout>
                <Sales />
              </DashboardLayout>
            } />
            <Route path="/purchases" element={
              <DashboardLayout>
                <Purchases />
              </DashboardLayout>
            } />
            <Route path="/expenses" element={
              <DashboardLayout>
                <Expenses />
              </DashboardLayout>
            } />
            <Route path="/reports" element={
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            } />
            <Route path="/ai-assistant" element={
              <DashboardLayout>
                <AIAssistant />
              </DashboardLayout>
            } />
            <Route path="/profile" element={
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            } />
            <Route path="/invoices" element={
              <DashboardLayout>
                <MyInvoices />
              </DashboardLayout>
            } />
            <Route path="/invoice/:id" element={
              <DashboardLayout>
                <InvoiceDetail />
              </DashboardLayout>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <DashboardLayout>
                  <UsersManagement />
                </DashboardLayout>
              </AdminRoute>
            } />
            <Route path="/admin/roles" element={
              <AdminRoute>
                <DashboardLayout>
                  <RoleManagement />
                </DashboardLayout>
              </AdminRoute>
            } />
            <Route path="/admin/subscriptions" element={
              <AdminRoute>
                <DashboardLayout>
                  <SubscriptionManager />
                </DashboardLayout>
              </AdminRoute>
            } />
            <Route path="/admin/invoices" element={
              <AdminRoute>
                <DashboardLayout>
                  <InvoiceManagement />
                </DashboardLayout>
              </AdminRoute>
            } />
            <Route path="/admin/logs" element={
              <AdminRoute>
                <DashboardLayout>
                  <SystemLogs />
                </DashboardLayout>
              </AdminRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
