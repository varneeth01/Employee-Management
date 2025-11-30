import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard";
import MarkAttendancePage from "@/pages/employee/MarkAttendancePage";
import MyHistoryPage from "@/pages/employee/MyHistoryPage";
import ProfilePage from "@/pages/employee/ProfilePage";
import ManagerDashboard from "@/pages/manager/ManagerDashboard";
import AllAttendancePage from "@/pages/manager/AllAttendancePage";
import ReportsPage from "@/pages/manager/ReportsPage";
import TeamCalendarPage from "@/pages/manager/TeamCalendarPage";
import { Loader2 } from "lucide-react";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-border/50 px-6 py-4 bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto bg-background">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function RootRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Redirect to={user?.role === "manager" ? "/manager/dashboard" : "/employee/dashboard"} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />

      <Route path="/employee/dashboard">
        <ProtectedRoute requiredRole="employee">
          <AuthenticatedLayout>
            <EmployeeDashboard />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/employee/mark-attendance">
        <ProtectedRoute requiredRole="employee">
          <AuthenticatedLayout>
            <MarkAttendancePage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/employee/history">
        <ProtectedRoute requiredRole="employee">
          <AuthenticatedLayout>
            <MyHistoryPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/employee/profile">
        <ProtectedRoute requiredRole="employee">
          <AuthenticatedLayout>
            <ProfilePage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/manager/dashboard">
        <ProtectedRoute requiredRole="manager">
          <AuthenticatedLayout>
            <ManagerDashboard />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/manager/attendance">
        <ProtectedRoute requiredRole="manager">
          <AuthenticatedLayout>
            <AllAttendancePage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/manager/team-calendar">
        <ProtectedRoute requiredRole="manager">
          <AuthenticatedLayout>
            <TeamCalendarPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/manager/reports">
        <ProtectedRoute requiredRole="manager">
          <AuthenticatedLayout>
            <ReportsPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
