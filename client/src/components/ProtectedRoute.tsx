import { useAuth } from "@/context/AuthContext";
import { Redirect } from "wouter";
import type { UserRoleType } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRoleType;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    const redirectPath = user?.role === "manager" ? "/manager/dashboard" : "/employee/dashboard";
    return <Redirect to={redirectPath} />;
  }

  return <>{children}</>;
}
